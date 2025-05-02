import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ViewContext } from "./LayoutClientWrapper";
import { api } from "../services/api";
import { Share2, Users, Copy, CheckCircle2 } from "lucide-react";

const InviteCodeDisplay = () => {
  const { address } = useAccount();
  const { setCurrentView } = React.useContext(ViewContext);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState<number | null>(null);
  const [referralXP, setReferralXP] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("InviteCodeDisplay: Fetching user profile");

    // Don't attempt to fetch if we don't have a wallet address
    if (!address) {
      console.log("InviteCodeDisplay: No wallet address available");
      setLoading(false);
      setError("No wallet connected");
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fallback code for testing if API doesn't return a code
        const fallbackCode =
          "HELIOS" + Math.random().toString(36).substring(2, 8).toUpperCase();
        // setReferralCode(fallbackCode);

        // Fetch both profile and referrals
        try {
          console.log(
            "InviteCodeDisplay: Fetching profile for wallet",
            address
          );
          const [userProfile, referralsResponse] = await Promise.all([
            api.getUserProfile(address),
            api.getUserReferrals(1, 1),
          ]);

          console.log("InviteCodeDisplay: User profile", userProfile);
          // If we got a referral code from profile API, use it
          if (userProfile && userProfile.referralCode) {
            console.log(
              "InviteCodeDisplay: Referral code found in profile",
              userProfile.referralCode
            );
            setReferralCode(userProfile.referralCode);
          }

          // Set referral count from response
          if (referralsResponse && referralsResponse.success) {
            console.log("InviteCodeDisplay: Referrals data", referralsResponse);
            // Get code from referrals response if not already set
            if (!referralCode && referralsResponse.referralCode) {
              setReferralCode(referralsResponse.referralCode);
            }
            // Set the referral count and XP
            setReferralCount(referralsResponse.referralCount);
            setReferralXP(referralsResponse.referralXP);
          }
        } catch (fetchError) {
          console.error("InviteCodeDisplay: Error fetching data:", fetchError);
          console.log("fallbackCode", fallbackCode);
          setReferralCode(fallbackCode);
        }
      } catch (error) {
        console.error("InviteCodeDisplay: Error in data fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [address]);

  const handleCopy = () => {
    if (!referralCode) return;

    navigator.clipboard
      .writeText(referralCode)
      .then(() => {
        setCopied(true);
        console.log("InviteCodeDisplay: Code copied", referralCode);

        // Clear existing timeout if any
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Reset copied state after 2 seconds
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  };

  const handleShareOnX = () => {
    if (!referralCode) return;

    const tweetText = `Join me on Helios Testnet! Use my invite code: ${referralCode} to get started. #Helios #Blockchain #Testnet`;
    const encodedText = encodeURIComponent(tweetText);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  // Mobile-optimized display
  return (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      {loading ? (
        <div className="bg-white/70 rounded-full py-1 px-3 flex items-center">
          <div className="loading-shimmer h-4 w-20 rounded-md"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50/90 rounded-full py-1 px-3 flex items-center border border-red-200">
          <div className="text-red-500 text-xs">Error</div>
        </div>
      ) : referralCode ? (
        <>
          <button
            onClick={() => setCurrentView("referrals")}
            className="bg-[#002DCB] text-white rounded-full px-4 py-2 flex items-center hover:bg-[#0025B3] transition-colors shadow-sm active:shadow-inner"
            title="View Referral Leaderboard"
          >
            <Users className="w-4 h-4 mr-2" />
            <div className="flex flex-col items-start">
              <span className="text-base font-medium whitespace-nowrap">
                {referralCount || 0}{" "}
                <span className="xs:inline">Referrals</span>
              </span>
            </div>
          </button>

          <div className="bg-white/80 rounded-full px-3 py-2 flex items-center border border-[#002DCB]/10 shadow-sm">
            <div className="text-sm font-medium text-[#002DCB] mr-1.5 hidden sm:block">
              Code:
            </div>
            <div className="text-sm font-bold text-[#060F32] mr-1.5">
              {referralCode}
            </div>
            <button
              onClick={handleCopy}
              className="text-[#002DCB] p-1.5 rounded-full hover:bg-[#E2EBFF] active:bg-[#D7E0FF] transition-colors"
              aria-label="Copy invite code"
              title="Copy to clipboard"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50/80 rounded-full py-1 px-3 flex items-center">
          <div className="text-yellow-600 text-xs">No code</div>
        </div>
      )}
    </div>
  );
};

export default InviteCodeDisplay;
