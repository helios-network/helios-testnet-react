import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/onboardingStore";
import Mascot from "./Mascot";
import XPToast from "./XPToast";
import { api } from "../services/api";
import Dashboard from "./Dashboard";
import { Video } from "@/components/video/video";

const TOTAL_STEPS = 5;

// Transaction notification component for faucet claims
const TransactionNotification = ({ txHash, amount, token, onClose }: { 
  txHash: string; 
  amount: number; 
  token: string;
  onClose: () => void; 
}) => {
  const explorerUrl = `https://explorer.helioschainlabs.org/tx/${txHash}`;
  
  return (
    <div className="fixed bottom-8 right-8 bg-white shadow-lg rounded-lg p-4 max-w-md z-50 border-l-4 border-green-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-green-700">Tokens Received!</h3>
          <p className="text-gray-700 mt-1">
            You received {amount} {token} tokens in your wallet
          </p>
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            View transaction on explorer
          </a>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const OnboardingFlow = () => {
  const { step, setStep, addXP, fetchOnboardingProgress, onboardingProgress } =
    useStore();
  const [showXPToast, setShowXPToast] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingXP, setPendingXP] = useState(0);
  const [txNotification, setTxNotification] = useState<{
    show: boolean;
    txHash?: string;
    amount?: number;
    token?: string;
  }>({ show: false });

  useEffect(() => {
    const initializeProgress = async () => {
      try {
        const progress = await api.getOnboardingProgress();

        // Map step keys to component steps
        const stepMapping = {
          add_helios_network: 3,
          claim_from_faucet: 4,
          mint_early_bird_nft: 5,
        };

        if (progress.completedSteps.length >= Object.keys(stepMapping).length) {
          setStep(7);
          return;
        }

        // If we have completed steps, find the next step
        if (progress.completedSteps && progress.completedSteps.length > 0) {
          const lastCompletedStep =
            progress.completedSteps[progress.completedSteps.length - 1];
          const nextStep = stepMapping[lastCompletedStep as keyof typeof stepMapping] + 1;

          // If all steps are completed, go to dashboard
          if (nextStep > 5) {
            setStep(7);
          } else {
            setStep(nextStep);
          }
        } else {
          // If no steps completed, start from beginning
          setStep(2);
        }
      } catch (error) {
        console.error("Failed to fetch onboarding progress:", error);
      }
    };

    initializeProgress();
  }, [setStep]);

  const checkNetworkExists = async () => {
    try {
      const ethereum = window.ethereum as any;
      const chainId = await ethereum?.request({ method: "eth_chainId" });
      if (chainId === "0xa410") {
        return true;
      }

      await ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xa410" }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902 || error.code === -32603) {
        return false;
      }
      throw error;
    }
  };

  const handleAddNetwork = async () => {
    console.log("handleAddNetwork");
    try {
      setIsLoading(true);
      const progress = await api.getOnboardingProgress();

      if (progress.completedSteps.includes("add_helios_network")) {
        setStep(4);
        return;
      }

      await api.startOnboardingStep("add_helios_network");

      try {
        const exists = await checkNetworkExists();
        
        if (!exists) {
          const ethereum = window.ethereum as any;
          await ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xa410",
                chainName: "Helios Testnet",
                nativeCurrency: {
                  name: "Helios",
                  symbol: "HLS",
                  decimals: 18,
                },
                rpcUrls: ["https://testnet1.helioschainlabs.org/"],
                blockExplorerUrls: ["https://explorer.helioschainlabs.org/"],
              },
            ],
          });
        }
      } catch (error: any) {
        // If we got error -32603 about duplicate RPC endpoint, the network is already configured
        // but with a different chainId (0x1092 instead of 0xa410)
        if (error.code === -32603 && error.message?.includes("same RPC endpoint")) {
          // This means the network is already set up, just with a different chainId
          console.log("Network already exists with different chainId, proceeding to next step");
          // We can still consider this step successful
        } else {
          // For other errors, rethrow
          throw error;
        }
      }

      const response = await api.completeOnboardingStep(
        "add_helios_network",
        "network_added"
      );

      if (response.success) {
        setPendingXP((prev) => prev + 10);
        setStep(4);
      }
    } catch (error: any) {
      if (error.message === "Onboarding step already started or completed") {
        setStep(4);
      } else {
        console.error("Failed to add network:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTokens = async () => {
    try {
      setIsLoading(true);
      const progress = await api.getOnboardingProgress();

      if (progress.completedSteps.includes("claim_from_faucet")) {
        setStep(5);
        return;
      }

      await api.startOnboardingStep("claim_from_faucet");

      // Call faucet API to get tokens
      const faucetResponse = await api.requestFaucetTokens("HLS", "helios-testnet", 0.1);
      
      // Show transaction notification
      if (faucetResponse.success && faucetResponse.transactionHash) {
        setTxNotification({
          show: true,
          txHash: faucetResponse.transactionHash,
          amount: faucetResponse.faucetClaim?.amount || 0.1,
          token: faucetResponse.faucetClaim?.token || "HLS"
        });
        
        // Wait a bit before proceeding to next step (so user can see notification)
        setTimeout(() => {
          completeClaimStep(faucetResponse);
        }, 2000);
      } else {
        // If no transaction hash, just complete the step
        completeClaimStep(faucetResponse);
      }
    } catch (error: any) {
      if (error.message === "Onboarding step already started or completed") {
        setStep(5);
      } else {
        console.error("Failed to claim tokens:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const completeClaimStep = async (faucetResponse: any) => {
    if (faucetResponse.success) {
      const response = await api.completeOnboardingStep(
        "claim_from_faucet",
        "tokens_claimed"
      );

      if (response.success) {
        // Add XP from the faucet if available
        if (faucetResponse.xpReward) {
          setPendingXP((prev) => prev + faucetResponse.xpReward);
        } else {
          setPendingXP((prev) => prev + 5); // Default XP if not provided by API
        }
        setStep(5);
      }
    }
  };

  const handleMintNFT = async () => {
    try {
      setIsLoading(true);
      const progress = await api.getOnboardingProgress();

      if (progress.completedSteps.includes("mint_early_bird_nft")) {
        setStep(6);
        return;
      }

      await api.startOnboardingStep("mint_early_bird_nft");

      const response = await api.completeOnboardingStep(
        "mint_early_bird_nft",
        "nft_minted"
      );

      if (response.success) {
        setPendingXP((prev) => prev + 5);

        try {
          // Only claim rewards once at the end
          const reward = await api.claimReward("xp");

          // Add accumulated XP
          addXP(pendingXP + 5); // Include current step XP
          setShowXPToast(true);
          setTimeout(() => setShowXPToast(false), 3000);
        } catch (error: any) {
          // If rewards were already claimed, just proceed
          if (error.message.includes("already claimed")) {
            console.log("Rewards already claimed");
          } else {
            throw error;
          }
        }

        setStep(6);
      }
    } catch (error: any) {
      if (error.message === "Onboarding step already started or completed") {
        setStep(6);
      } else {
        console.error("Failed to mint NFT:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsTypingComplete(false);
  }, [step]);

  const handleTypingComplete = () => {
    setIsTypingComplete(true);
  };

  // If we're at step 7, show the dashboard
  if (step === 7) {
    return <Dashboard />;
  }

  return (
    <motion.div
      className="min-h-screen bg-[#F2F5FF] p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-0 pointer-events-none">
        <div className="min-w-300 w-400 h-50 object-none">
          <Video id="helios-home-hero" className="opacity-30" />
        </div>
      </div>
      {/* Overlay Mask Image */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <img
          src="/images/Gradient.png"
          alt="Video Mask"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative max-w-4xl mx-auto pt-32 ">
        {step === 2 && (
          <>
            <Mascot
              text="Hey, I'm Phaeton, official mascot of Helios — who also happens to be my father ☀️. You've just entered our interchain testnet... and I'm here to guide you through your first steps."
              onTypingComplete={handleTypingComplete}
              currentStep={1}
              totalSteps={TOTAL_STEPS}
              onNext={() => setStep(3)}
              buttonText="Let's Begin"
            />
          </>
        )}

        {step === 3 && (
          <>
            <Mascot
              text="Before we light up the sky together, you need to connect to the Helios network. It's EVM-compatible, so MetaMask will work just fine. Ready to ride the chain?"
              onTypingComplete={handleTypingComplete}
              currentStep={2}
              totalSteps={TOTAL_STEPS}
              onNext={handleAddNetwork}
              buttonText="Add Helios Network"
              loadingText="Adding Network..."
              isLoading={isLoading}
            />
          </>
        )}

        {step === 4 && (
          <>
            <Mascot
              text="Every explorer needs some solar fuel. Let me beam some $HLS tokens your way so you can start exploring."
              onTypingComplete={handleTypingComplete}
              currentStep={3}
              totalSteps={TOTAL_STEPS}
              onNext={handleClaimTokens}
              buttonText="Claim from Faucet"
              loadingText="Claiming..."
              isLoading={isLoading}
            />
          </>
        )}

        {step === 5 && (
          <>
            <Mascot
              text="You've made it through the gates of Helios. To mark your arrival, you've earned a Testnet Explorer badge — minted directly to your wallet."
              onTypingComplete={handleTypingComplete}
              currentStep={4}
              totalSteps={TOTAL_STEPS}
              onNext={handleMintNFT}
              buttonText="Mint Testnet NFT"
              loadingText="Minting..."
              isLoading={isLoading}
            />
          </>
        )}

        {step === 6 && (
          <>
            <Mascot
              text="From here, your journey truly begins. Check your XP, explore the network, and rise in the ranks. I'll be watching from above… unless you summon me again"
              onTypingComplete={handleTypingComplete}
              currentStep={5}
              totalSteps={TOTAL_STEPS}
              onNext={() => setStep(7)}
              buttonText="Enter My Dashboard"
            />
          </>
        )}
      </div>

      {showXPToast && (
        <XPToast
          amount={pendingXP}
          message="All steps completed! Rewards claimed successfully!"
        />
      )}
      
      {txNotification.show && txNotification.txHash && (
        <TransactionNotification
          txHash={txNotification.txHash}
          amount={txNotification.amount || 0}
          token={txNotification.token || ""}
          onClose={() => setTxNotification({ show: false })}
        />
      )}
    </motion.div>
  );
};

export default OnboardingFlow;
