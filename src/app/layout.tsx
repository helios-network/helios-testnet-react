"use client";
import React, { useEffect, useState } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { config } from "../wagmiConfig/config"; // Adjust the path if needed
import { useStore } from "../store/onboardingStore"; // Adjust path to useStore
import ConnectWallet from "../components/ConnectWallet"; // Adjust path to components
import OnboardingFlow from "../components/OnboardingFlow"; // Adjust path to components
import Dashboard from "../components/Dashboard"; // Adjust path to components
import ReferralLeaderboard from "../components/ReferralLeaderboard";
import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import "@/styles/globals.scss";

export const queryClient = new QueryClient();

// Create a context for the current view
export const ViewContext = React.createContext({
  currentView: 'dashboard',
  setCurrentView: (view: string) => {},
});

function AppContent() {
  const step = useStore((state) => state.step);
  const resetStore = useStore((state) => state.resetStore);
  const setStep = useStore((state) => state.setStep);
  const initialize = useStore((state) => state.initialize);
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Monitor wallet connection and authentication status
  useEffect(() => {
    const checkAuthenticationStatus = () => {
      const token = localStorage.getItem("jwt_token");
      
      // If we have a token but no wallet connection, or in dashboard without token
      if ((token && !isConnected) || (step > 0 && !token)) {
        console.log("Authentication state mismatch: Clearing session");
        localStorage.removeItem("jwt_token");
        resetStore();
        setStep(0);
      } else if (token && isConnected && step === 0) {
        // If we have token and wallet but showing connect screen, initialize
        initialize();
      }
    };
    
    checkAuthenticationStatus();
  }, [isConnected, step, resetStore, setStep, initialize]);

  // Initial app loading
  useEffect(() => {
    initialize();
  }, [initialize]);

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
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'referrals' && <ReferralLeaderboard />}
    </ViewContext.Provider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <html lang="en">
            <body>
              <AppContent />
              {children}
            </body>
          </html>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  );
}
