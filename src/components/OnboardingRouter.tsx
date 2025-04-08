// components/OnboardingRouter.tsx
"use client";

import { useEffect } from "react";
import { useStore } from "../store/onboardingStore";
import ConnectWallet from "./ConnectWallet";
import OnboardingFlow from "./OnboardingFlow";
import Dashboard from "./Dashboard";

export default function OnboardingRouter() {
  const { step, initialize } = useStore((state) => ({
    step: state.step,
    initialize: state.initialize,
  }));

  useEffect(() => {
    initialize(); // Only runs in browser
  }, []);

  if (step === 0) return <ConnectWallet />;
  if (step >= 2 && step < 7) return <OnboardingFlow />;
  if (step === 7) return <Dashboard />;

  return null;
}
