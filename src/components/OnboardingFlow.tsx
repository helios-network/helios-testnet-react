import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/onboardingStore";
import Mascot from "./Mascot";
import XPToast from "./XPToast";
import { api } from "../services/api";
import Dashboard from "./Dashboard";

const TOTAL_STEPS = 5;

const OnboardingFlow = () => {
  const { step, setStep, addXP, fetchOnboardingProgress, onboardingProgress } =
    useStore();
  const [showXPToast, setShowXPToast] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingXP, setPendingXP] = useState(0);

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
          const nextStep = stepMapping[lastCompletedStep] + 1;

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
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId === "0x1092") {
        return true;
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1092" }],
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
    try {
      setIsLoading(true);
      const progress = await api.getOnboardingProgress();

      if (progress.completedSteps.includes("add_helios_network")) {
        setStep(4);
        return;
      }

      await api.startOnboardingStep("add_helios_network");

      const exists = await checkNetworkExists();

      if (!exists) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x1092",
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

      const response = await api.completeOnboardingStep(
        "claim_from_faucet",
        "tokens_claimed"
      );

      if (response.success) {
        setPendingXP((prev) => prev + 5);
        setStep(5);
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
      className="min-h-screen bg-gradient-to-b from-[#040F34] via-[#002DCB] to-[#E2EBFF] p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto pt-32">
        {step === 2 && (
          <>
            <Mascot
              text="Hey, I'm Phaeton, official mascot of Helios — who also happens to be my father ☀️. You've just entered our interchain testnet... and I'm here to guide you through your first steps."
              onTypingComplete={handleTypingComplete}
              currentStep={1}
              totalSteps={TOTAL_STEPS}
            />
            <motion.button
              onClick={() => setStep(3)}
              disabled={!isTypingComplete}
              className={`w-full max-w-md mx-auto px-8 py-4 bg-white text-[#002DCB] rounded-full text-lg font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isTypingComplete
                  ? "hover:bg-opacity-90 hover:scale-105 hover:shadow-xl"
                  : "opacity-50 cursor-not-allowed"
              }`}
              whileHover={isTypingComplete ? { scale: 1.05 } : {}}
              whileTap={isTypingComplete ? { scale: 0.95 } : {}}
            >
              Let's Begin
            </motion.button>
          </>
        )}

        {step === 3 && (
          <>
            <Mascot
              text="Before we light up the sky together, you need to connect to the Helios network. It's EVM-compatible, so MetaMask will work just fine. Ready to ride the chain?"
              onTypingComplete={handleTypingComplete}
              currentStep={2}
              totalSteps={TOTAL_STEPS}
            />
            <motion.button
              onClick={handleAddNetwork}
              disabled={!isTypingComplete || isLoading}
              className={`w-full max-w-md mx-auto px-8 py-4 bg-white text-[#002DCB] rounded-full text-lg font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isTypingComplete && !isLoading
                  ? "hover:bg-opacity-90 hover:scale-105 hover:shadow-xl"
                  : "opacity-50 cursor-not-allowed"
              }`}
              whileHover={isTypingComplete && !isLoading ? { scale: 1.05 } : {}}
              whileTap={isTypingComplete && !isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? "Adding Network..." : "Add Helios Network"}
            </motion.button>
          </>
        )}

        {step === 4 && (
          <>
            <Mascot
              text="Every explorer needs some solar fuel. Let me beam some $HLS tokens your way so you can start exploring."
              onTypingComplete={handleTypingComplete}
              currentStep={3}
              totalSteps={TOTAL_STEPS}
            />
            <motion.button
              onClick={handleClaimTokens}
              disabled={!isTypingComplete || isLoading}
              className={`w-full max-w-md mx-auto px-8 py-4 bg-white text-[#002DCB] rounded-full text-lg font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isTypingComplete && !isLoading
                  ? "hover:bg-opacity-90 hover:scale-105 hover:shadow-xl"
                  : "opacity-50 cursor-not-allowed"
              }`}
              whileHover={isTypingComplete && !isLoading ? { scale: 1.05 } : {}}
              whileTap={isTypingComplete && !isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? "Claiming..." : "Claim from Faucet"}
            </motion.button>
          </>
        )}

        {step === 5 && (
          <>
            <Mascot
              text="You've made it through the gates of Helios. To mark your arrival, you've earned a Testnet Explorer badge — minted directly to your wallet."
              onTypingComplete={handleTypingComplete}
              currentStep={4}
              totalSteps={TOTAL_STEPS}
            />
            <motion.button
              onClick={handleMintNFT}
              disabled={!isTypingComplete || isLoading}
              className={`w-full max-w-md mx-auto px-8 py-4 bg-white text-[#002DCB] rounded-full text-lg font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isTypingComplete && !isLoading
                  ? "hover:bg-opacity-90 hover:scale-105 hover:shadow-xl"
                  : "opacity-50 cursor-not-allowed"
              }`}
              whileHover={isTypingComplete && !isLoading ? { scale: 1.05 } : {}}
              whileTap={isTypingComplete && !isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? "Minting..." : "Mint Testnet NFT"}
            </motion.button>
          </>
        )}

        {step === 6 && (
          <>
            <Mascot
              text="From here, your journey truly begins. Check your XP, explore the network, and rise in the ranks. I'll be watching from above… unless you summon me again 🪐"
              onTypingComplete={handleTypingComplete}
              currentStep={5}
              totalSteps={TOTAL_STEPS}
            />
            <motion.button
              onClick={() => setStep(7)}
              disabled={!isTypingComplete}
              className={`w-full max-w-md mx-auto px-8 py-4 bg-white text-[#002DCB] rounded-full text-lg font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isTypingComplete
                  ? "hover:bg-opacity-90 hover:scale-105 hover:shadow-xl"
                  : "opacity-50 cursor-not-allowed"
              }`}
              whileHover={isTypingComplete ? { scale: 1.05 } : {}}
              whileTap={isTypingComplete ? { scale: 0.95 } : {}}
            >
              Enter My Dashboard
            </motion.button>
          </>
        )}
      </div>

      {showXPToast && (
        <XPToast
          amount={pendingXP}
          message="All steps completed! Rewards claimed successfully!"
        />
      )}
    </motion.div>
  );
};

export default OnboardingFlow;
