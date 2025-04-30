import React, { useState } from "react";
import { Home, Trophy, Droplet, Menu, X } from "lucide-react";
import { ViewContext } from "./LayoutClientWrapper";
import InviteCodeDisplay from "./InviteCodeDisplay";
import { useRouter } from "next/navigation";

interface HeaderProps {
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { setCurrentView } = React.useContext(ViewContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

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

          {/* InviteCodeDisplay */}
          <div className="hidden md:flex items-center min-h-[40px]">
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
