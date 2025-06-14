"use client";

import React, { useEffect, useState } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { useStore } from "../store/onboardingStore"; // adjust path
import ConnectWallet from "./ConnectWallet"; // adjust path
import OnboardingFlow from "./OnboardingFlow"; // adjust path
import Dashboard from "./Dashboard"; // adjust path
import { Toaster } from "sonner";
import Header from "./Header";
import NextTopLoader from "nextjs-toploader";
import s from "./wrapper.module.scss";
import { StrictMode } from "react";
import ReferralLeaderboard from "../components/ReferralLeaderboard";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import LoadingIndicator from './LoadingIndicator';

// Dynamically import the Faucet content component
const FaucetContent = dynamic(() => import('../app/faucet/FaucetContent'), { ssr: false });

export const ViewContext = React.createContext({
  currentView: "dashboard",
  setCurrentView: (view: string) => {},
});

// Map URL paths to view names
const pathToViewMap: Record<string, string> = {
  '/': 'dashboard',
  '/referrals': 'referrals',
  '/faucet': 'faucet',
  '/admin': 'admin'
};

function AppContent() {
  const step = useStore((state) => state.step);
  const initialize = useStore((state) => state.initialize);
  const user = useStore((state) => state.user);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync currentView with URL path
  useEffect(() => {
    if (pathname && pathToViewMap[pathname]) {
      setCurrentView(pathToViewMap[pathname]);
    }
  }, [pathname]);

  // Initial app loading and reaction to user state changes
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        await initialize();
      } catch (error) {
        console.error("Initialization failed:", error);
        // Errors are handled inside the initialize function (e.g., reset store)
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [initialize, user]);

  // Show loading indicator while initializing
  if (isInitializing) {
    return <LoadingIndicator isLoading={true} text="Loading Helios Testnet..." />;
  }

  // If not authenticated yet, show connect wallet
  if (step === 0) {
    return <ConnectWallet />;
  }

  // If in onboarding flow
  if (step >= 2 && step < 7) {
    return <OnboardingFlow />;
  }

  // User is authenticated and past onboarding
  // Provide the ViewContext and render the appropriate component based on currentView
  return (
    <ViewContext.Provider value={{ currentView, setCurrentView }}>
      <Header currentView={currentView} />
      {currentView === "dashboard" && <Dashboard />}
      {currentView === "referrals" && <ReferralLeaderboard />}
      {currentView === "faucet" && <FaucetContent />}
      {currentView === "admin" && null} {/* Admin content will be rendered via children */}
    </ViewContext.Provider>
  );
}

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  // Handle hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Show a minimal loading state until hydration is complete
  if (!hydrated) {
    return <LoadingIndicator isLoading={true} text="Initializing..." />;
  }

  // Check if we're on the admin page
  const isAdminPage = pathname === '/admin';

  return (
    <>
      <StrictMode>
        <div className={s.container}>
          <AppContent />
          {isAdminPage && (
            <div className={s.adminContent}>
              {children}
            </div>
          )}
        </div>
        <NextTopLoader
          color="var(--primary-medium)"
          height={2}
          showSpinner={false}
          zIndex={9999}
        />
        <Toaster
          position="bottom-right"
          visibleToasts={3}
          toastOptions={{
            className: s.toast,
          }}
        />
        <div id="modal-root" />
      </StrictMode>
    </>
  );
}
