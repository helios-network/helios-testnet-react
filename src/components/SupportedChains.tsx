import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchChainData, formatCurrency, ChainData } from "../services/metricsApi";

const ChainCard: React.FC<{ chain: ChainData; index: number }> = ({ chain, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-6 rounded-2xl border-2 transition-all ${
        chain.status === 'active'
          ? 'border-[#002DCB] bg-[#F2F4FE]'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-[#002DCB]">
              {chain.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-[#060F32]">{chain.name}</h3>
            <p className="text-sm text-[#5C6584]">
              {chain.assets} asset{chain.assets !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          chain.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {chain.status === 'active' ? 'Active' : 'Coming Soon'}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#5C6584]">TVL</span>
          <span className="font-semibold text-[#060F32]">
            {formatCurrency(chain.tvl)}
          </span>
        </div>
        {chain.status === 'coming-soon' && (
          <div className="text-xs text-[#5C6584] italic">Integration in progress</div>
        )}
      </div>
    </motion.div>
  );
};

const SupportedChains: React.FC = () => {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChains = async () => {
      try {
        setIsLoading(true);
        const chainData = await fetchChainData();
        setChains(chainData);
      } catch (error) {
        console.error("Failed to fetch chain data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChains();
  }, []);

  if (isLoading) {
    return (
      <div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#060F32] mb-4">Supported Chains</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chains.map((chain, index) => (
          <ChainCard key={chain.name} chain={chain} index={index} />
        ))}
      </div>
    </div>
  );
};

export default SupportedChains;


