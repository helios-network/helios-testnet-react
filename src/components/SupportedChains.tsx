import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchChainData, formatCurrency, ChainData } from "../services/metricsApi";

const ChainCard: React.FC<{ chain: ChainData; index: number }> = ({ chain, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-6 rounded-xl transition-all bg-white/80 border-4 ${
        chain.status === 'active'
          ? 'border-blue-500'
          : 'border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <span className="text-sm font-bold text-[#002DCB]">
              {chain.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-medium">{chain.name}</h3>
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
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-xs text-[#5C6584]">TVL</span>
          <span className="font-semibold text-xl text-[#060F32]">
            {formatCurrency(chain.tvl)}
          </span>
        </div>
        {chain.status === 'coming-soon' && (
          <div className="mb-0.5 text-xs text-[#5C6584] italic">Integration in progress</div>
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
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-[#060F32] mb-3">Supported Chains</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chains.map((chain, index) => (
          <ChainCard key={chain.name} chain={chain} index={index} />
        ))}
      </div>
    </div>
  );
};

export default SupportedChains;


