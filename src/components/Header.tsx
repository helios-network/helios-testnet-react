import React, { useState, useEffect, useCallback } from "react";
import { Home, Trophy, Droplet, Menu, X, Shield, CalendarDays } from "lucide-react";
import { ViewContext } from "./LayoutClientWrapper";
import InviteCodeDisplay from "./InviteCodeDisplay";
import { useRouter } from "next/navigation";
import { useStore } from "../store/onboardingStore";
import { api } from "../services/api";
import { Chains } from "../app/(components)/chains";
import { Wallet } from "../app/(components)/wallet";
import { useAccount, useBalance } from "wagmi";
import { heliosTestnet } from "../wagmiConfig/config";
import Image from "next/image";
import NetworkSwitcher from "./NetworkSwitcher";

interface HeaderProps {
  currentView: string;
}

// Discord SVG icon component
const DiscordIcon = () => (
  <svg
    viewBox="0 -28.5 256 256"
    xmlns="http://www.w3.org/2000/svg"
    className="w-3.5 h-3.5"
    fill="currentColor"
  >
    <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36zM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18z" />
  </svg>
);

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { setCurrentView } = React.useContext(ViewContext);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const isUserLoading = useStore((state) => state.isUserLoading);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showReferralMenu, setShowReferralMenu] = useState(false);
  const referralRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [isPollingForDiscord, setIsPollingForDiscord] = useState(false);
  const { address } = useAccount();
  const step = useStore((state) => state.step);
  const requiresBotVerification = useStore((state) => state.requiresBotVerification);
  const isAuthenticated = step > 0 && !requiresBotVerification;

  // Admin wallet addresses (should match the ones in admin page)
  const ADMIN_WALLETS = [
    "0x8984e422E30033A84B780420566046d25EB3519a".toLowerCase(), // Fred wallet
    "0x007a1123a54cdD9bA35AD2012DB086b9d8350A5f".toLowerCase(), // testnet wallet 1
    "0xcfc9b7c86c97b0b5b6a5f897f102408ba3ca07d8".toLowerCase(), // chris wallet
    "0x688feDf2cc9957eeD5A56905b1A0D74a3bAc0000".toLowerCase(), // jiji wallet
    "0xc1DC703e60DFcAF560eA5E3C8Ab1CaeD738CA138".toLowerCase(), // yami wallet
    "0x34d91c8cd5bb040a046363c691b17375a10c4eca".toLowerCase(), // chris new wallet
  ];

  const isAdmin = address && ADMIN_WALLETS.includes(address.toLowerCase());

  const navItems = [
    {
      key: "dashboard",
      label: "Home",
      icon: <Home className="w-4 h-4" />,
      path: "/",
    },
    {
      key: "season",
      label: "Season",
      icon: <CalendarDays className="w-4 h-4" />,
      path: "/season",
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: <Trophy className="w-4 h-4" />,
      path: "/leaderboard",
    },
    {
      key: "faucet",
      label: "Faucet",
      icon: <Droplet className="w-4 h-4" />,
      path: "/faucet",
    },
    ...(isAdmin ? [{
      key: "admin",
      label: "Admin",
      icon: <Shield className="w-4 h-4" />,
      path: "/admin",
    }] : []),
  ];

  const handleNavClick = (view: string, path: string) => {
    setCurrentView(view);
    router.push(path);
    setMobileMenuOpen(false);
  };

  // Function to refresh user data from the API
  const refreshUserData = useCallback(async () => {
    if (!user?.wallet) return;

    try {
      const updatedUserData = await api.getUserProfile(user.wallet);
      console.log("Refreshed user data:", updatedUserData);
      setUser(updatedUserData);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [user?.wallet, setUser]);

  // Poll for user data updates after Discord link is opened
  useEffect(() => {
    if (!isPollingForDiscord) return;

    console.log("Starting to poll for Discord connection updates...");
    const intervalId = setInterval(async () => {
      await refreshUserData();

      // If Discord is now connected, stop polling
      if (
        user &&
        (user.discordUsername || (user.discord && user.discord.username))
      ) {
        console.log("Discord connected, stopping poll");
        setIsPollingForDiscord(false);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [isPollingForDiscord, user, refreshUserData]);

  const handleLinkDiscord = () => {
    const discordWindow = window.open(
      "https://testnet-api.helioschain.network/wallet-connect",
      "_blank"
    );
    // Start polling for updates
    setIsPollingForDiscord(true);

    // Also set up a listener for when the window closes
    const checkWindowClosed = setInterval(() => {
      if (discordWindow?.closed) {
        console.log("Discord window closed, refreshing user data");
        clearInterval(checkWindowClosed);
        // Refresh user data immediately when window closes
        refreshUserData();
      }
    }, 1000);
  };

  // Debug
  React.useEffect(() => {
    if (user) {
      console.log("User data:", user);
      console.log("Discord check paths:", {
        discordUsername: user.discordUsername,
        nestedDiscord: user.discord?.username,
      });
    }
  }, [user]);

  // Check if user has discord connected - look for discord.username nested property
  const hasDiscordLinked =
    user && (user.discordUsername || (user.discord && user.discord.username));

  // Close referral menu on outside click
  useEffect(() => {
    if (!showReferralMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (referralRef.current && !referralRef.current.contains(e.target as Node)) {
        setShowReferralMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReferralMenu]);

  // Close referral menu on logout/unauthenticated
  useEffect(() => {
    if (!address || !isAuthenticated) {
      setShowReferralMenu(false);
    }
  }, [address, isAuthenticated]);

  // Native balance on the currently connected chain (wagmi selects active chain)
  const { data: nativeBalance } = useBalance({ address });

  const formatHlsAmount = (formatted?: string) => {
    if (!formatted) return null;
    const [int, dec = ""] = formatted.split(".");
    return dec ? `${int}.${dec.slice(0, 4)}` : int;
  };

  return (
    <header className="bg-white/90 py-5 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-row items-center justify-between">
          {/* Logo */}
          <div className="flex items-center w-40 sm:w-56 lg:w-64 flex-shrink-0">
            <button
              onClick={() => handleNavClick("dashboard", "/")}
              className="flex items-center hover:opacity-90 transition-opacity"
              aria-label="Go to home page"
            >
              <Image
                src="/images/helios_beta_mainnet.svg"
                alt="Helios Beta Mainnet"
                width={320}
                height={320}
                className="w-full h-auto"
                priority
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2 mx-8 flex-1 justify-start">
            {navItems.map((item) => {
              const isActive = currentView === item.key;
              const buttonClass = `flex items-center space-x-2 px-3 py-2 rounded-md transition-colors border ${
                isActive
                  ? "bg-[#002DCB] text-white border-[#002DCB]"
                  : "hover:bg-[#E2EBFF] text-[#060F32] border-transparent"
              }`;
              const iconWrapperClass = isActive ? "text-white" : "text-[#002DCB]";
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key, item.path)}
                  className={buttonClass}
                >
                  <span className={`${iconWrapperClass} inline-flex`}>{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex items-center space-x-2 flex-shrink-0 relative" ref={referralRef}>
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md text-[#060F32] hover:bg-[#E2EBFF] justify-self-end"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Referral quick menu (desktop + mobile) */}
            {address && isAuthenticated && (
              <button
                onClick={() => setShowReferralMenu((v) => !v)}
                className="hidden md:inline-flex items-center px-3 py-2 rounded-md border border-[#E2EBFF] text-[#060F32] hover:bg-[#E2EBFF] text-sm font-semibold"
              >
                Referral & Discord
              </button>
            )}
            {address && isAuthenticated && showReferralMenu && (
              <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-xl border border-[#E2EBFF] shadow-lg p-3 z-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-[#060F32]">Referral</div>
                  <button
                    onClick={() => setShowReferralMenu(false)}
                    className="text-[#828DB3] hover:text-[#060F32]"
                    aria-label="Close referral menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Invite code */}
                  <div className="rounded-lg border border-[#E2EBFF] p-2 bg-[#F9FAFF]">
                    <InviteCodeDisplay compact />
                  </div>
                  {/* Link Discord (if not linked) */}
                  {!isUserLoading && !hasDiscordLinked && (
                    <button
                      onClick={() => { setShowReferralMenu(false); handleLinkDiscord(); }}
                      className="w-full bg-[#5865F2] text-white rounded-md px-3 py-2 flex items-center justify-center hover:bg-[#4752c4] transition-colors text-sm font-medium"
                    >
                      <DiscordIcon />
                      <span className="ml-2">Link Discord</span>
                    </button>
                  )}
                  {/* Referrals page link */}
                  <button
                    onClick={() => { setShowReferralMenu(false); router.push('/referrals'); }}
                    className="w-full px-3 py-2 rounded-md border border-[#E2EBFF] text-[#002DCB] hover:bg-[#E2EBFF] text-sm font-semibold"
                  >
                    Open Referrals
                  </button>
                </div>
              </div>
            )}
            {nativeBalance && (
              <div className="hidden md:flex items-center px-2.5 py-1.5 rounded-full bg-[#F5F7FF] border border-[#E2EBFF] text-[#060F32] text-sm font-semibold">
                {formatHlsAmount(nativeBalance.formatted)} <span className="ml-1 text-[#002DCB]">HLS</span>
              </div>
            )}
            <div className="hidden md:block">
              <NetworkSwitcher />
            </div>
            <div className="xl:ml-2">
              <Wallet />
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel with CSS transition */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "max-h-96 opacity-100 mt-3"
              : "max-h-0 opacity-0 mt-0"
          }`}
          style={{
            visibility: mobileMenuOpen ? "visible" : "hidden",
            borderTop: mobileMenuOpen ? "1px solid #D7E0FF" : "none",
            paddingTop: mobileMenuOpen ? "0.75rem" : "0",
            paddingBottom: mobileMenuOpen ? "0.75rem" : "0",
          }}
        >
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key, item.path)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === item.key
                    ? "bg-[#002DCB] text-white"
                    : "hover:bg-[#E2EBFF] text-[#060F32]"
                }`}
              >
                {item.icon}
                <span className="text-base font-medium">{item.label}</span>
              </button>
            ))}

            {/* Additional mobile controls moved out of header to reduce crowding */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
