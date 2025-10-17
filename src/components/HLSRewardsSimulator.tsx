import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, Coins } from "lucide-react";

const HLSRewardsSimulator: React.FC = () => {
  const [dollarAmount, setDollarAmount] = useState<string>("1000");
  const [timeframe, setTimeframe] = useState<"daily" | "monthly" | "yearly">("monthly");
  
  const APY = 20; // 20% APY
  const HLS_PRICE = 0.02; // 1 HLS = $0.02

  const calculateRewards = () => {
    const amount = parseFloat(dollarAmount) || 0;
    
    // Calculate yearly rewards in dollars
    const yearlyRewardsUSD = amount * (APY / 100);
    
    // Calculate based on timeframe
    let rewardsUSD = 0;
    let period = "";
    
    switch (timeframe) {
      case "daily":
        rewardsUSD = yearlyRewardsUSD / 365;
        period = "day";
        break;
      case "monthly":
        rewardsUSD = yearlyRewardsUSD / 12;
        period = "month";
        break;
      case "yearly":
        rewardsUSD = yearlyRewardsUSD;
        period = "year";
        break;
    }
    
    // Convert USD rewards to HLS tokens
    const rewardsHLS = rewardsUSD / HLS_PRICE;
    
    return {
      rewardsUSD,
      rewardsHLS,
      period
    };
  };

  const { rewardsUSD, rewardsHLS, period } = calculateRewards();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-7"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#060F32]">HLS Rewards Calculator</h2>
          <p className="text-sm text-[#828DB3]">
            Estimate your earnings at {APY}% APY
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-5">
        {/* Dollar Amount Input */}
        <div>
          <label className="block text-sm font-medium text-[#060F32] mb-2">
            Asset Value (USD)
          </label>
          <div className="relative">
            <input
              type="number"
              value={dollarAmount}
              onChange={(e) => setDollarAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#E2EBFF] rounded-lg text-lg font-semibold text-[#060F32] focus:border-[#002DCB] focus:outline-none transition-colors placeholder:text-[#A4AEC6]"
              placeholder="Enter amount"
              min="0"
              step="100"
            />
          </div>
          <p className="text-xs text-[#828DB3] mt-2">
            The total USD value of assets you plan to bridge to Helios
          </p>
        </div>

        {/* Timeframe Selection */}
        <div>
          <label className="block text-sm font-medium text-[#060F32] mb-2">
            Timeframe
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["daily", "monthly", "yearly"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  timeframe === tf
                    ? "bg-[#002DCB] text-white shadow-md"
                    : "bg-[#F5F7FF] text-[#828DB3] hover:bg-[#E6EBFD]"
                }`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section (neutral) */}
        <div className="rounded-xl p-6 bg-white/90 backdrop-blur-sm border border-[#E2EBFF] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#5C6584]">Your Estimated Rewards</span>
            <span className="text-xs bg-[#F5F7FF] text-[#002DCB] px-3 py-1 rounded-full border border-[#E2EBFF]">
              per {period}
            </span>
          </div>
          
          <div className="space-y-3">
            {/* HLS Tokens */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Coins className="w-5 h-5 text-[#002DCB]" />
                <span className="text-sm text-[#060F32]">HLS Tokens</span>
              </div>
              <div className="text-4xl font-bold text-[#060F32]">
                {formatNumber(rewardsHLS)}
              </div>
            </div>

            {/* USD Value */}
            <div className="pt-3 border-t border-[#E2EBFF]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-[#002DCB]" />
                  <span className="text-sm text-[#060F32]">USD Value</span>
                </div>
                <div className="text-2xl font-bold text-[#060F32]">
                  ${formatNumber(rewardsUSD)}
                </div>
              </div>
            </div>
          </div>

          {/* APY Info */}
          <div className="pt-4 border-t border-[#E2EBFF]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5C6584]">Annual Percentage Yield</span>
              <span className="font-bold text-lg text-[#060F32]">{APY}%</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-[#F5F7FF] rounded-lg p-4 space-y-2">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-5 h-5 text-[#002DCB] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#060F32]">
              <span className="font-semibold">All assets earn the same APY</span> regardless of type. 
              Bridge WBTC, ETH, USDC, or any supported asset – your rewards are based on dollar value, not asset type.
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Coins className="w-5 h-5 text-[#002DCB] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#060F32]">
              <span className="font-semibold">1 HLS = ${HLS_PRICE.toFixed(2)}</span> current valuation
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HLSRewardsSimulator;

