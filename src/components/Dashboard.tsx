import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Copy } from "lucide-react";
import {
  Sun,
  Award,
  ArrowRight,
  Share2,
  Code,
  X,
  Clock,
  Zap,
  Star,
  Shield,
  Leaf,
  DollarSign,
  Lightbulb,
  Wallet,
  MessageSquare,
  UserPlus,
  Building,
  Megaphone,
  Flag
} from "lucide-react";
import { useStore } from "../store/onboardingStore";
import { useAccount } from "wagmi";
import { api } from "../services/api";
import { ViewContext } from "./LayoutClientWrapper";
import Footer from "./Footer";
import { User } from "../services/api";

interface ExtendedUser extends User {
  tags?: string[];
}

interface XPHistoryItem {
  _id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
}

interface DailyMissionItem {
  mission: string;
  completed: boolean;
  description: string;
}

interface LeaderboardItem {
  rank: number;
  _id: string;
  wallet: string;
  xp: number;
  level: number;
  discordUsername: string;
}

interface XPLevelInfo {
  currentLevel: number;
  totalXP: number;
  nextLevelXP: number;
  xpForCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressToNextLevel: number;
  isMaxLevel: boolean;
}

interface Tag {
  name: string;
  xpMultiplier: number;
  description: string;
  autoAssigned: boolean;
  verificationRequired: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Custom tooltip component
interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
}

