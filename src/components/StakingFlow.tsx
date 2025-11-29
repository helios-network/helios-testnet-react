import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  Lock,
  Unlock
} from "lucide-react";

interface StakingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "completed";
}

interface StakingFlowProps {
  onComplete: () => void;
}

const StakingFlow: React.FC<StakingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("30");
  const [isStaking, setIsStaking] = useState(false);

  const steps: StakingStep[] = [
    {
      id: "select-assets",
      title: "Select Assets to Stake",
      description: "Choose which assets you want to stake for HLS rewards",
      icon: <DollarSign className="w-6 h-6" />,
      status: currentStep === 0 ? "active" : currentStep > 0 ? "completed" : "pending"
    },
    {
      id: "choose-duration",
      title: "Choose Staking Duration",
      description: "Select how long you want to stake your assets",
      icon: <Clock className="w-6 h-6" />,
      status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending"
    },
    {
      id: "confirm-stake",
      title: "Confirm Staking",
      description: "Review and confirm your staking parameters",
      icon: <Shield className="w-6 h-6" />,
      status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending"
    },
    {
      id: "start-earning",
      title: "Start Earning HLS",
      description: "Your assets are staked and earning rewards",
      icon: <TrendingUp className="w-6 h-6" />,
      status: currentStep === 3 ? "active" : "pending"
    }
  ];

  const stakingOptions = [
    { value: "100", label: "100 HLS", apy: "12%" },
    { value: "500", label: "500 HLS", apy: "15%" },
    { value: "1000", label: "1,000 HLS", apy: "18%" },
    { value: "5000", label: "5,000 HLS", apy: "22%" },
    { value: "custom", label: "Custom Amount", apy: "12-22%" }
  ];

  const durationOptions = [
    { value: "30", label: "30 Days", multiplier: "1x", apy: "12%" },
    { value: "90", label: "90 Days", multiplier: "1.2x", apy: "15%" },
    { value: "180", label: "180 Days", multiplier: "1.5x", apy: "18%" },
    { value: "365", label: "1 Year", multiplier: "2x", apy: "22%" }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleStake();
    }
  };

  const handleStake = async () => {
    setIsStaking(true);
    // Simulate staking process
    setTimeout(() => {
      setIsStaking(false);
      onComplete();
    }, 3000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#060F32] mb-4">Select Assets to Stake</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stakingOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAmount === option.value
                      ? "border-[#002DCB] bg-[#F2F4FE]"
                      : "border-gray-200 hover:border-[#002DCB]/50"
                  }`}
                  onClick={() => setSelectedAmount(option.value)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-[#060F32]">{option.label}</h4>
                      <p className="text-sm text-[#5C6584]">APY: {option.apy}</p>
                    </div>
                    {selectedAmount === option.value && (
                      <CheckCircle className="w-6 h-6 text-[#002DCB]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#060F32] mb-4">Choose Staking Duration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {durationOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedDuration === option.value
                      ? "border-[#002DCB] bg-[#F2F4FE]"
                      : "border-gray-200 hover:border-[#002DCB]/50"
                  }`}
                  onClick={() => setSelectedDuration(option.value)}
                >
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-[#060F32] mb-2">{option.label}</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-[#5C6584]">Reward Multiplier: {option.multiplier}</p>
                      <p className="text-lg font-semibold text-[#002DCB]">APY: {option.apy}</p>
                    </div>
                    {selectedDuration === option.value && (
                      <CheckCircle className="w-6 h-6 text-[#002DCB] mx-auto mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#060F32] mb-4">Confirm Your Staking</h3>
            <div className="bg-[#F9FAFF] rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#5C6584]">Amount to Stake:</span>
                <span className="font-semibold text-[#060F32]">
                  {stakingOptions.find(opt => opt.value === selectedAmount)?.label || "Custom"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5C6584]">Staking Duration:</span>
                <span className="font-semibold text-[#060F32]">
                  {durationOptions.find(opt => opt.value === selectedDuration)?.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5C6584]">Expected APY:</span>
                <span className="font-semibold text-[#002DCB]">
                  {durationOptions.find(opt => opt.value === selectedDuration)?.apy}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5C6584]">Reward Multiplier:</span>
                <span className="font-semibold text-[#060F32]">
                  {durationOptions.find(opt => opt.value === selectedDuration)?.multiplier}
                </span>
              </div>
              <hr className="border-[#D7E0FF]" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-[#060F32]">Estimated Monthly Rewards:</span>
                <span className="font-bold text-[#002DCB]">~45 HLS</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-[#002DCB] rounded-full flex items-center justify-center mx-auto"
            >
              <TrendingUp className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-3xl font-bold text-[#060F32]">Staking Successful!</h3>
            <p className="text-[#5C6584] max-w-md mx-auto">
              Your assets are now staked and earning HLS rewards. You can track your progress in the dashboard.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === "completed" 
                    ? "bg-[#002DCB] text-white" 
                    : step.status === "active"
                    ? "bg-[#002DCB] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {step.status === "completed" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-[#060F32]">{step.title}</h4>
                  <p className="text-sm text-[#5C6584]">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white rounded-2xl shadow-md p-8"
      >
        {renderStepContent()}

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 text-[#5C6584] hover:text-[#060F32] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !selectedAmount) ||
                (currentStep === 1 && !selectedDuration) ||
                isStaking
              }
              className="bg-[#002DCB] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#0045FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isStaking ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Staking...
                </>
              ) : (
                <>
                  {currentStep === 2 ? "Confirm & Stake" : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StakingFlow;
