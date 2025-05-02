import React, { useState } from "react";
import { Home, Trophy, Droplet, Menu, X } from "lucide-react";
import { ViewContext } from "./LayoutClientWrapper";
import InviteCodeDisplay from "./InviteCodeDisplay";
import { useRouter } from "next/navigation";
import { useStore } from "../store/onboardingStore";

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
    <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36zM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18z"/>
  </svg>
);

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { setCurrentView } = React.useContext(ViewContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const user = useStore((state) => state.user);

  const navItems = [
    { key: "dashboard", label: "Home", icon: <Home className="w-4 h-4" />, path: "/" },
    { key: "referrals", label: "Referrals", icon: <Trophy className="w-4 h-4" />, path: "/referrals" },
    { key: "faucet", label: "Faucet", icon: <Droplet className="w-4 h-4" />, path: "/faucet" }
  ];

  const handleNavClick = (view: string, path: string) => {
    setCurrentView(view);
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleLinkDiscord = () => {
    window.open("https://testnet-api.helioschain.network/wallet-connect", "_blank");
  };

  // Debug
  React.useEffect(() => {
    if (user) {
      console.log("User data:", user);
      console.log("Discord check paths:", {
        discordUsername: user.discordUsername,
        nestedDiscord: user.discord?.username
      });
    }
  }, [user]);

  // Check if user has discord connected - look for discord.username nested property
  const hasDiscordLinked = user && (user.discordUsername || (user.discord && user.discord.username));

  return (
    <header className="border-b border-[#D7E0FF] bg-white/90 py-3 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/Helios-Testnet.png"
              alt="Helios Testnet"
              className="h-8 sm:h-10 mr-2"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 mx-4 flex-1 justify-start">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key, item.path)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                  currentView === item.key
                    ? "bg-[#002DCB] text-white"
                    : "hover:bg-[#E2EBFF] text-[#060F32]"
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-md text-[#060F32] hover:bg-[#E2EBFF]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Discord Link and InviteCodeDisplay */}
          <div className="hidden md:flex items-center space-x-3 min-h-[40px]">
            {!hasDiscordLinked && (
              <button
                onClick={handleLinkDiscord}
                className="bg-[#5865F2] text-white rounded-full px-3 py-1.5 flex items-center hover:bg-[#4752c4] transition-colors shadow-sm text-sm font-medium"
              >
                <DiscordIcon />
                <span className="ml-1.5">Link Discord</span>
              </button>
            )}
            <InviteCodeDisplay />
          </div>
        </div>

        {/* Mobile Menu Panel with CSS transition */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen 
              ? "max-h-96 opacity-100 mt-3" 
              : "max-h-0 opacity-0 mt-0"
          }`}
          style={{
            visibility: mobileMenuOpen ? 'visible' : 'hidden',
            borderTop: mobileMenuOpen ? '1px solid #D7E0FF' : 'none',
            paddingTop: mobileMenuOpen ? '0.75rem' : '0',
            paddingBottom: mobileMenuOpen ? '0.75rem' : '0',
          }}
        >
          <div className="flex flex-col space-y-2">
            {navItems.map(item => (
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
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Discord Link option in mobile menu */}
            {!hasDiscordLinked && (
              <button
                onClick={handleLinkDiscord}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors bg-[#5865F2] text-white"
              >
                <DiscordIcon />
                <span className="text-sm font-medium">Link Discord</span>
              </button>
            )}
            
            {/* Mobile InviteCodeDisplay */}
            <div className="pt-2 border-t border-[#D7E0FF]">
              <InviteCodeDisplay />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
