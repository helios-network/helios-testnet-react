"use client";

import React, { useEffect, useState, useRef } from "react";
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { useStore } from "../store/onboardingStore"; // adjust path
import ConnectWallet from "./ConnectWallet"; // adjust path
import Dashboard from "./Dashboard"; // adjust path
import GamifiedDashboard from "./GamifiedDashboard";
import { Toaster, toast } from "sonner";
import Header from "./Header";
import NextTopLoader from "nextjs-toploader";
import s from "./wrapper.module.scss";
import { StrictMode } from "react";
import ReferralLeaderboard from "../components/ReferralLeaderboard";
import Leaderboard from "../components/Leaderboard";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import LoadingIndicator from './LoadingIndicator';
import { api } from "../services/api";
import { ethers } from "ethers";
import { SeasonProvider } from "../contexts/SeasonContext";

// Dynamically import the Faucet content component
const FaucetContent = dynamic(() => import('../app/faucet/FaucetContent'), { ssr: false });

// Persist across remounts to avoid showing spinners on client-side route changes
let hasHydratedOnce = false;
let hasInitializedOnce = false;

export const ViewContext = React.createContext({
  currentView: "dashboard",
  setCurrentView: (view: string) => {},
});

// Map URL paths to view names
const pathToViewMap: Record<string, string> = {
  '/': 'dashboard',
  '/season': 'season',
  '/referrals': 'referrals',
  '/leaderboard': 'leaderboard',
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
  const [isInitializing, setIsInitializing] = useState(!hasInitializedOnce);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const autoAuthRef = useRef(false);

  // Sync currentView with URL path
  useEffect(() => {
    if (pathname && pathToViewMap[pathname]) {
      setCurrentView(pathToViewMap[pathname]);
    }
  }, [pathname]);

  // Initial app loading and reaction to user state changes
  useEffect(() => {
    if (hasInitializedOnce) return;
    const init = async () => {
      try {
        setIsInitializing(true);
        await initialize();
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        hasInitializedOnce = true;
        setIsInitializing(false);
      }
    };
    init();
  }, [initialize]);

  // Intercept fetch to catch JWT expiry and notify app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch;
    window.fetch = async (...args: any[]) => {
      const response = await originalFetch(...args as Parameters<typeof originalFetch>);
      if (response && response.status === 401) {
        try {
          const cloned = response.clone();
          const data = await cloned.json().catch(() => null);
          const msg = data?.message || '';
          if (/jwt expired|token expired|TokenExpiredError/i.test(msg)) {
            window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: msg } }));
          }
        } catch {
          // ignore parsing issues
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Handle auth expired: clear state, disconnect wallet, inform user
  useEffect(() => {
    const onAuthExpired = () => {
      try {
        useStore.getState().logout();
      } catch {}
      try {
        disconnect();
      } catch {}
      toast.error('Your session expired. Please reconnect your wallet.');
    };
    window.addEventListener('auth:expired', onAuthExpired);
    return () => window.removeEventListener('auth:expired', onAuthExpired);
  }, [disconnect]);

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

  // Onboarding flow removed; always render app layout

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
        {currentView === "leaderboard" && isAuthenticated && <Leaderboard />}
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
  const [hydrated, setHydrated] = useState(hasHydratedOnce);
  const pathname = usePathname();

  // Handle hydration
  useEffect(() => {
    if (!hasHydratedOnce) {
      setHydrated(true);
      hasHydratedOnce = true;
    }
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
