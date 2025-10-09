import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const StakeInfoSection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-2xl p-8 text-white"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-3">Why Stake on Helios Beta Mainnet?</h3>
          <p className="text-blue-100 leading-relaxed mb-4">
            Helios Beta Mainnet connects real assets from external blockchains. By depositing now,
            you earn future APY in HLS and secure your place in the airdrop farming system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Real asset staking with actual rewards</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Multi-chain asset support</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Future APY up to 22%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Airdrop eligibility for early participants</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StakeInfoSection;


