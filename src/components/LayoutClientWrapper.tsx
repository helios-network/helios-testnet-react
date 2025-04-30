"use client";

import React, { useEffect, useState } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { useStore } from "../store/onboardingStore"; // adjust path
import ConnectWallet from "./ConnectWallet"; // adjust path
import OnboardingFlow from "./OnboardingFlow"; // adjust path
import Dashboard from "./Dashboard"; // adjust path
import { Toaster } from "sonner";
import { Header } from "../app/(components)/header";
import NextTopLoader from "nextjs-toploader";
import s from "./wrapper.module.scss";
import { StrictMode } from "react";
import ReferralLeaderboard from "../components/ReferralLeaderboard";

export const ViewContext = React.createContext({
  currentView: "dashboard",
  setCurrentView: (view: string) => {},
});

function AppContent() {
  const step = useStore((state) => state.step);
  const resetStore = useStore((state) => state.resetStore);
  const setStep = useStore((state) => state.setStep);
  const initialize = useStore((state) => state.initialize);
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<string>("dashboard");

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
      {currentView === "dashboard" && <Dashboard />}
      {currentView === "referrals" && <ReferralLeaderboard />}
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

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <StrictMode>
        {/* <Header /> */}
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
