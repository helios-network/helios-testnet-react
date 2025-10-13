import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useStore } from "../store/onboardingStore";
import { useAccount } from "wagmi";
import { ViewContext } from "./LayoutClientWrapper";
import Footer from "./Footer";
import { toast } from "react-toastify";
import ChainSelector from "./ChainSelector";
import StakingFlow from "./StakingFlow";
import NetworkMetrics from "./NetworkMetrics";
import AssetOverview from "./AssetOverview";
import StakeInfoSection from "./StakeInfoSection";
import SupportedChains from "./SupportedChains";
import TVLChart from "./TVLChart";
import PersonalizedDashboard from "./PersonalizedDashboard";

const Dashboard = () => {
  const { address } = useAccount();
  const { setCurrentView } = React.useContext(ViewContext);
  const step = useStore((state) => state.step);
  const isAuthenticated = step > 0;
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showStakingFlow, setShowStakingFlow] = useState(false);
  const [selectedChain, setSelectedChain] = useState<any>(null);

  // Public view for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50/90 min-h-screen flex flex-col">
        <div className="flex-grow py-4 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Network Metrics */}
            <NetworkMetrics />

          {/* Top CTA - Immediately visible */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-7 py-5 mb-4 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-center sm:text-left mb-3 sm:mb-0">
              <div className="text-md font-medium">Bring Assets to Helios</div>
              <div className="text-[#5C6584] text-xs">Bridge your assets from external chains – they count as staked and start earning HLS</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowChainSelector(true)}
                className="bg-[#002DCB] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0045FF] transition-colors"
              >
                Bridge & Stake
              </button>
            </div>
          </div>

            {/* TVL + Assets (compact side-by-side on large screens) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 mb-4 gap-4">
              <div className="lg:col-span-5">
                <TVLChart />
              </div>
              <div className="lg:col-span-7">
                <AssetOverview />
              </div>
            </div>

            {/* Full-width staking info */}
            <StakeInfoSection />

            {/* Full-width supported chains */}
            <SupportedChains />

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-xl px-7 py-6 text-white items-center justify-between"
            >
              <div className="mr-4">
                <h2 className="text-md font-medium">Ready to Start Earning?</h2>
                <p className="text-blue-100 max-w-2xl mx-auto text-xs">
                  Connect your wallet to start bridging assets and earning HLS rewards on the Helios Beta Mainnet.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setShowChainSelector(true)}
                  className="bg-white text-[#002DCB] border-2 border-transparent px-3 py-2 h-min rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Bridge Assets Now
                </button>
                <button
                  onClick={() => setShowStakingFlow(true)}
                  className="bg-white/20 text-white border-2 border-white px-4 px-3 py-2 h-min rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  Start Staking
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />

        {/* Chain Selector Modal */}
        {showChainSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#060F32]">Select Origin Chain</h2>
          <button
                    onClick={() => setShowChainSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
          </button>
                </div>
                <ChainSelector
                  onChainSelect={(chain) => {
                    setSelectedChain(chain);
                  }}
                  selectedChain={selectedChain}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Staking Flow Modal */}
        {showStakingFlow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#060F32]">Bridge & Stake</h2>
        <button
                    onClick={() => setShowStakingFlow(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
        </button>
                </div>
                <StakingFlow
                  onComplete={() => {
                    setShowStakingFlow(false);
                    toast.success("Staking completed successfully!");
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Network Metrics (always visible) */}
          <NetworkMetrics />

          {/* Top CTA - Immediately visible */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-center sm:text-left mb-3 sm:mb-0">
              <div className="text-[#060F32] font-medium text-md">Bring Assets to Helios</div>
              <div className="text-[#828DB3] text-xs">Bridge your assets from external chains – they count as staked and start earning HLS</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowChainSelector(true)}
                className="bg-[#002DCB] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0045FF] transition-colors"
              >
                Bridge & Stake
              </button>
            </div>
          </div>

          {/* TVL + Assets (compact side-by-side on large screens) - move above personalized */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5">
              <TVLChart />
                    </div>
            <div className="lg:col-span-7">
              <AssetOverview />
                  </div>
                </div>

          {/* Full-width staking info */}
          <StakeInfoSection />

          {/* Full-width supported chains */}
          <SupportedChains />

          {/* Personalized Dashboard for authenticated users */}
          <PersonalizedDashboard />
                        </div>
            </div>

      {/* Use the new Footer component */}
      <Footer />

      {/* Chain Selector Modal */}
      {showChainSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#060F32]">Select Origin Chain</h2>
                <button
                  onClick={() => setShowChainSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
                          </div>
              <ChainSelector
                onChainSelect={(chain) => {
                  setSelectedChain(chain);
                  setShowChainSelector(false);
                  setShowStakingFlow(true);
                }}
                selectedChain={selectedChain}
              />
            </div>
          </motion.div>
                </div>
      )}

      {/* Staking Flow Modal */}
      {showStakingFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#060F32]">Start Staking</h2>
                      <button
                  onClick={() => setShowStakingFlow(false)}
                  className="text-gray-400 hover:text-gray-600"
                      >
                  <X className="w-6 h-6" />
                      </button>
                    </div>
              <StakingFlow
                onComplete={() => {
                  setShowStakingFlow(false);
                  toast.success("Staking completed successfully!");
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;