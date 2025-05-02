import { Link } from "@/components/link";
import { Logotype } from "@/components/logotype";
import { Chains } from "../chains";
import { Wallet } from "../wallet";
import { Users, Copy } from "lucide-react";
import s from "./header.module.scss";
import React from "react";
import { Home, Trophy } from "lucide-react";
import { ViewContext } from "@/components/LayoutClientWrapper";
import InviteCodeDisplay from "@/components/InviteCodeDisplay";

// export const Header = () => {
//   return <header className={s.header}></header>;
// };

interface HeaderProps {
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { setCurrentView } = React.useContext(ViewContext);

  return (
    <header className="border-b border-[#D7E0FF] bg-white/90 py-3 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Single row for desktop, flex-wrap for mobile */}
        <div className="flex items-center flex-wrap justify-between">
          {/* Logo + Navigation group */}
          <div className="flex items-center">
            <img
              src="/images/Helios-Testnet-Logo.svg"
              alt="Helios Testnet"
              className="h-8 sm:h-10 mr-2"
            />
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                  currentView === "dashboard"
                    ? "bg-[#002DCB] text-white"
                    : "hover:bg-[#E2EBFF] text-[#060F32]"
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">Home</span>
              </button>
              <button
                onClick={() => setCurrentView("referrals")}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                  currentView === "referrals"
                    ? "bg-[#002DCB] text-white"
                    : "hover:bg-[#E2EBFF] text-[#060F32]"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  Referrals
                </span>
              </button>
            </nav>
          </div>

          {/* InviteCodeDisplay - aligned to the right, no margin top on desktop */}
          <div className="mt-0 flex items-center min-h-[40px]">
            <InviteCodeDisplay />
          </div>
          {/* <div className={s.right}>
            <Chains />
            <Wallet />
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
