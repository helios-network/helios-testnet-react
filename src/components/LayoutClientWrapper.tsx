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
  const { 
    step, 
    resetStore, 
    setStep, 
    initialize, 
    isLoading, 
    loadingMessage 
  } = useStore();
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Sync currentView with URL path
  useEffect(() => {
    if (pathname && pathToViewMap[pathname]) {
      setCurrentView(pathToViewMap[pathname]);
    }
  }, [pathname]);

  // Monitor wallet connection and authentication status
  useEffect(() => {
    if (initializationComplete) {
      let connectionCheckTimer: NodeJS.Timeout | null = null;
      
      const checkAuthenticationStatus = async () => {
        const token = localStorage.getItem("jwt_token");

        // Check if the disconnection is persistent before clearing token
        if (token && !isConnected) {
          console.log("Potential wallet disconnection detected, verifying...");
          
          // Add a delay to avoid reacting to temporary connection issues
          // Only clear the session if the wallet is still disconnected after the delay
          if (connectionCheckTimer) clearTimeout(connectionCheckTimer);
          
          connectionCheckTimer = setTimeout(async () => {
            // Check again if still disconnected after delay
            if (!isConnected) {
              console.log("Confirmed: Wallet disconnected but token exists: Clearing session");
              localStorage.removeItem("jwt_token");
              resetStore();
              setStep(0);
            } else {
              console.log("False alarm: Wallet connection restored");
            }
          }, 3000); // 3 second delay
          
          return; // Exit early, let the timeout handle it
        } 
        
        if (step > 0 && !token) {
          // We're in an authenticated step but token is missing
          console.log("Missing token but in authenticated step: Resetting to login");
          resetStore();
          setStep(0);
        } else if (token && isConnected && step === 0) {
          // If we have token and wallet but showing connect screen, try to initialize
          try {
            await initialize();
            // If initialization succeeds, the step will be updated by the initialize function
          } catch (error: any) {
            console.error("Failed to initialize with existing token:", error);
            
            // Handle case where initialization fails due to unconfirmed account
            if (error.message?.includes("not confirmed") || 
                error.requiresInviteCode ||
                error.response?.status === 403) {
              console.log("Account needs confirmation with an invite code");
              
              // Make sure we're on the connect wallet step to show the invite code form
              if (step !== 0) {
                setStep(0);
              }
              
              // Clear token - user will need to go through login flow again
              localStorage.removeItem("jwt_token");
              resetStore();
            } else {
              // For other errors, also clear token
              localStorage.removeItem("jwt_token");
              resetStore();
            }
          }
        }
      };

      checkAuthenticationStatus();
      
      // Cleanup timeout on unmount or when dependencies change
      return () => {
        if (connectionCheckTimer) {
          clearTimeout(connectionCheckTimer);
        }
      };
    }
  }, [isConnected, step, resetStore, setStep, initialize, initializationComplete]);

  // Initial app loading
  useEffect(() => {
    const performInitialization = async () => {
      try {
        setIsInitializing(true);
        await initialize();
      } catch (error) {
        console.error("Initialization error:", error);
        // Error handling is already done in the initialize function
      } finally {
        setIsInitializing(false);
        setInitializationComplete(true);
      }
    };

    performInitialization();
  }, [initialize]);

  // Show loading indicator while initializing or when global loading is active
  if (isInitializing || (!initializationComplete && isLoading)) {
    return <LoadingIndicator isLoading={true} text={isLoading ? loadingMessage : "Initializing Helios Testnet..."} />;
  }

  // Show global loading overlay when store loading is active
  if (isLoading) {
    return <LoadingIndicator isLoading={true} text={loadingMessage} />;
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
  const { step, initialize, isLoading, loadingMessage } = useStore();
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
