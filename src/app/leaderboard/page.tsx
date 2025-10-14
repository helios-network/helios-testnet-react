"use client";

import React, { useEffect, useState } from "react";
import { ViewContext } from "@/components/LayoutClientWrapper";

export default function LeaderboardPage() {
  const { setCurrentView } = React.useContext(ViewContext);
  
  useEffect(() => {
    setCurrentView("leaderboard");
    
  }, [setCurrentView]);

  return null;
}
