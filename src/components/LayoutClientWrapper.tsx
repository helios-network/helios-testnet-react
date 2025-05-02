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
  '/faucet': 'faucet'
};

function AppContent() {
  const step = useStore((state) => state.step);
  const resetStore = useStore((state) => state.resetStore);
  const setStep = useStore((state) => state.setStep);
  const initialize = useStore((state) => state.initialize);
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync currentView with URL path
  useEffect(() => {
    if (pathname && pathToViewMap[pathname]) {
      setCurrentView(pathToViewMap[pathname]);
    }
  }, [pathname]);

  // Monitor wallet connection and authentication status
  useEffect(() => {
    const checkAuthenticationStatus = async () => {
      const token = localStorage.getItem("jwt_token");

      // Only reset if wallet disconnected with token (user manually disconnected wallet)
      if (token && !isConnected) {
        console.log("Wallet disconnected but token exists: Clearing session");
        localStorage.removeItem("jwt_token");
        resetStore();
        setStep(0);
      } else if (step > 0 && !token) {
        // We're in an authenticated step but token is missing
        console.log("Missing token but in authenticated step: Resetting to login");
        resetStore();
        setStep(0);
      } else if (token && isConnected && step === 0) {
        // If we have token and wallet but showing connect screen, try to initialize
        try {
          await initialize();
        } catch (error) {
          console.error("Failed to initialize with existing token:", error);
          // Only clear token if initialization explicitly fails
          localStorage.removeItem("jwt_token");
          resetStore();
        }
      }
      setIsInitializing(false);
    };

    checkAuthenticationStatus();
  }, [isConnected, step, resetStore, setStep, initialize]);

  // Initial app loading
  useEffect(() => {
    initialize();
  }, [initialize]);

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
    </ViewContext.Provider>
  );
}

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const step = useStore((state) => state.step);
  const initialize = useStore((state) => state.initialize);
  const [hydrated, setHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show a minimal loading state until hydration is complete
  if (!hydrated) {
    return <LoadingIndicator isLoading={true} text="Initializing..." />;
  }

  return (
    <>
      <StrictMode>
        <AppContent />
        {children}
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
