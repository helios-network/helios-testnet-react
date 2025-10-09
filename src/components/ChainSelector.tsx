import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle,
  ExternalLink,
  Zap
} from "lucide-react";
import { toast } from "react-toastify";

interface Chain {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  supportedAssets: string[];
  bridgeFee: string;
  estimatedTime: string;
}

const SUPPORTED_CHAINS: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-xs">E</div>,
    description: "Bridge from Ethereum mainnet",
    supportedAssets: ["ETH", "USDC", "USDT", "WETH"],
    bridgeFee: "0.001 ETH",
    estimatedTime: "5-10 minutes"
  },
  {
    id: "bnb",
    name: "BNB Chain",
    icon: <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">B</div>,
    description: "Bridge from BNB Smart Chain",
    supportedAssets: ["BNB", "USDC", "USDT", "BUSD"],
    bridgeFee: "0.001 BNB",
    estimatedTime: "3-5 minutes"
  },
  {
    id: "polygon",
    name: "Polygon",
    icon: <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">P</div>,
    description: "Bridge from Polygon network",
    supportedAssets: ["MATIC", "USDC", "USDT", "WMATIC"],
    bridgeFee: "0.1 MATIC",
    estimatedTime: "2-3 minutes"
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">A</div>,
    description: "Bridge from Arbitrum One",
    supportedAssets: ["ETH", "USDC", "USDT", "ARB"],
    bridgeFee: "0.0001 ETH",
    estimatedTime: "3-5 minutes"
  },
  {
    id: "optimism",
    name: "Optimism",
    icon: <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">O</div>,
    description: "Bridge from Optimism",
    supportedAssets: ["ETH", "USDC", "USDT", "OP"],
    bridgeFee: "0.0001 ETH",
    estimatedTime: "3-5 minutes"
  }
];

interface ChainSelectorProps {
  onChainSelect?: (chain: Chain) => void;
  selectedChain?: Chain;
  onComplete?: () => void;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ onChainSelect, selectedChain: selectedChainProp, onComplete }) => {
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>(selectedChainProp);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSelectChain = (chain: Chain) => {
    setSelectedChain(chain);
    setSelectedToken("");
    setAmount("");
    if (onChainSelect) onChainSelect(chain);
  };

  const handleTransfer = async () => {
    if (!selectedChain || !selectedToken || !amount || Number(amount) <= 0) {
      toast.error("Please select a token and enter a valid amount.");
      return;
    }
    setIsTransferring(true);
    try {
      // Simulate bridging transfer call
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Transfer initiated. Your assets will appear on Helios shortly.");
      if (onComplete) onComplete();
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#060F32] mb-4">
          Choose Your Origin Chain
        </h2>
        <p className="text-[#5C6584] max-w-2xl mx-auto">
          Select the blockchain where your assets are currently located. 
          We'll help you bridge them to Helios Beta Mainnet to start earning HLS rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUPPORTED_CHAINS.map((chain) => {
          const isSelected = selectedChain?.id === chain.id;
          const isHovered = hoveredChain === chain.id;
          
          return (
            <motion.div
              key={chain.id}
              className={`relative bg-white rounded-2xl shadow-md p-6 cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? "ring-2 ring-[#002DCB] bg-[#F2F4FE]" 
                  : "hover:shadow-lg hover:scale-105"
              }`}
              onClick={() => handleSelectChain(chain)}
              onMouseEnter={() => setHoveredChain(chain.id)}
              onMouseLeave={() => setHoveredChain(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-[#002DCB]" />
                </div>
              )}

              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  isSelected ? "bg-[#002DCB] text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {chain.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#060F32]">{chain.name}</h3>
                  <p className="text-sm text-[#5C6584]">{chain.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#060F32] mb-2">Supported Assets</h4>
                  <div className="flex flex-wrap gap-2">
                    {chain.supportedAssets.map((asset) => (
                      <span 
                        key={asset}
                        className="px-2 py-1 bg-[#E2EBFF] text-[#002DCB] text-xs rounded-full"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#5C6584]">Bridge Fee:</span>
                    <p className="font-semibold text-[#060F32]">{chain.bridgeFee}</p>
                  </div>
                  <div>
                    <span className="text-[#5C6584]">Est. Time:</span>
                    <p className="font-semibold text-[#060F32]">{chain.estimatedTime}</p>
                  </div>
                </div>
              </div>

              {isHovered && !isSelected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-[#002DCB]/5 rounded-2xl flex items-center justify-center"
                >
                  <div className="flex items-center text-[#002DCB] font-semibold">
                    <span>Select Chain</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </motion.div>
              )}

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 pt-4 border-t border-[#D7E0FF] space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-[#5C6584] mb-1">Token</label>
                      <select 
                        className="w-full px-3 py-2 border-2 border-[#E2EBFF] rounded-lg focus:outline-none focus:border-[#002DCB]"
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                      >
                        <option value="" disabled>Select token</option>
                        {chain.supportedAssets.map((asset) => (
                          <option key={asset} value={asset}>{asset}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#5C6584] mb-1">Amount</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border-2 border-[#E2EBFF] rounded-lg focus:outline-none focus:border-[#002DCB]"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#5C6584] mb-1">Destination Contract</label>
                      <div className="px-3 py-2 bg-[#F9FAFF] border-2 border-[#E2EBFF] rounded-lg text-sm font-mono text-[#060F32] truncate" title={`0xHyperion-${chain.id}-contract`}>
                        {`0xHyperion-${chain.id}-contract`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5C6584]">Assets bridged are considered staked on Helios</span>
                    <button 
                      onClick={handleTransfer}
                      disabled={isTransferring}
                      className="bg-[#002DCB] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#0045FF] transition-colors flex items-center disabled:opacity-60"
                    >
                      {isTransferring ? 'Transferring...' : 'Transfer to Helios'}
                      {!isTransferring && <ArrowRight className="w-4 h-4 ml-2" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {selectedChain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-2xl p-8 text-white"
        >
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 mr-3" />
            <h3 className="text-2xl font-bold">Ready to Bridge from {selectedChain.name}?</h3>
          </div>
          <p className="text-blue-100 mb-6">
            You can bridge {selectedChain.supportedAssets.join(", ")} from {selectedChain.name} to Helios Beta Mainnet.
            The process takes approximately {selectedChain.estimatedTime} and costs {selectedChain.bridgeFee}.
          </p>
          <div className="flex items-center space-x-4">
            <button className="bg-white text-[#002DCB] px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center">
              Start Bridging
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
            <button className="text-blue-100 hover:text-white transition-colors">
              Learn More About Bridging
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChainSelector;
