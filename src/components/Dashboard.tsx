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
  const [xpHistory, setXPHistory] = useState<XPHistoryItem[]>([]);
  const [dailyMission, setDailyMission] = useState<DailyMissionItem[]>([]);
  const [Leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [xpLevelInfo, setXPLevelInfo] = useState<XPLevelInfo | null>(null);
  const [currentUserItem, setCurrentUserItem] = useState<LeaderboardItem>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          historyResponse,
          levelResponse,
          dailyMissionResponse,
          LeaderboardResponse,
          UserRankResponse,
        ] = await Promise.all([
          api.getUserXPHistory(),
          api.getUserXPLevel(),
          api.getUserDailyMission(),
          api.getLeaderboard(),
          api.getUserRank(),
        ]);
        console.log("getUserXPHistory", historyResponse, levelResponse);
        if (historyResponse.success) {
          setXPHistory(historyResponse.xpHistory);
        }
        if (dailyMissionResponse.success) {
          setDailyMission(dailyMissionResponse.data.missions);
          console.log("dailyMission", dailyMissionResponse);
        }
        if (LeaderboardResponse.success) {
          // setLeaderboard(LeaderboardResponse.leaderboard);
          console.log("LeaderboardResponse", LeaderboardResponse.leaderboard);
          const leaderboard = LeaderboardResponse.leaderboard;

          const top7 = leaderboard.slice(0, 10);
          const displayList = top7.map((item, index) => ({
            ...item,
            rank: index + 1, // rank starts at 1
          }));
          const currentUser = displayList.find(
            (user) =>
              user.wallet.toLowerCase() === address?.toString().toLowerCase()
          );

          // Ensure current user is included in 8th slot if not already in top 7
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
          console.log("LeaderBoard", LeaderboardResponse);
        }
        if (levelResponse.success) {
          console.log("levelResponse", levelResponse);
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
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="bg-[#E6EBFD] py-5 px-5">
      <img src="/images/Helios-Testnet.png" alt="logo" className="mb-10" />
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 h-full">
          <div className="lg:col-span-3 flex flex-col space-y-6">
            <div className="shrink-0">
              <section className="bg-[#F2F4FE] p-10 rounded-3xl">
                <div className="flex">
                  <div>
                    <img src="/images/Avatar.svg" alt="logo" />
                  </div>
                  <div className="grid grid-cols-2 w-full">
                    <div className="flex flex-col items-start gap-1">
                      <span className=" ml-2 text-2xl text-[#060F32] custom-font font-bold">
                        Welcome Back
                      </span>
                      <span className="text-sm text-[#828DB3]">
                        {shortenedAddress}
                      </span>
                    </div>
                    <div className="grid place-items-end">
                      <div className="text-xl text-[#828DB3] custom-font font-bold">
                        35 Points
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1">
                        <div className="ml-2 px-2 py-0.5 bg-[#E2EBFF] text-[#002DCB] rounded-full text-sm font-medium">
                          Developer
                        </div>
                        <div className="ml-2 px-2 py-0.5 bg-[#E2EBFF] text-[#002DCB] rounded-full text-sm font-medium">
                          Rising Star
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative w-full h-1.5 bg-[#D7E0FF] overflow-hidden mt-4">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#E2EBFF] to-[#002DCB]"
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
                      {xpLevelInfo?.xpNeededForNextLevel || 0} XP
                    </span>
                  )}
                </div>
              </section>
            </div>
            <div className="flex-grow">
              <section className="bg-[#F2F4FE] p-10 rounded-3xl overflow-hidden h-full">
                <div className="flex items-center justify-between">
                  <img src="/images/Icon1.svg" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl text-[#060F32] custom-font font-bold">
                        Achievement
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#828DB3]">
                        See how you’ve earned XP on Helios Testnet
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 mb-15">
                  {xpHistory?.map((item, index) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between bg-[#F9FAFF] rounded-3xl mt-2 px-1 py-1"
                    >
                      <img
                        src={`/images/Icon3.svg`} // Cycle through Icon2, Icon3, Icon4...
                        alt="logo"
                        className="w-8 h-8"
                      />
                      <div className="flex-1 ml-3">
                        <div className="flex justify-between">
                          <span className="text-lg text-[#060F32] custom-font font-bold">
                            {item.description}
                          </span>
                          <div>
                            <span className="ml-2 px-3 py-1 text-[#002DCB] text-base font-medium">
                              + {item.amount} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                                className={`text-sm custom-font font-bold ${
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
            {/* <section className="bg-[#F2F4FE] p-10 rounded-3xl">
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
                <div className="rounded-2xl bg-[#F9FAFF] min-w-57 p-8">
                  <img src="/images/Icon6.svg" alt="logo" />
                  <div className="mt-2">
                    <div className="text-base text-[#060F32] custom-font font-bold">
                      Bridge assets from another chain
                    </div>
                    <div className="text-sm text-[#828DB3] custom-font">
                      Transfer tokens from other networks to Helios
                    </div>
                    <button
                      className="px-4 py-4 bg-[#002DCB] text-white custom-font font-bold rounded-full text-sm mt-4
                       hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
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
                      Delegate your tokens to a validator
                    </div>
                    <div className="text-sm text-[#828DB3] custom-font">
                      Help secure the network and earn rewards
                    </div>
                    <button
                      className="px-4 py-4 bg-[#002DCB] text-white custom-font font-bold rounded-full text-sm mt-4
                       hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
                       shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                    >
                      <div className="flex items-center">
                        Stake
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
                      Vote on a governance proposal
                    </div>
                    <div className="text-sm text-[#828DB3] custom-font">
                      Have your say in the future of Helios
                    </div>
                    <button
                      className="px-4 py-4 bg-[#002DCB] text-white custom-font font-bold rounded-full text-sm mt-4
                       hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
                       shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                    >
                      <div className="flex items-center">
                        Vote
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
                      Claim your Testnet Pioneer NFT
                    </div>
                    <div className="text-sm text-[#828DB3] custom-font">
                      Get your unique Helios NFT badge
                    </div>
                    <button
                      className="px-4 py-4 bg-[#002DCB] text-white custom-font font-bold rounded-full text-sm mt-4
                       hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
                       shadow-[0_0_30px_rgba(226,235,255,0.3)] hover:shadow-[0_0_50px_rgba(226,235,255,0.5)]"
                    >
                      <div className="flex items-center">
                        Coin
                        <img
                          src="/images/arrow.svg"
                          className="ml-2 w-4 h-4"
                          alt="Arrow"
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section> */}
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
              hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
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
                       hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 
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
  );
};

export default Dashboard;