const Tooltip = ({ text, children, className = "", position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-normal max-w-xs transform ${
          position === 'top' 
            ? 'bottom-full left-0 -translate-y-2 mb-1' 
            : 'top-full left-0 translate-y-2 mt-1'
        }`}>
          {text}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top'
              ? 'top-full left-4 -mt-1'
              : 'bottom-full left-4 -mb-1'
          }`}></div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { address } = useAccount();
  const { setCurrentView } = React.useContext(ViewContext);
  const [xpHistory, setXPHistory] = useState<XPHistoryItem[]>([]);
  const [dailyMission, setDailyMission] = useState<DailyMissionItem[]>([]);
  const [Leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [xpLevelInfo, setXPLevelInfo] = useState<XPLevelInfo | null>(null);
  const [currentUserItem, setCurrentUserItem] = useState<LeaderboardItem>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // From API response
  const [isLoading, setIsLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<string[]>(["none"]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          levelResponse,
          dailyMissionResponse,
          LeaderboardResponse,
          UserRankResponse,
          tagsResponse,
        ] = await Promise.all([
          api.getUserXPLevel(),
          api.getUserDailyMission(),
          api.getLeaderboard(),
          api.getUserRank(),
          api.getAllTags(),
        ]);

        if (dailyMissionResponse.success) {
          setDailyMission(dailyMissionResponse.data.missions);
        }

        if (LeaderboardResponse.success) {
          const leaderboard = LeaderboardResponse.leaderboard;
          const top7 = leaderboard.slice(0, 10);
          const displayList = top7.map((item, index) => ({
            ...item,
            rank: index + 1,
          }));

          const currentUser = displayList.find(
            (user) =>
              user.wallet.toLowerCase() === address?.toString().toLowerCase()
          );

          if (!currentUser && address && UserRankResponse.success) {
            setCurrentUserItem({
              _id: "",
              wallet: address.toString(),
              xp: UserRankResponse.userXP,
              level: 0,
              discordUsername: UserRankResponse.discordUsername,
              rank: UserRankResponse.globalRank,
            });
          }

          setLeaderboard(displayList);
        }

        if (levelResponse.success) {
          setXPLevelInfo({
            currentLevel: levelResponse.currentLevel,
            totalXP: levelResponse.totalXP,
            nextLevelXP: levelResponse.nextLevelXP,
            xpForCurrentLevel: levelResponse.xpForCurrentLevel,
            xpNeededForNextLevel: levelResponse.xpNeededForNextLevel,
            progressToNextLevel: levelResponse.progressToNextLevel,
            isMaxLevel: levelResponse.isMaxLevel,
          });
        }

        if (tagsResponse?.success) {
          setAvailableTags(tagsResponse.tags);
        }

        if (address) {
          try {
            const userProfileResponse = await api.getUserProfile(address);
            if (userProfileResponse && userProfileResponse.tags) {
              setUserTags(userProfileResponse.tags);
            }
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, []); // <- run only once on mount

  useEffect(() => {
    const fetchXPHistory = async () => {
      try {
        const XPHistoryPageResponse = await api.getXPHistoryPage(
          currentPage,
          5,
          "alltime"
        );
        if (XPHistoryPageResponse?.success) {
          setXPHistory(XPHistoryPageResponse.xpHistory);
          setTotalPages(XPHistoryPageResponse.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed to fetch XP history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchXPHistory();
  }, [currentPage]); // <- runs every time currentPage changes

  const shortenedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const abbreviateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const Pagination = ({
    currentPage,
    totalPages,
    setCurrentPage,
  }: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  }) => {
    const generatePages = () => {
      const pages = [];
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(startPage + 4, totalPages);

      if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    };

    return (
      <div className="flex justify-center items-center my-2">
        {/* Previous Button */}
        <button
          onClick={() =>
            setCurrentPage((prev: number) => Math.max(prev - 1, 1))
          }
          disabled={currentPage === 1}
          className="mx-1 px-3 py-2 text-sm text-gray-800 hover:text-gray-950 disabled:cursor-not-allowed rounded-2xl hover:bg-gray-300 cursor-pointer"
        >
          &lt; Prev
        </button>

        {/* Page Numbers */}
        {generatePages().map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(Number(page))}
            className={`mx-1 w-8 h-8 text-sm rounded-2xl hover:bg-gray-300 cursor-pointer ${
              currentPage === page
                ? "text-white bg-blue-700"
                : "text-gray-800 bg-transparent"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() =>
            setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="mx-1 px-3 py-2 text-sm text-gray-800 hover:text-gray-950 disabled:cursor-not-allowed rounded-2xl hover:bg-gray-300 cursor-pointer"
        >
          Next &gt;
        </button>
      </div>
    );
  };

  // Helper function to get icon for a tag
  const getTagIcon = (tagName: string) => {
    switch (tagName) {
      case "none":
        return <Shield className="w-6 h-6" />;
      case "deployer":
        return <Code className="w-6 h-6" />;
      case "farmer":
        return <Leaf className="w-6 h-6" />;
      case "guardian":
        return <Shield className="w-6 h-6" />;
      case "researcher":
        return <Lightbulb className="w-6 h-6" />;
      case "liquidity_provider":
        return <Wallet className="w-6 h-6" />;
      case "proposal_master":
        return <MessageSquare className="w-6 h-6" />;
      case "contributor":
        return <UserPlus className="w-6 h-6" />;
      case "investor":
        return <DollarSign className="w-6 h-6" />;
      case "builder":
        return <Building className="w-6 h-6" />;
      case "marketer":
        return <Megaphone className="w-6 h-6" />;
      case "ambassador":
        return <Flag className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  // Format tag name for display
  const formatTagName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 h-full">
            <div className="lg:col-span-3 flex flex-col space-y-6">
              <div className="shrink-0">
                <section className="bg-white rounded-2xl shadow-md p-8 web3-card">
                  <div className="flex">
                    <div className="hover-float">
                      <img
                        src="/images/Avatar.svg"
                        alt="Profile"
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="grid grid-cols-2 w-full">
                      <div className="flex flex-col items-start gap-1 ml-4">
                        <span className="text-2xl text-[#060F32] custom-font font-bold">
                          Welcome Back
                        </span>
                        <span className="text-sm text-[#828DB3] flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {shortenedAddress}
                        </span>
                      </div>
                      <div className="grid place-items-end">
                        <div className="text-xl text-[#002DCB] custom-font font-bold flex items-center">
                          <span className="bg-[#E2EBFF] p-1.5 rounded-full mr-2 flex items-center justify-center">
                            <Star className="w-4 h-4 text-[#002DCB]" />
                          </span>
                          Total XP: {xpLevelInfo?.totalXP || 0}
                        </div>
                      
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar mt-4">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${xpLevelInfo?.progressToNextLevel || 0}%`,
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>

                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-[#002DCB] font-medium flex items-center gap-1">
                      Level {xpLevelInfo?.currentLevel || 0}
                    </span>
                    {!xpLevelInfo?.isMaxLevel && (
                      <span className="text-[#5C6584]">
                        <span className="text-[#002DCB] font-medium">
                          {xpLevelInfo?.xpNeededForNextLevel || 0} XP
                        </span>{" "}
                        to next level
                      </span>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex-grow">
                <section className="web3-card p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-[#E2EBFF] p-3 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                        <Award className="w-6 h-6 text-[#002DCB]" />
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl text-[#060F32] custom-font font-bold">
                            Achievements
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#828DB3]">
                            See how you've earned XP on Helios Testnet
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex-1 overflow-hidden">
                    {xpHistory?.map((item, index) => {
                      // Determine tooltip position based on index and total items
                      const isFirstItem = index === 0;
                      const isLastItem = index === xpHistory.length - 1;
                      const tooltipPosition = isFirstItem || (xpHistory.length <= 3 && !isLastItem) ? 'bottom' : 'top';
                      
                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="flex items-center justify-between bg-[#F9FAFF] rounded-xl p-3 mt-2 transition-all duration-200 hover:shadow-sm hover:bg-[#F2F4FE]"
                        >
                          <div className="bg-[#E2EBFF] p-2 rounded-full flex-shrink-0">
                            <img
                              src={`/images/Icon3.svg`}
                              alt="icon"
                              className="w-5 h-5"
                            />
                          </div>
                          <div className="flex-1 ml-3 min-w-0">
                            <div className="flex flex-wrap justify-between items-center">
                              <Tooltip 
                                text={item.description} 
                                className="max-w-[60%]"
                                position={tooltipPosition}
                              >
                                <span className="text-base text-[#060F32] custom-font font-bold truncate block w-full">
                                  {item.description}
                                </span>
                              </Tooltip>
                              <div className="flex-shrink-0">
                                <span className="ml-2 px-3 py-1 text-[#002DCB] text-base font-medium whitespace-nowrap">
                                  + {item.amount} XP
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-[#828DB3]">
                              <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <hr className="border-1 border-[#D7E0FF] my-3" />
                  <div className="mt-1">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      setCurrentPage={setCurrentPage}
                    />
                  </div>
                </section>
              </div>
            </div>

            {/* Right Column (1/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl shadow-md p-8 web3-card h-full">
                <div className="flex items-center justify-between">
                  <img src="/images/Icon4.svg" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        Leaderboard
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        Top contributors in the Helios ecosystem
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  {Leaderboard.map((user) => {
                    const isCurrentUser =
                      user.wallet.toLowerCase() === address?.toLowerCase();
                    const isTopThree = user.rank <= 3;
                    const rankIcon = isTopThree
                      ? `/images/Rank${user.rank}.png`
                      : undefined;

                    return (
                      <div
                        key={user.wallet}
                        className={`flex items-center justify-between rounded-4xl shadow-xs mt-1.5 px-2 transition-all duration-150 hover:shadow-sm hover:bg-[#F2F4FE] ${
                          isCurrentUser
                            ? "bg-[#D7E0FF] border border-[#002DCB]"
                            : "bg-[#F9FAFF]"
                        }`}
                      >
                        {isTopThree ? (
                          <img src={rankIcon} alt={`Rank ${user.rank}`} />
                        ) : (
                          <span
                            className={`mx-1 custom-font font-medium w-3 text-sm${
                              isCurrentUser
                                ? "text-[#002DCB]"
                                : "text-[#060F32]"
                            }`}
                          >
                            {user.rank}
                          </span>
                        )}

                        <div className="flex-1 ml-3">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span
                                  className={`text-base custom-font font-bold ${
                                    isCurrentUser
                                      ? "text-[#002DCB]"
                                      : "text-[#060F32]"
                                  }`}
                                >
                                  {user.discordUsername || "Anonymous"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-[#828DB3]">
                                  {abbreviateAddress(user.wallet)}
                                </span>
                              </div>
                            </div>
                            <div className="place-content-center">
                              <span
                                className={`ml-2 px-3 py-1 text-sm custom-font font-bold ${
                                  isCurrentUser
                                    ? "text-[#002DCB]"
                                    : "text-[#060F32]"
                                }`}
                              >
                                {user.xp} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Spacer between top7 and current user */}
                  <div className="h-2" />
                  {Leaderboard.some(
                    (user) =>
                      user.wallet.toLowerCase() !== address?.toLowerCase()
                  ) &&
                    currentUserItem && (
                      <hr className="my-4 border-1 border-[#D7E0FF]" />
                    )}

                  {/* Current user (if not in top7) */}
                  {currentUserItem &&
                    !Leaderboard.some(
                      (u) => u.wallet === currentUserItem.wallet
                    ) && (
                      <div
                        key={currentUserItem.wallet}
                        className="flex items-center justify-between bg-[#F2F4FE] border transition-all duration-150 border-[#002DCB] rounded-[28px] mt-2 px-3 py-1 hover:shadow-sm hover:bg-[#D7E0FF]"
                      >
                        <span className="mx-1 custom-font font-bold text-sm text-[#002DCB]">
                          {currentUserItem.rank}
                        </span>

                        <div className="flex-1 ml-3">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-base custom-font font-bold text-[#002DCB]">
                                  {currentUserItem.discordUsername ||
                                    "Anonymous"}
                                </span>
                                <span className="text-sm text-[#002DCB] font-medium">
                                  (You)
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-[#828DB3]">
                                  {abbreviateAddress(currentUserItem.wallet)}
                                </span>
                              </div>
                            </div>
                            <div className="place-content-center">
                              <span className="ml-2 px-3 py-1 text-sm custom-font font-bold text-[#002DCB]">
                                {currentUserItem.xp} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </section>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3 space-y-6">
              <section className="bg-white rounded-2xl shadow-md p-8">
                <div className="flex items-center justify-between">
                  <img src="/images/Icon5.svg" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        Daily Missions
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        Complete these tasks to earn more XP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row space-x-3 mt-4 overflow-x-auto max-w-full">
                  {dailyMission?.map((missionObj, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl ${missionObj.completed ? 'bg-[#E8EFFF] border-2 border-[#002DCB]' : 'bg-[#F9FAFF]'} max-w-57 p-8 flex-shrink-0 relative`}
                    >
                      {missionObj.completed && (
                        <div className="absolute top-4 right-4 bg-[#002DCB] text-white rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                      <img src="/images/Icon6.svg" alt="logo" />
                      <div className="mt-2">
                        <div className={`text-base ${missionObj.completed ? 'text-[#002DCB]' : 'text-[#060F32]'} custom-font font-bold capitalize`}>
                          {missionObj.mission.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-[#828DB3] custom-font">
                          {missionObj.description}
                        </div>
                        <div className={`mt-4 text-sm ${missionObj.completed ? 'text-[#002DCB] font-medium' : 'text-[#828DB3]'}`}>
                          {missionObj.completed ? 'Completed' : 'Not completed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column (1/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl shadow-md p-8 h-full">
                <div className="flex items-center justify-between">
                  <div className="bg-[#E2EBFF] p-3 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                    <Star className="w-6 h-6 text-[#002DCB]" />
                  </div>
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        XP Multiplier Tags
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        Earn multiplied XP with active tags
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row mt-4 space-x-3 overflow-x-auto pb-2">
                  {availableTags
                    .filter(tag => {
                      // Hide the "none" tag if user has other tags
                      if (tag.name === "none" && userTags.length > 1) {
                        return false;
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      // Sort by active status first (active tags come first)
                      const aActive = userTags.includes(a.name);
                      const bActive = userTags.includes(b.name);
                      
                      if (aActive && !bActive) return -1;
                      if (!aActive && bActive) return 1;
                      
                      // Then sort by multiplier (higher multipliers first)
                      return b.xpMultiplier - a.xpMultiplier;
                    })
                    .map((tag) => {
                      const isActive = userTags.includes(tag.name);
                      return (
                        <div 
                          key={tag.name}
                          className={`rounded-2xl min-w-[200px] p-6 flex-shrink-0 flex flex-col gap-2 ${
                            isActive 
                              ? "bg-[#F2F4FE] border-2 border-[#002DCB]" 
                              : "bg-[#F9FAFF]"
                          }`}
                        >
                          <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                            isActive ? "bg-[#002DCB] text-white" : "bg-[#E2EBFF] text-[#828DB3]"
                          }`}>
                            {getTagIcon(tag.name)}
                          </div>
                          <div className="mt-2">
                            <div className={`text-base custom-font font-bold ${
                              isActive ? "text-[#002DCB]" : "text-[#060F32]"
                            }`}>
                              {formatTagName(tag.name)}
                            </div>
                            <div className="text-sm text-[#828DB3]">
                              {tag.description}
                            </div>
                            <div className={`text-sm mt-1 font-medium ${
                              isActive ? "text-[#002DCB]" : "text-[#828DB3]"
                            }`}>
                              {tag.xpMultiplier}x XP Multiplier
                            </div>
                            {tag.verificationRequired && (
                              <div className="text-xs mt-1 italic text-[#828DB3]">
                                Requires verification
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex flex-row mt-4 bg-[#E2EBFF]/20 rounded-xl place-items-center p-3">
                  <div className="font-medium text-[#040F34] mx-4 flex-1">
                    Contribute to earn special tags
                  </div>
                  <div className="flex gap-3">
                    <a 
                      href="https://github.com/helios-network" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#002DCB] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#0045FF] transition-colors duration-200"
                    >
                      <Code className="w-4 h-4 text-white" />
                      <span className="text-white">GitHub</span>
                    </a>
                    <a 
                      href="https://x.com/helios_layer1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#002DCB] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#0045FF] transition-colors duration-200"
                    >
                      <X className="w-4 h-4 text-white" />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white rounded-2xl shadow-md p-8">
                <div className="flex items-center justify-between">
                  <img src="/images/Icon5.svg" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        Badges & NFTs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        Collect badges and NFTs by completing tasks and earning
                        XP
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row space-x-3 mt-4 overflow-x-auto max-w-full">
                  <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                    <img src="/images/Icon6.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold">
                        Explorer
                      </div>
                      <div className="text-sm text-[#828DB3] custom-font">
                        Reached 30 XP on Helios Testnet
                      </div>
                      <button
                        className="px-4 py-4 bg-[#002DCB] text-white custom-font font-bold rounded-full text-sm mt-4
                       hover:opacity-90 transform hover:scale-105 transition-all duration-200 
                       shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                      >
                        <div className="flex items-center">
                          Claim
                          <img
                            src="/images/arrow.svg"
                            className="ml-2 w-4 h-4"
                            alt="Arrow"
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                    <img src="/images/Icon6.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold">
                        Builder
                      </div>
                      <div className="text-sm text-[#828DB3] custom-font">
                        Reached 250 XP on Helios Testnet
                      </div>
                      <button
                        disabled
                        className="px-4 py-4 bg-[#F9FAFF] text-[#546481] border-[#D7E0FF] border-1 custom-font font-bold rounded-full text-sm mt-4
                         shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                      >
                        <div className="flex items-center">250 XP required</div>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                    <img src="/images/Icon6.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold">
                        Builder
                      </div>
                      <div className="text-sm text-[#828DB3] custom-font">
                        Reached 250 XP on Helios Testnet
                      </div>
                      <button
                        disabled
                        className="px-4 py-4 bg-[#F9FAFF] text-[#546481] border-[#D7E0FF] border-1 custom-font font-bold rounded-full text-sm mt-4
                         shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                      >
                        <div className="flex items-center">250 XP required</div>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                    <img src="/images/Icon6.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold">
                        Builder
                      </div>
                      <div className="text-sm text-[#828DB3] custom-font">
                        Reached 250 XP on Helios Testnet
                      </div>
                      <button
                        disabled
                        className="px-4 py-4 bg-[#F9FAFF] text-[#546481] border-[#D7E0FF] border-1 custom-font font-bold rounded-full text-sm mt-4
                         shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                      >
                        <div className="flex items-center">250 XP required</div>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                    <img src="/images/Icon6.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold">
                        Builder
                      </div>
                      <div className="text-sm text-[#828DB3] custom-font">
                        Reached 250 XP on Helios Testnet
                      </div>
                      <button
                        disabled
                        className="px-4 py-4 bg-[#F9FAFF] text-[#546481] border-[#D7E0FF] border-1 custom-font font-bold rounded-full text-sm mt-4
                         shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                      >
                        <div className="flex items-center">250 XP required</div>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                    <img src="/images/Icon6.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold">
                        Builder
                      </div>
                      <div className="text-sm text-[#828DB3] custom-font">
                        Reached 250 XP on Helios Testnet
                      </div>
                      <button
                        disabled
                        className="px-4 py-4 bg-[#F9FAFF] text-[#546481] border-[#D7E0FF] border-1 custom-font font-bold rounded-full text-sm mt-4
                         shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                      >
                        <div className="flex items-center">250 XP required</div>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Use the new Footer component */}
      <Footer />
    </div>
  );
};

export default Dashboard;
