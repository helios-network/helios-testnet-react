import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchChainData, formatCurrency, ChainData } from "../services/metricsApi";
import { ArrowRight, Coins } from "lucide-react";

// Mapping of supported assets per chain
const CHAIN_ASSETS: Record<string, string[]> = {
  "Ethereum": ["WBTC", "ETH", "USDC", "USDT", "DAI"],
  "BNB Chain": ["WBTC", "ETH", "USDC", "USDT", "BNB"],
  "Arbitrum": ["WBTC", "ETH", "USDC", "USDT"],
  "Base": ["WBTC", "ETH", "USDC"],
  "Optimism": ["WBTC", "ETH", "USDC", "USDT"],
  "Polygon": ["WBTC", "ETH", "USDC", "USDT", "MATIC"],
};

const SUPPORTED_CHAIN_NAMES = [
  "Ethereum",
  "BNB Chain",
  "Arbitrum",
  "Base",
  "Optimism",
  "Polygon",
];

const ChainCard: React.FC<{ chain: ChainData; index: number }> = ({ chain, index }) => {
  const supportedAssets = CHAIN_ASSETS[chain.name] || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-6 rounded-xl transition-all bg-white/80 border-2 ${
        chain.status === 'active'
          ? 'border-[#002DCB] shadow-md'
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#002DCB] to-[#4A6CF7] rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {chain.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-[#060F32]">{chain.name}</h3>
            <p className="text-xs text-[#5C6584]">
              {supportedAssets.length} supported asset{supportedAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          chain.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {chain.status === 'active' ? 'Live' : 'Soon'}
        </div>
      </div>
      
      {/* Supported Assets */}
      {supportedAssets.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-2">
            <Coins className="w-4 h-4 text-[#002DCB]" />
            <span className="text-xs font-medium text-[#060F32]">Bridgeable Assets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {supportedAssets.map((asset) => (
              <span
                key={asset}
                className="px-2.5 py-1 bg-[#F5F7FF] text-[#002DCB] text-xs font-medium rounded-md"
              >
                {asset}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-[#5C6584]">Total Value Locked</span>
            <span className="font-bold text-lg text-[#060F32]">
              {formatCurrency(chain.tvl)}
            </span>
          </div>
          {chain.status === 'active' && (
            <ArrowRight className="w-5 h-5 text-[#002DCB]" />
          )}
        </div>
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

  // Filter to the six supported chains only and keep a stable order
  const filteredChains = SUPPORTED_CHAIN_NAMES
    .map(name => chains.find(c => c.name === name))
    .filter(Boolean) as ChainData[];

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#060F32] mb-2">Bridge from Multiple Chains</h2>
        <p className="text-[#828DB3]">
          Supported: Ethereum, BNB Chain, Arbitrum, Base, Optimism, Polygon. All assets earn the same APY based on dollar value.
        </p>
        {/* Logos row */}
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPORTED_CHAIN_NAMES.map((name) => (
            <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F7FF] rounded-lg">
              <img
                src={
                  name === 'Ethereum' ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' :
                  name === 'BNB Chain' ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png' :
                  name === 'Arbitrum' ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' :
                  name === 'Base' ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' :
                  name === 'Optimism' ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' :
                  name === 'Polygon' ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' :
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
                }
                alt={name}
                className="w-6 h-6 rounded-full object-contain bg-white border border-[#E2EBFF]"
              />
              <span className="text-xs text-[#060F32] font-medium">{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChains.map((chain, index) => (
          <ChainCard key={chain.name} chain={chain} index={index} />
        ))}
      </div>
    </div>
  );
};

export default SupportedChains;


