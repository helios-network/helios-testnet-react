"use client";

import React, { useEffect } from "react";
import { ViewContext } from "@/components/LayoutClientWrapper";

export default function SeasonPage() {
  const { setCurrentView } = React.useContext(ViewContext);

  useEffect(() => {
    setCurrentView("season");
  }, [setCurrentView]);

  // Content is rendered by LayoutClientWrapper based on currentView
  return null;
}


