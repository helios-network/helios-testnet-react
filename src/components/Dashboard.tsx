import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Award,
  ArrowRight,
  Share2,
  Github,
  Twitter,
  Clock,
  Zap,
} from "lucide-react";
import { useStore } from "../store/onboardingStore";
import { useAccount } from "wagmi";
import { api } from "../services/api";
import { ViewContext } from "../app/layout";
import Header from "./Header";
import Footer from "./Footer";

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getButtonText = (key: string) => {
  switch (key) {
    case "delegate_consensus":
      return "Stake";
    case "claim_rewards":
      return "Claim";
    case "vote_proposal":
      return "Vote";
    default:
      return "Start";
  }
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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          levelResponse,
          dailyMissionResponse,
          LeaderboardResponse,
          UserRankResponse,
        ] = await Promise.all([
          api.getUserXPLevel(),
          api.getUserDailyMission(),
          api.getLeaderboard(),
          api.getUserRank(),
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
    setCurrentPage 
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

  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
      {/* Use the new Header component */}
      <Header currentView="dashboard" />

      {/* Main content */}
      <div className="flex-grow py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 h-full">
            <div className="lg:col-span-3 flex flex-col space-y-6">
              <div className="shrink-0">
                <section className="bg-white rounded-2xl shadow-md p-8">
                  <div className="flex">
                    <div className="hover-float">
                      <img src="/images/Avatar.svg" alt="Profile" className="w-16 h-16" />
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
                            <Zap className="w-4 h-4 text-[#002DCB]" />
                          </span>
                          35 Points
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1 mt-1">
                          <div className="blur-badge">
                            Developer
                          </div>
                          <div className="blur-badge">
                            Rising Star
                          </div>
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
                        <span className="text-[#002DCB] font-medium">{xpLevelInfo?.xpNeededForNextLevel || 0} XP</span> to next level
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
                    {xpHistory?.map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="flex items-center justify-between bg-[#F9FAFF] rounded-xl p-3 mt-2 transition-all duration-200 hover:shadow-sm hover:bg-[#F2F4FE]"
                      >
                        <div className="bg-[#E2EBFF] p-2 rounded-full">
                          <img
                            src={`/images/Icon3.svg`}
                            alt="icon"
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="flex-1 ml-3">
                          <div className="flex justify-between">
                            <span className="text-base text-[#060F32] custom-font font-bold">
                              {item.description}
                            </span>
                            <div>
                              <span className="ml-2 px-3 py-1 text-[#002DCB] text-base font-medium">
                                + {item.amount} XP
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-[#828DB3]">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(item.timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
              <section className="bg-[#F2F4FE] p-10 rounded-3xl h-full">
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
                        className={`flex items-center justify-between rounded-4xl mt-1.5 px-2 ${
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
                              isCurrentUser ? "text-[#002DCB]" : "text-[#060F32]"
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
                    (user) => user.wallet.toLowerCase() !== address?.toLowerCase()
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
                        className="flex items-center justify-between bg-[#D7E0FF] border border-[#002DCB] rounded-[28px] mt-2 px-3 py-1"
                      >
                        <span className="mx-1 custom-font font-bold text-sm text-[#002DCB]">
                          {currentUserItem.rank}
                        </span>

                        <div className="flex-1 ml-3">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-base custom-font font-bold text-[#002DCB]">
                                  {currentUserItem.discordUsername || "Anonymous"}
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
              <section className="bg-[#F2F4FE] p-10 rounded-3xl">
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
                  {dailyMission?.map(
                    (missionObj, index) => (
                      console.log("missionObj", missionObj),
                      (
                        <div
                          key={index}
                          className="rounded-2xl bg-[#F9FAFF] max-w-57 p-8 flex-shrink-0"
                        >
                          <img src="/images/Icon6.svg" alt="logo" />
                          <div className="mt-2">
                            <div className="text-base text-[#060F32] custom-font font-bold capitalize">
                              {missionObj.mission}
                            </div>
                            <div className="text-sm text-[#828DB3] custom-font">
                              {missionObj.description}
                            </div>
                            <button
                              className="px-4 py-4 bg-[#002DCB] text-white custom-font font-bold rounded-full text-sm mt-4
              hover:opacity-90 transform hover:scale-105 transition-all duration-200 
              shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                            >
                              <div className="flex items-center">
                                {getButtonText(missionObj.mission)}
                                <img
                                  src="/images/arrow.svg"
                                  className="ml-2 w-4 h-4"
                                  alt="Arrow"
                                />
                              </div>
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>
            </div>

            {/* Right Column (1/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-[#F2F4FE] p-10 rounded-3xl h-full">
                <div className="flex items-center justify-between">
                  <img src="/images/Icon9.svg" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        Badges & Contributions
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        Apply for a contributor role in the Helios ecosystem
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row space-x-3 mt-4 overflow-x-auto max-w-full">
                  <div className="rounded-2xl bg-[#F9FAFF] max-w-35 min-w-35 p-8 place-items-center border-4 border-blue-800">
                    <img src="/images/badge2.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold text-center">
                        Connected to Helios
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] max-w-35 min-w-35 p-8 place-items-center">
                    <img src="/images/badge2.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold text-center">
                        Claimed Faucet
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F9FAFF] max-w-35 min-w-35 p-8 place-items-center">
                    <img src="/images/badge1.svg" alt="logo" />
                    <div className="mt-2">
                      <div className="text-base text-[#060F32] custom-font font-bold text-center">
                        Claimed Faucet
                      </div>
                    </div>
                  </div>
                </div>
                <div className=" flex flex-row mt-4 bg-[#E2EBFF]/20 rounded-xl place-items-center">
                  <div className="font-medium text-[#040F34] mx-4">
                    Become a Contributor
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-[#002DCB] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#0045FF] transition-colors duration-200">
                      <Github className="w-4 h-4" />
                      GitHub
                    </button>
                    <button className="flex-1 px-4 py-2 bg-[#002DCB] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#0045FF] transition-colors duration-200">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-[#F2F4FE] p-10 rounded-3xl">
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
                        Collect badges and NFTs by completing tasks and earning XP
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
