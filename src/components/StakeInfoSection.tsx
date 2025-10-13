import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const StakeInfoSection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-xl px-7 pt-5 pb-6 mb-8 text-white"
    >
      <div className="flex items-center">
        <TrendingUp className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="pt-2 text-sm font-medium">Why Stake on Helios Beta Mainnet?</h3>
        <p className="pb-4 text-xs text-blue-100">
          Helios Beta Mainnet connects real assets from external blockchains. By depositing now,
          you earn future APY in HLS and secure your place in the airdrop farming system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="font-semibold">Real asset staking with actual rewards</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="font-semibold">Multi-chain asset support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="font-semibold">Future APY up to 22%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="font-semibold">Airdrop eligibility for early participants</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StakeInfoSection;


