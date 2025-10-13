"use client";

import React, { useEffect, useState, useRef } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { useStore } from "../store/onboardingStore"; // adjust path
import ConnectWallet from "./ConnectWallet"; // adjust path
import OnboardingFlow from "./OnboardingFlow"; // adjust path
import Dashboard from "./Dashboard"; // adjust path
import GamifiedDashboard from "./GamifiedDashboard";
import { Toaster } from "sonner";
import Header from "./Header";
import NextTopLoader from "nextjs-toploader";
import s from "./wrapper.module.scss";
import { StrictMode } from "react";
import ReferralLeaderboard from "../components/ReferralLeaderboard";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import LoadingIndicator from './LoadingIndicator';
import { api } from "../services/api";
import { ethers } from "ethers";
import { SeasonProvider } from "../contexts/SeasonContext";

// Dynamically import the Faucet content component
const FaucetContent = dynamic(() => import('../app/faucet/FaucetContent'), { ssr: false });

export const ViewContext = React.createContext({
  currentView: "dashboard",
  setCurrentView: (view: string) => {},
});

// Map URL paths to view names
const pathToViewMap: Record<string, string> = {
  '/': 'dashboard',
  '/season': 'season',
  '/referrals': 'referrals',
  '/faucet': 'faucet',
  '/admin': 'admin'
};

function AppContent() {
  // Select state individually to prevent re-renders from creating new objects
  const step = useStore((state) => state.step);
  const initialize = useStore((state) => state.initialize);
  const user = useStore((state) => state.user);
  const requiresBotVerification = useStore((state) => state.requiresBotVerification);
  
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);
  const { address, isConnected } = useAccount();
  const autoAuthRef = useRef(false);

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
  }, [initialize]); // Remove user from dependency array to prevent re-initialization loops

  // Dashboard is publicly viewable, other views require authentication
  const isPublicView = currentView === "dashboard";
  const isAuthenticated = step > 0 && !requiresBotVerification;

  // Auto-sign and authenticate on Home when wallet connects and no JWT exists
  useEffect(() => {
    const maybeAutoAuthenticate = async () => {
      if (isInitializing) return;
      if (!isPublicView) return; // only on Home
      if (!isConnected || !address) return;
      if (requiresBotVerification) return; // gate handled by ConnectWallet
      if (autoAuthRef.current) return; // prevent loops

      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
      if (token) return; // already authenticated

      autoAuthRef.current = true;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const message = `Welcome to Helios! Please sign this message to verify your wallet ownership.\n\nWallet: ${address}`;
        const signature = await signer.signMessage(message);

        const loginResponse = await api.login(address, signature);
        if (loginResponse?.requiresBotVerification) {
          useStore.getState().setRequiresBotVerification(true);
          autoAuthRef.current = false; // allow retry after verification flow
          return;
        }

        useStore.getState().setUser(loginResponse.user);
        await useStore.getState().initialize(loginResponse.user);
      } catch (err) {
        console.error('Home auto-auth failed:', err);
        // let the user click Continue manually; don't loop
        autoAuthRef.current = false;
      }
    };

    void maybeAutoAuthenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicView, isConnected, address, requiresBotVerification]);

  // Show loading indicator while initializing
  if (isInitializing) {
    return <LoadingIndicator isLoading={true} text="Loading Helios Beta Mainnet..." />;
  }

  // If bot verification is required, show connect wallet
  if (requiresBotVerification) {
    return <ConnectWallet />;
  }

  // If not authenticated and not on dashboard, show connect wallet
  if (step === 0 && currentView !== "dashboard") {
    return <ConnectWallet />;
  }

  // If in onboarding flow
  if (step >= 2 && step < 7) {
    return <OnboardingFlow />;
  }

  // If trying to access protected views without authentication, show connect wallet
  if (!isPublicView && !isAuthenticated) {
    return <ConnectWallet />;
  }

  // Provide the ViewContext and render the appropriate component based on currentView
  return (
    <SeasonProvider>
      <ViewContext.Provider value={{ currentView, setCurrentView }}>
        <Header currentView={currentView} />
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "season" && isAuthenticated && <GamifiedDashboard />}
        {currentView === "referrals" && isAuthenticated && <ReferralLeaderboard />}
        {currentView === "faucet" && isAuthenticated && <FaucetContent />}
        {currentView === "admin" && isAuthenticated && null} {/* Admin content will be rendered via children */}
      </ViewContext.Provider>
    </SeasonProvider>
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
