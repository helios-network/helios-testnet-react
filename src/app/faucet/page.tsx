"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ViewContext } from "@/components/LayoutClientWrapper";
import FaucetContent from "./FaucetContent";

export default function FaucetPage() {
  const { setCurrentView } = React.useContext(ViewContext);
  const pathname = usePathname();
  
  useEffect(() => {
    setCurrentView("faucet");
  }, [setCurrentView]);

  // This component just sets the current view
  // The actual content is rendered by LayoutClientWrapper based on currentView
  // This prevents duplicate rendering
  return null;
} 