import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useStore } from "../store/onboardingStore";
import { useAccount } from "wagmi";
import { ViewContext } from "./LayoutClientWrapper";
import Footer from "./Footer";
import { toast } from "react-toastify";
import ChainSelector from "./ChainSelector";
import TVLChart from "./TVLChart";
import TVLOverview from "./TVLOverview";
import HLSRewardsSimulator from "./HLSRewardsSimulator";
import StakedSummaryBar from "@/components/StakedSummaryBar";
import StakeInfoSection from "./StakeInfoSection";
import WrapperModal from "./WrapperModal";

const Dashboard = () => {
  const { address } = useAccount();
  const { setCurrentView } = React.useContext(ViewContext);
  const step = useStore((state) => state.step);
  const isAuthenticated = step > 0;
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [selectedChain, setSelectedChain] = useState<any>(null);
  const [useZoom, setUseZoom] = useState(false);
  const [showWrapperModal, setShowWrapperModal] = useState(false);
  const [wrapperChainId, setWrapperChainId] = useState<number | undefined>(undefined);
  const [wrapperSymbol, setWrapperSymbol] = useState<string | undefined>(undefined);

  // Emulate browser zoom (+15%) while keeping content filling viewport
  const SCALE = 1.15;
  const scaledContainerStyle: React.CSSProperties = useZoom
    ? ({ zoom: SCALE } as any)
    : {
        transform: `scale(${SCALE})`,
        transformOrigin: "top left",
        width: `${100 / SCALE}%`,
        minHeight: `${100 / SCALE}vh`,
      };

  useEffect(() => {
    try {
      const supportsZoom = typeof window !== "undefined" && (CSS as any)?.supports?.("zoom", "1.15");
      if (supportsZoom) setUseZoom(true);
    } catch {}
  }, []);

  // Open Chain Selector when other components dispatch the global event
  useEffect(() => {
    const handler = () => setShowChainSelector(true);
    window.addEventListener('helios:open-bridge', handler as EventListener);
    return () => window.removeEventListener('helios:open-bridge', handler as EventListener);
  }, []);

  // Open Wrapper Modal when ChainSelector dispatches the wrapper event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('[Dashboard] Wrapper event received:', detail);
      setWrapperChainId(detail?.chainId);
      setWrapperSymbol(detail?.tokenSymbol);
      setShowWrapperModal(true);
    };
    window.addEventListener('helios:open-wrapper', handler as EventListener);
    return () => window.removeEventListener('helios:open-wrapper', handler as EventListener);
  }, []);

  // Public view for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col overflow-auto">
        <div style={scaledContainerStyle}>
        <div className="flex-grow py-4 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
      
            {/* Top CTA - Immediately visible */}
            <div className="bg-[url(/images/header-background.png)] backdrop-blur-sm rounded-[25px] px-8 py-6 mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="text-center mb-3 text-white">
                  <div className="text-md font-medium">Bring Assets to Helios</div>
                  <div className="text-blue-100 text-xs">Deposit from Ethereum, BNB, Arbitrum, Base, Optimism, or Polygon and start earning HLS instantly.<br/>Your assets stay safe and can be sent back to their source chain by December 1.</div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowChainSelector(true)}
                    className="bg-white px-4 py-2 rounded-[12px] text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Bridge to Helios
                  </button>
                </div>
              </div>
            </div>

            {/* TVL Overview compact under CTA */}
            <TVLOverview compact />

            {/* TVL Chart and Rewards Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 mb-4 gap-4">
              <div className="lg:col-span-7">
                <TVLChart />
              </div>
              <div className="lg:col-span-5">
                <HLSRewardsSimulator />
              </div>
            </div>

            {/* Full-width staking info */}
            <StakeInfoSection />

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[url(/images/header-background.png)] backdrop-blur-sm rounded-[25px] px-8 py-6"
            >
              <div className="text-center mb-3 text-white">
                <h2 className="text-md font-medium">Ready to Start Earning?</h2>
                <p className="text-blue-100 text-xs">Connect your wallet to start bridging assets and earning HLS rewards on the Helios Beta Mainnet.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowChainSelector(true)}
                  className="bg-white px-4 py-2 rounded-[12px] text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Bridge Assets Now
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
        </div>
        {/* Chain Selector Modal */}
        {showChainSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white max-w-6xl w-full h-full overflow-y-auto"
            >
              <div className="px-10 pt-8 pb-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Select Origin Chain</h2>
                  <button
                    onClick={() => setShowChainSelector(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <ChainSelector
                  onChainSelect={(chain) => {
                    setSelectedChain(chain);
                  }}
                  selectedChain={selectedChain}
                  onSubmitted={() => setShowChainSelector(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
        {/* Removed Staking Flow UI */}
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col overflow-auto">
      <div style={scaledContainerStyle}>
      {/* Main content */}
      <div className="flex-grow py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
       
          {/* Top CTA - Immediately visible (moved above summary) */}
          <div className="bg-[url(/images/header-background.png)] backdrop-blur-sm rounded-[25px] px-8 py-6 mb-4">
            <div className="flex flex-col items-center text-center">
              <div className="text-center mb-3 text-white">
                <div className="text-md font-medium">Bring Assets to Helios</div>
                <div className="text-blue-100 text-xs">Deposit from Ethereum, BNB, Arbitrum, Base, Optimism, or Polygon and start earning HLS instantly. Your assets stay safe and can be sent back to their source chain by December 1.</div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowChainSelector(true)}
                  className="bg-blue-50/90 px-4 py-2 rounded-[12px] text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Bridge to Helios
                </button>
              </div>
            </div>
          </div>

          {/* TVL Overview compact under CTA (above summary) */}
          <TVLOverview compact />

          {/* Compact staked summary for authenticated users */}
          <StakedSummaryBar />

          {/* TVL Chart and Rewards Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <TVLChart />
                    </div>
            <div className="lg:col-span-5">
              <HLSRewardsSimulator />
                  </div>
                </div>

          {/* Full-width staking info */}
          <StakeInfoSection />

          {/* Full-width supported chains */}
         

          {/* Personalized dashboard removed from main view to keep top lightweight */}
                        </div>
            </div>

      {/* Use the new Footer component */}
      <Footer />
      </div>
      {/* Chain Selector Modal */}
      {showChainSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-6xl w-full h-full overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#060F32]">Select Origin Chain</h2>
                <button
                  onClick={() => setShowChainSelector(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
                          </div>
              <ChainSelector
                onChainSelect={(chain) => {
                  setSelectedChain(chain);
                }}
                selectedChain={selectedChain}
                onSubmitted={() => setShowChainSelector(false)}
              />
            </div>
          </motion.div>
                </div>
      )}
      {/* Removed Staking Flow Modal */}

      {/* Wrapper Modal */}
      <WrapperModal
        key={`wrapper-${wrapperChainId || 'default'}`}
        isOpen={showWrapperModal}
        onClose={() => {
          setShowWrapperModal(false);
          setWrapperChainId(undefined);
          setWrapperSymbol(undefined);
        }}
        defaultChainId={wrapperChainId}
        defaultSymbol={wrapperSymbol}
      />
    </div>
  );
};

export default Dashboard;