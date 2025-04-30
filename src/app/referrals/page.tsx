"use client";

import React, { useEffect, useState } from "react";
import { ViewContext } from "@/components/LayoutClientWrapper";

export default function ReferralsPage() {
  const { setCurrentView } = React.useContext(ViewContext);
  const [isLoading, setIsLoading] = useState(true);
  
  // Set the current view to referrals when this page loads
  useEffect(() => {
    setCurrentView("referrals");
    // Short timeout to ensure smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setCurrentView]);

  // During initial load, show minimal or no content
  // The actual content is rendered by LayoutClientWrapper based on currentView
  return null;
} 