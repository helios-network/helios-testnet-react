import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Award,
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
  Flag,
  Trophy,
} from "lucide-react";
import { useStore } from "../store/onboardingStore";
import { useAccount } from "wagmi";
import { api } from "../services/api";
import Footer from "./Footer";
import InviteQuotaInfo from "./InviteQuotaInfo";
import SeasonSelector from "./SeasonSelector";
import { useSeason } from "../contexts/SeasonContext";
import { toast } from "react-toastify";

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
  position?: "top" | "bottom";
}

const Tooltip = ({
  text,
  children,
  className = "",
  position = "top",
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-normal max-w-xs transform ${
            position === "top"
              ? "bottom-full left-0 -translate-y-2 mb-1"
              : "top-full left-0 translate-y-2 mt-1"
          }`}
        >
          {text}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === "top"
                ? "top-full left-4 -mt-1"
                : "bottom-full left-4 -mb-1"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
};

const GamifiedDashboard = () => {
  const { address } = useAccount();
  const { currentSeason, seasons, isLoadingSeasons } = useSeason();

  const logout = useStore((state) => state.logout);
  const [xpHistory, setXPHistory] = useState<XPHistoryItem[]>([]);
  const [dailyMission, setDailyMission] = useState<DailyMissionItem[]>([]);
  const [Leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [xpLevelInfo, setXPLevelInfo] = useState<XPLevelInfo | null>(null);
  const [currentUserItem, setCurrentUserItem] = useState<LeaderboardItem>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<string[]>(["none"]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isLoadingXP, setIsLoadingXP] = useState(true);
  const [isLoadingDailyMissions, setIsLoadingDailyMissions] = useState(true);
  const [isLoadingXPHistory, setIsLoadingXPHistory] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  const calculateItemsPerPage = () => {
    const screenHeight = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (isMobile) {
      return Math.floor((screenHeight * 0.3) / 80); // ~80px per item on mobile
    } else if (isTablet) {
      return Math.floor((screenHeight * 0.4) / 70); // ~70px per item on tablet
    } else {
      return Math.floor((screenHeight * 0.5) / 60); // ~60px per item on desktop
    }
  };

  useEffect(() => {
    const newItemsPerPage = calculateItemsPerPage();
    setItemsPerPage(Math.max(2, Math.min(6, newItemsPerPage))); // Between 2 and 6 items

    const handleResize = () => {
      const newItemsPerPage = calculateItemsPerPage();
      setItemsPerPage(Math.max(2, Math.min(6, newItemsPerPage)));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('GamifiedDashboard: Fetching data for season:', currentSeason.identifier);
        setIsLoadingLeaderboard(true);
        setIsLoadingXP(true);
        setIsLoadingDailyMissions(true);
        setIsLoadingTags(true);
        const [
          levelResponse,
          dailyMissionResponse,
          LeaderboardResponse,
          UserRankResponse,
          tagsResponse,
        ] = await Promise.all([
          api.getUserXPLevel(currentSeason.identifier),
          api.getUserDailyMission(currentSeason.identifier),
          api.getLeaderboard(currentSeason.identifier),
          api.getUserRank(currentSeason.identifier),
          api.getAllTags(),
        ]);

        if (dailyMissionResponse.success) {
          setDailyMission(dailyMissionResponse.data.missions);
        }
        setIsLoadingDailyMissions(false);

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

        setIsLoadingLeaderboard(false);

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
          // If no participation in past seasons, explicitly zero the stats
          if (levelResponse.participated === false) {
            setXPLevelInfo({
              currentLevel: 0,
              totalXP: 0,
              nextLevelXP: 0,
              xpForCurrentLevel: 0,
              xpNeededForNextLevel: 0,
              progressToNextLevel: 0,
              isMaxLevel: false,
            });
          }
        } else {
          // No season data for this wallet: show not participated
          setXPLevelInfo({
            currentLevel: 0,
            totalXP: 0,
            nextLevelXP: 0,
            xpForCurrentLevel: 0,
            xpNeededForNextLevel: 0,
            progressToNextLevel: 0,
            isMaxLevel: false,
          });
        }
        setIsLoadingXP(false);

        if (tagsResponse?.success) {
          setAvailableTags(tagsResponse.tags);
        }
        setIsLoadingTags(false);

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
      } catch (error: any) {
        console.error("Failed to fetch initial data:", error);
        setIsLoadingLeaderboard(false);
        setIsLoadingXP(false);
        setIsLoadingDailyMissions(false);
        setIsLoadingTags(false);
        if (error.accountSuspended) {
          toast.error(error.message);
          logout();
        }
      }
    };

    if (!isLoadingSeasons && currentSeason) {
      fetchInitialData();
    }
  }, [currentSeason.identifier, isLoadingSeasons, address, currentSeason, logout]);

  useEffect(() => {
    const fetchXPHistory = async () => {
      try {
        setIsLoadingXPHistory(true);
        const XPHistoryPageResponse = await api.getXPHistoryPage(
          currentPage,
          itemsPerPage,
          "alltime",
          currentSeason.identifier
        );
        if (XPHistoryPageResponse?.success) {
          setXPHistory(XPHistoryPageResponse.xpHistory);
          setTotalPages(XPHistoryPageResponse.pagination?.totalPages || 1);
        }
        setIsLoadingXPHistory(false);
      } catch (error) {
        console.error("Failed to fetch XP history:", error);
        setIsLoadingXPHistory(false);
      }
    };

    if (!isLoadingSeasons && currentSeason) {
      fetchXPHistory();
    }
  }, [currentPage, currentSeason.identifier, isLoadingSeasons, currentSeason, itemsPerPage]);

  const shortenedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

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
      const endPage = Math.min(startPage + 4, totalPages);

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
      case "deposit_champion":
        return <Trophy className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  // Format tag name for display
  const formatTagName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <SeasonSelector />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 h-full">
            <div className="lg:col-span-3 flex flex-col space-y-6">
              <div className="shrink-0">
                <section className="bg-white rounded-2xl shadow-md p-8 web3-card">
                  {isLoadingXP ? (
                    // Loading skeleton for XP section
                    <div className="animate-pulse">
                      <div className="flex">
                        <div className="hover-float">
                          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 w-full">
                          <div className="flex flex-col items-start gap-1 ml-4">
                            <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                              <div className="h-4 bg-gray-300 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="grid place-items-end">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
                              <div className="h-6 bg-gray-300 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex">
                        <div className="hover-float">
                          <Image
                            src="/images/Avatar.svg"
                            alt="Profile"
                            width={64}
                            height={64}
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
                        {xpLevelInfo?.currentLevel === 0 && (
                          <span className="text-[#5C6584]">
                            You didn’t participate in this season
                          </span>
                        )}
                        {!xpLevelInfo?.isMaxLevel && (
                          <span className="text-[#5C6584]">
                            <span className="text-[#002DCB] font-medium">
                              {xpLevelInfo?.xpNeededForNextLevel || 0} XP
                            </span>{" "}
                            to next level
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>

              <div className="shrink-0">
                <motion.section
                  className="rounded-2xl shadow-md p-8 web3-card text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${currentSeason.theme.primary}, ${currentSeason.theme.secondary})`
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>

                  <div className="relative z-10">
                    {(() => {
                      const nextSeason = seasons.find(s => s.id === currentSeason.id + 1);
                      return nextSeason && nextSeason.status === "upcoming" && (
                        <div className="mb-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-white-400/20 p-2 rounded-full">
                              <Clock className="w-5 h-5 text-white-300" />
                            </div>
                            <div>
                              <h4 className="text-white-200 font-semibold text-lg">Next Season Preview</h4>
                              <p className="text-grey-100 text-sm">
                                {nextSeason.name} starts on {new Date(nextSeason.startDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4">
                          <Flag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold custom-font">
                            {currentSeason.content.title}
                          </h3>
                          <p className="text-blue-100 text-sm">
                            {currentSeason.content.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-sm font-medium">Season {currentSeason.id}</span>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-400/20 p-2 rounded-full mt-1">
                          <Shield className="w-4 h-4 text-green-200" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">
                            {currentSeason.content.title}
                          </h4>
                          <p className="text-blue-100 text-sm leading-relaxed">
                            {currentSeason.content.mainDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSeason.content.features.map((feature, index) => {
                        const IconComponent = feature.icon === "Zap" ? Zap : Trophy;
                        return (
                          <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <IconComponent className="w-5 h-5 text-yellow-300 mr-2" />
                              <span className="font-medium text-white">
                                {feature.title}
                              </span>
                            </div>
                            <p className="text-blue-100 text-sm">
                              {feature.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.section>
              </div>

              <div className="flex-grow">
                <section className="web3-card p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#E2EBFF] p-3 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                        <Award className="w-6 h-6 text-[#002DCB]" />
                      </div>
                      <div>
                        <h3 className="text-2xl text-[#060F32] custom-font font-bold">
                          Achievements
                        </h3>
                        <p className="text-sm text-[#828DB3] mt-1">
                          See how you've earned XP on Helios Beta Mainnet
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {xpHistory?.reduce((total, item) => total + item.amount, 0) || 0}
                      </div>
                      <div className="text-xs text-[#828DB3]">Total XP</div>
                    </div>
                  </div>

                  <div className="mt-4 flex-1 overflow-hidden">
                    {isLoadingXPHistory ? (
                      // Loading skeleton for XP History
                      <div className="space-y-4">
                        {[...Array(4)].map((_, index) => (
                          <div
                            key={index}
                            className="group relative p-4 transition-all duration-300 border-b border-gray-100 last:border-b-0 animate-pulse"
                          >
                            <div className="flex items-start gap-4">
                              <div className="bg-gray-300 p-3 rounded-xl flex-shrink-0 w-11 h-11"></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-3 h-3 bg-gray-300 rounded mr-1 flex-shrink-0"></div>
                                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      xpHistory?.map((item, index) => {
                      // Determine tooltip position based on index and total items
                      const isFirstItem = index === 0;
                      const isLastItem = index === xpHistory.length - 1;
                      const tooltipPosition =
                        isFirstItem || (xpHistory.length <= 3 && !isLastItem)
                          ? "bottom"
                          : "top";

                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="group relative p-4 transition-all duration-300 hover:bg-[#F8FAFF] border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start gap-4">
                            <div className="bg-[#E2EBFF] p-3 rounded-xl flex-shrink-0" >
                              <Image
                                src={`/images/Icon3.svg`}
                                alt="icon"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <Tooltip
                                  text={item.description}
                                  className="max-w-[60%]"
                                  position={tooltipPosition}
                                >
                                  <h4 className="text-base font-semibold truncate text-[#060F32]">
                                    {item.description}
                                  </h4>
                                </Tooltip>
                                <span className="px-3 py-1 text-[#002DCB] text-sm font-bold rounded-full">
                                  +{item.amount} XP
                                </span>
                              </div>
                              
                              <div className="flex items-center text-xs text-[#828DB3]">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {formatDate(item.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }))
                  }
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
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
                  <div 
                    className="p-3 rounded-full"
                    style={{ 
                      backgroundColor: '#D7E0FF',
                      background: 'linear-gradient(135deg, rgb(0, 45, 203), rgb(74, 108, 247))',
                    }}
                  >
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        Leaderboard & Invites
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        Top contributors and daily invite system
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Invite Quota Information */}
                <div className="mt-6 mb-6">
                  <InviteQuotaInfo showDetailed={true} />
                </div>

                {/* Leaderboard Title */}
                <div className="flex items-center mb-4">
                  <div 
                    className="p-2 rounded-full mr-3"
                    style={{ 
                      backgroundColor: '#D7E0FF',
                      background: 'linear-gradient(135deg, rgb(0, 45, 203), rgb(74, 108, 247))',
                    }}
                  >
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#060F32]">
                    Top Contributors
                  </h3>
                </div>

                <div className="mt-4 mb-4">
                  {isLoadingLeaderboard ? (
                    // Loading skeleton
                    <div className="space-y-3">
                      {[...Array(6)].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-[#F9FAFF] border-b border-gray-100 last:border-b-0 animate-pulse"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <div className="flex-1 ml-3">
                              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded w-20"></div>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-300 rounded w-12"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    Leaderboard.map((user) => {
                    const isCurrentUser =
                      user.wallet.toLowerCase() === address?.toLowerCase();
                    const isTopThree = user.rank <= 3;
                    const rankIcon = isTopThree
                      ? `/images/Rank${user.rank}.png`
                      : undefined;

                    return (
                      <div
                        key={user.wallet}
                        className={`flex items-center justify-between p-4 transition-all duration-300 hover:bg-[#F8FAFF] border-b border-gray-100 last:border-b-0 ${
                          isCurrentUser
                            ? "bg-[#D7E0FF] border border-[#002DCB]"
                            : "bg-[#F9FAFF]"
                        }`}
                      >
                        {isTopThree ? (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              background: user.rank === 1 
                                ? "linear-gradient(135deg, #FCD34D, #F59E0B)" // gold
                                : user.rank === 2 
                                ? "linear-gradient(135deg, #D1D5DB, #6B7280)" // silver
                                : user.rank === 3
                                ? "linear-gradient(135deg, #F59E0B, #D97706)" // bronze
                                : `linear-gradient(135deg, ${currentSeason.theme.primary}, ${currentSeason.theme.secondary})`
                            }}
                          >
                            {user.rank === 1 ? (
                              <Award className="w-5 h-5 text-white" />
                            ) : user.rank === 2 ? (
                              <Award className="w-5 h-5 text-white" />
                            ) : (
                              <Award className="w-5 h-5 text-white" />
                            )}
                          </div>
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: isCurrentUser ? "text-[#002DCB]"
                                : "text-[#060F32]"
                            }}
                          >
                            <span
                              className="text-sm font-bold"
                            >
                              {user.rank}
                            </span>
                          </div>
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
                  }))
                  }

                  {/* Spacer between top7 and current user */}
                  {!isLoadingLeaderboard && (
                    <>
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
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Additional spacing to prevent overlap */}
          <div className="mb-8"></div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3">
              <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl shadow-md bg-[#E2EBFF]" >
                      <svg className="w-6 h-6 text-[#828DB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl text-[#060F32] custom-font font-bold">
                        Daily Missions
                      </h3>
                      <p className="text-sm text-[#828DB3] mt-1">
                        Complete these tasks to earn more XP
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div 
                      className="text-2xl font-bold text-[#060F32]"
                    >
                      {dailyMission?.filter(m => m.completed).length || 0}/{dailyMission?.length || 0}
                    </div>
                    <div className="text-xs text-[#828DB3]">Completed</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-2">
                      <div className="h-2 rounded-full transition-all duration-500"></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingDailyMissions ? (
                    // Loading skeleton for Daily Missions
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, index) => (
                        <div
                          key={index}
                          className="relative rounded-xl p-5 bg-white border border-gray-200 animate-pulse"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                          </div>
                          <div className="space-y-2 text-center flex flex-col justify-center items-center">
                            <div className="w-20 h-20 bg-gray-300 rounded"></div>
                            <div className="h-4 bg-gray-300 rounded w-24"></div>
                            <div className="h-3 bg-gray-300 rounded w-32"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                    dailyMission?.map((missionObj, index) => (
                    <div
                      key={index}
                      className={`relative rounded-xl p-5 transition-all duration-300 hover:shadow-md ${
                        missionObj.completed
                          ? "border-2"
                          : "bg-white border border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            missionObj.completed ? "" : "bg-gray-300"
                          }`}
                        ></div>
                        {missionObj.completed && (
                          <svg 
                            className="w-5 h-5" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Mission content */}
                      <div className="space-y-2 text-center flex flex-col justify-center items-center">
                      <Image src="/images/Icon6.svg" alt="logo" width={80} height={80} className="w-20 h-20" />
                        <h4 
                          className="font-semibold text-base capitalize"
                        >
                          {missionObj.mission.replace(/_/g, " ")}
                        </h4>
                        <p className="text-sm text-[#828DB3] leading-relaxed">
                          {missionObj.description}
                        </p>
                      </div>
                    </div>
                  )))
                  }
                </div>
                {/* Centered 24h message below daily missions */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-[#828DB3]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Each task is counted only once every 24 hours</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column (1/3 width on large screens) */}
            <div className="lg:col-span-2">
              <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl shadow-md bg-[#E2EBFF]">
                      <Star className="w-6 h-6 text-[#002DCB]" />
                    </div>
                    <div>
                      <h3 className="text-2xl text-[#060F32] custom-font font-bold">
                        XP Multiplier Tags
                      </h3>
                      <p className="text-sm text-[#828DB3] mt-1">
                        Earn multiplied XP with active tags
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div 
                      className="text-2xl font-bold text-[#060F32] "
                    >
                      {userTags.filter(tag => tag !== "none").length}
                    </div>
                    <div className="text-xs text-[#828DB3]">Active Tags</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:gap-3 lg:overflow-x-auto lg:pb-2 gap-3">
                  {isLoadingTags ? (
                    // Loading skeleton for Tags
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:gap-3 lg:overflow-x-auto lg:pb-2 gap-3 w-full">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className="relative rounded-xl p-4 bg-[#F9FAFF] lg:min-w-[180px] lg:flex-shrink-0 animate-pulse"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="rounded-lg w-10 h-10 bg-gray-300 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="h-4 bg-gray-300 rounded w-20"></div>
                                <div className="h-6 bg-gray-300 rounded w-8"></div>
                              </div>
                              <div className="h-3 bg-gray-300 rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    availableTags
                    .filter((tag) => {
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
                          className={`relative rounded-xl p-4 transition-all duration-300 hover:shadow-md lg:min-w-[180px] lg:flex-shrink-0 ${
                            isActive
                            ? "bg-[#F2F4FE] border-2 border-[#002DCB]"
                            : "bg-[#F9FAFF]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                isActive
                                ? "bg-[#002DCB] text-white"
                                : "bg-[#E2EBFF] text-[#828DB3]"
                              }`}
                            ></div>
                            {isActive && (
                              <svg 
                                className="w-5 h-5" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          <div className="flex items-start gap-4">
                            <div
                              className={`rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                                isActive ? "text-[#002DCB]" : "text-[#060F32]"
                              }`}

                            >
                              {getTagIcon(tag.name)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-base">
                                  {formatTagName(tag.name)}
                                </h4>
                                <span 
                                  className={`text-sm font-bold px-2 py-1 rounded-full ${
                                    isActive ? "text-[#002DCB]" : "text-[#060F32]"
                                  }`}
                                >
                                  {tag.xpMultiplier}x
                                </span>
                              </div>
                              <p className="text-sm text-[#828DB3] leading-relaxed">
                                {tag.description}
                              </p>
                              {tag.verificationRequired && (
                                <div className="text-xs mt-2 text-[#828DB3] italic">
                                  Requires verification
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }))
                  }
                </div>

                <div className="mt-6 rounded-xl p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg bg-[#002DCB]"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">
                          Earn Special Tags
                        </h4>
                        <p className="text-sm text-[#828DB3]">
                          Contribute to get GitHub and other multiplier tags
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href="https://github.com/helios-network"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, rgba(0, 45, 203, 0.125), rgba(74, 108, 247, 0.125))`
                        }}
                        title="GitHub"
                      >
                        <Code className="w-8 h-8 text-black group-hover:text-black/80 transition-colors duration-200" />
                      </a>
                      <a
                        href="https://x.com/helios_layer1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, rgba(0, 45, 203, 0.125), rgba(74, 108, 247, 0.125))`
                        }}
                        title="Twitter"
                      >
                        <X className="w-8 h-8 text-black group-hover:text-black/80 transition-colors duration-200" />
                      </a>
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

export default GamifiedDashboard;
