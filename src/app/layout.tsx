"use client";
import React, { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "../wagmiConfig/config"; // Adjust the path if needed
import { useStore } from "../store/onboardingStore"; // Adjust path to useStore
import ConnectWallet from "../components/ConnectWallet"; // Adjust path to components
import OnboardingFlow from "../components/OnboardingFlow"; // Adjust path to components
import Dashboard from "../components/Dashboard"; // Adjust path to components
import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import "@/styles/globals.scss";

export const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const step = useStore((state) => state.step);
  const initialize = useStore((state) => state.initialize);

  console.log("step", step);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <html lang="en">
            <body>
              {/* You can render the current page (children) here */}
              {step === 0 && <ConnectWallet />}
              {step >= 2 && step < 7 && <OnboardingFlow />}
              {step === 7 && <Dashboard />}
              {children}
            </body>
          </html>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  );
}
