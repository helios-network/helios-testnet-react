import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const StakeInfoSection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl px-7 pt-5 pb-6 mb-8 border border-[#E2EBFF]"
    >
      <div className="flex items-center">
        <TrendingUp className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="pt-2 text-sm font-medium text-[#060F32]">Why Stake on Helios Beta Mainnet?</h3>
        <p className="pb-4 text-xs text-[#5C6584]">
          Helios Beta Mainnet connects real assets from external blockchains. By depositing now,
          you earn future APY in HLS and secure your place in the airdrop farming system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-[#060F32]">Real asset staking with actual rewards</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-[#060F32]">Multi-chain asset support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-[#060F32]">Future APY up to 20%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-[#060F32]">Airdrop eligibility for early participants</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StakeInfoSection;


