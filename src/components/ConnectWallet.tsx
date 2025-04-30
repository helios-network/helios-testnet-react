import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { useStore } from "../store/onboardingStore";
import { metaMask } from "wagmi/connectors";
import {
  Sparkles,
  Wallet,
  ShieldCheck,
  ArrowRightCircle,
  AlertTriangle,
} from "lucide-react";
import { api } from "../services/api";
import { ethers } from "ethers";
import { Video } from "@/components/video/video";

const ConnectWallet = () => {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { setStep, setUser, resetStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsInviteCode, setNeedsInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const [previousConnectionState, setPreviousConnectionState] = useState<
    boolean | null
  >(null);

  // Track connection state changes and handle disconnections
  useEffect(() => {
    // If we had a connection and now we don't, handle the disconnect
    if (previousConnectionState === true && !isConnected) {
      handleDisconnect();
    }

    // Update previous connection state
    setPreviousConnectionState(isConnected);
  }, [isConnected]);

  // Handle wallet disconnection - this runs when the wallet gets disconnected directly from metamask
  const handleDisconnect = () => {
    console.log("Wallet disconnected, clearing session data");

    // Clear JWT token from localStorage
    localStorage.removeItem("jwt_token");

    // Reset all state
    resetStore();
    setUser(null);
    setStep(0);
    setError(null);
    setNeedsInviteCode(false);
    setPendingSignature(null);
    setPendingWallet(null);
    setInviteCode("");
    setInviteError(null);
  };

  // Explicitly check token on mount
  useEffect(() => {
    // Double-check to ensure we're not showing the connect UI when no token exists
    if (isConnected) {
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        console.log(
          "No token found but wallet connected, resetting to initial state"
        );
        handleDisconnect();
      }
    }
  }, []);

  // Automatically trigger signing when wallet is connected
  useEffect(() => {
    const checkAndSignMessage = async () => {
      if (isConnected && address && !isLoading && !needsInviteCode) {
        // Check if we have a valid JWT token
        const token = localStorage.getItem("jwt_token");
        if (!token) {
          // No token found, trigger the sign and login flow
          try {
            setIsLoading(true);
            await handleSignAndAuthenticate();
          } catch (error: any) {
            console.error("Auto-sign error:", error);
            setError(error.message || "Failed to authenticate automatically");
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    checkAndSignMessage();
  }, [isConnected, address]);

  const signMessage = async (address: string): Promise<string> => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const message = `Welcome to Helios! Please sign this message to verify your wallet ownership.\n\nWallet: ${address}`;
      console.log("--signMessage--", message);
      return (await signer).signMessage(message);
    } catch (error) {
      console.error("Signing error:", error);
      throw new Error("Failed to sign message");
    }
  };

  const handleSignAndAuthenticate = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      let signature;
      try {
        signature = await signMessage(address);
      } catch (signError: any) {
        // Check for user rejection errors and display a friendly message
        console.error("Signature error:", signError);
        if (
          signError.code === 4001 || // Standard MetaMask rejection code
          signError.message?.includes("rejected") ||
          signError.message?.includes("denied")
        ) {
          throw new Error("You declined the signature request");
        }
        throw signError; // Re-throw if it's not a user rejection
      }

      try {
        // Try login first for existing users
        const loginResponse = await api.login(address, signature);
        console.log("Login successful:", loginResponse);

        // Ensure we're using the user object correctly
        const user = loginResponse.user;
        if (!user) {
          throw new Error("No user data received from login");
        }

        setUser(user);
        setStep(2);
      } catch (loginError: any) {
        // If login fails, the wallet is not registered
        console.log("Login failed, new user:", loginError);

        // Store signature and wallet for later invite code submission
        setPendingSignature(signature);
        setPendingWallet(address);
        setNeedsInviteCode(true);
      }
    } catch (error: any) {
      console.error("Failed to sign and authenticate:", error);
      setError(error.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignAndLogin = async (walletAddress: string) => {
    try {
      const signature = await signMessage(walletAddress);
      console.log("handleSignAndLogin", signature);
      try {
        // Try to register first
        const registerResponse = await api.register(walletAddress, signature);
        console.log(
          "handleSignAndLogin registerResponse",
          signature,
          registerResponse
        );

        // Ensure we're using the user object correctly
        const user = registerResponse.user;
        if (!user) {
          throw new Error("No user data received from registration");
        }

        setUser(user);
        setStep(2);
      } catch (registerError: any) {
        // If registration fails with 400 (wallet already registered), try login
        if (registerError.message === "Wallet already registered") {
          console.log("Wallet Registered");
          const loginResponse = await api.login(walletAddress, signature);
          console.log("Wallet Registered", loginResponse);

          // Ensure we're using the user object correctly
          const user = loginResponse.user;
          if (!user) {
            throw new Error("No user data received from login");
          }

          setUser(user);
          setStep(2);
        } else {
          throw registerError;
        }
      }
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to sign message or authenticate"
      );
    }
  };

  const handleRegisterWithInvite = async () => {
    if (!inviteCode.trim()) {
      setInviteError("Invite code is required");
      return;
    }

    if (!pendingWallet || !pendingSignature) {
      setInviteError("Authentication error. Please try again.");
      return;
    }

    setIsLoading(true);
    setInviteError(null);

    try {
      // Use a modified register endpoint that accepts an invite code
      const registerResponse = await api.register(
        pendingWallet,
        pendingSignature,
        inviteCode.trim()
      );

      console.log("Register with invite response:", registerResponse);

      // Ensure we're using the user object correctly
      const user = registerResponse.user;
      if (!user) {
        throw new Error("No user data received from registration");
      }

      setUser(user);
      setNeedsInviteCode(false);
      setStep(2);
    } catch (error: any) {
      console.error("Failed to register with invite:", error);
      setInviteError(error.message || "Invalid invite code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Connect wallet first if not connected
      if (!isConnected) {
        const connector = metaMask();
        await connect({ connector });
        // Wallet connection will trigger the useEffect which will handle signing
        setIsLoading(false);
        return;
      }

      // If we have a wallet address but need invite code
      if (needsInviteCode) {
        handleRegisterWithInvite();
        return;
      }

      // If already connected, proceed with signing
      if (address) {
        await handleSignAndAuthenticate();
      } else {
        throw new Error("No wallet address found");
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setError(error.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const clearInviteState = () => {
    setNeedsInviteCode(false);
    setPendingSignature(null);
    setPendingWallet(null);
    setInviteCode("");
    setInviteError(null);
  };

  const renderButtonText = () => {
    if (isLoading) {
      if (needsInviteCode) return "Verifying code...";
      return "Processing...";
    }
    if (!isConnected) return "Connect Wallet";
    if (needsInviteCode) return "Submit Invite";
    return "Connect"; // Changed from "Processing..." to "Connect" for clarity
  };

  return (
    <div className="bg-[#F2F5FF] min-h-screen">
      <div className="bg-cover bg-center min-h-screen">
        <div className="relative w-full h-full">
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-0 pointer-events-none">
            <div className="min-w-300 w-400 h-50 object-none">
              <Video id="helios-home-hero" />
            </div>
          </div>

          <div className="relative z-10 min-h-screen flex items-center justify-center px-4 bg-[url(/images/Gradient.png)] bg-no-repeat bg-cover bg-center w-full h-full">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="mb-6">
                  <img
                    src="/images/Helios-Testnet.png"
                    alt="Helios Testnet"
                    className="h-24 mx-auto mb-4 mt-8 md:mt-0"
                  />
                </div>

                <h1 className="text-4xl xl:text-7xl lg:text-6xl md:text-5xl sm:text-4xl text-[#002DCB] mb-6 leading-tight">
                  Welcome to the
                  <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#002DCB] to-[#4F6BFF]">
                    Helios Mission Hub
                  </span>
                </h1>

                <p className="text-lg text-[#5C6584] max-w-2xl mx-auto mb-10">
                Start testing Helios, a scalable blockchain network built for secure cross-chain interaction.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                {isConnected && needsInviteCode ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 max-w-md w-full"
                  >
                     <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#002DCB]/10">
                      <div className="flex items-center mb-4">
                        <span className="w-10 h-10 rounded-full bg-[#E2EBFF] flex items-center justify-center mr-3">
                          <ShieldCheck className="h-5 w-5 text-[#002DCB]" />
                        </span>
                        <div>
                          <h2 className="text-xl font-bold text-[#002DCB]">
                            Exclusive Access
                          </h2>
                          <p className="text-[#5C6584] text-sm">Enter your invite code to continue</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Enter your invite code"
                            className={`w-full px-4 py-3 pl-10 text-base font-mono tracking-wide border ${
                              inviteError
                                ? "border-red-400 bg-red-50/50"
                                : "border-gray-300"
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002DCB] transition-all duration-200`}
                            style={{ minWidth: "280px" }}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#002DCB]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          {inviteCode && !isLoading && !inviteError && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </motion.div>
                          )}
                        </div>

                        {inviteError && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <p className="text-red-600 text-sm font-medium">
                              {inviteError}
                            </p>
                          </motion.div>
                        )}

                        <p className="text-xs text-gray-500 mt-3 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1 text-[#002DCB]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Need an invite code?{" "}
                          <a
                            href="https://discord.com/invite/AjpJnJxt5e"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#002DCB] hover:underline ml-1"
                          >
                            Contact us on Discord
                          </a>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                <motion.button
                  onClick={handleConnect}
                  disabled={isLoading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`web3-button py-4 px-8 text-xl
                       ${isLoading ? "opacity-80 cursor-not-allowed" : ""}
                       flex items-center justify-center gap-3`}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : isConnected ? (
                    <>
                      {needsInviteCode ? (
                        <>
                          <span>{renderButtonText()}</span>
                        </>
                      ) : (
                        <>
                          <ArrowRightCircle className="h-5 w-5" />
                          <span>Continue</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </motion.button>

                {isConnected && needsInviteCode && (
                  <button
                    onClick={clearInviteState}
                    className="mt-2 text-sm text-[#002DCB] hover:underline flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back
                  </button>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl max-w-md shadow-sm"
                  >
                    <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-red-700 mb-1">
                        Connection Error
                      </h3>
                      <p className="text-sm">{error}</p>
                    </div>
                  </motion.div>
                )}

                {(!isConnected || !needsInviteCode) && (
                  <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
                    <div className="backdrop-blur-sm bg-white/30 border border-white/50 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:bg-white/40 text-center flex flex-col h-full">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#002DCB] to-[#4F6BFF] flex items-center justify-center mx-auto mb-4 shadow-md">
                        <Sparkles className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-[#002DCB] font-bold text-xl mb-3">
                        Explore Helios
                      </h3>
                      <p className="text-[#002DCB] font-medium">
                        Use the Helios Testnet to run real transactions, test cross-chain features, and interact directly with the network.
                      </p>
                    </div>

                    <div className="backdrop-blur-sm bg-white/30 border border-white/50 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:bg-white/40 text-center flex flex-col h-full">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#002DCB] to-[#4F6BFF] flex items-center justify-center mx-auto mb-4 shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-7 w-7 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-[#002DCB] font-bold text-xl mb-3">
                        Earn Rewards
                      </h3>
                      <p className="text-[#002DCB] font-medium">
                        Earn XP by completing on-chain tasks, testing features, and helping improve the network.
                      </p>
                    </div>

                    <div className="backdrop-blur-sm bg-white/30 border border-white/50 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:bg-white/40 text-center flex flex-col h-full">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#002DCB] to-[#4F6BFF] flex items-center justify-center mx-auto mb-4 shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-7 w-7 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                          />
                        </svg>
                      </div>
                      <h3 className="text-[#002DCB] font-bold text-xl mb-3">
                        Contribute
                      </h3>
                      <p className="text-[#002DCB] font-medium">
                        Share feedback, report issues, and play a role in shaping Helios ecosystem as it grows.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;
