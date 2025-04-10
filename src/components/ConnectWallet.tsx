import React, { useState } from "react";
import { motion } from "framer-motion";
import { useConnect, useAccount } from "wagmi";
import { useStore } from "../store/onboardingStore";
import { metaMask } from "wagmi/connectors";
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";
import { Sparkles } from "lucide-react";
import { api } from "../services/api";
import { ethers } from "ethers";
import { Video } from "@/components/video/video";
import { sign } from "crypto";

const ConnectWallet = () => {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { setStep, setUser } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine);
  };

  const signMessage = async (address: string): Promise<string> => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const message = `Welcome to Helios! Please sign this message to verify your wallet ownership.\n\nWallet: ${address}`;
      return (await signer).signMessage(message);
    } catch (error) {
      console.error("Signing error:", error);
      throw new Error("Failed to sign message");
    }
  };

  const handleSignAndLogin = async (walletAddress: string) => {
    try {
      const signature = await signMessage(walletAddress);

      try {
        // Try to register first
        const registerResponse = await api.register(walletAddress, signature);
        console.log("Sign Message", registerResponse);
        setUser(registerResponse.user);
        setStep(2);
      } catch (registerError: any) {
        // If registration fails with 400 (wallet already registered), try login
        if (registerError.message === "Wallet already registered") {
          const loginResponse = await api.login(walletAddress, signature);
          setUser(loginResponse.user);
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

  const handleConnect = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // If already connected, proceed with signing
      if (isConnected && address) {
        await handleSignAndLogin(address);
        return;
      }

      // Connect wallet
      const connector = metaMask();
      const result = connect({ connector }) as unknown as { account?: string };

      if (!result?.account) {
        throw new Error("No account found");
      }

      await handleSignAndLogin(result.account);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setError(error.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F2F5FF]">
      <div className="bg-cover bg-center h-screen">
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
                <h1 className="text-3xl xl:text-7xl lg:text-6xl md:text-5xl sm:text-4xl text-[#002DCB] mb-10 leading-tight italic -my-20">
                  Welcome to the
                  <span className="block bg-clip-text text-[#060F32] not-italic">
                    Helios&nbsp;
                    <span className="relative inline-block">
                      <span>Testnet</span>
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#002DCB] transform rotate-[-1.5deg]"></span>
                    </span>
                  </span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className={`px-6 py-4 bg-[#002DCB] text-white rounded-full text-xl font-semibold mt-4
                       hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
                       shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]
                       ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isLoading
                    ? "Connecting..."
                    : isConnected
                    ? "Sign Message"
                    : "Connect Wallet"}
                </button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg"
                  >
                    {error}
                  </motion.div>
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
