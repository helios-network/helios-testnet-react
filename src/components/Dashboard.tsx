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

const Dashboard = () => {
  const { address } = useAccount();
  const [xpHistory, setXPHistory] = useState<XPHistoryItem[]>([]);
  const [xpLevelInfo, setXPLevelInfo] = useState<XPLevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyResponse, levelResponse] = await Promise.all([
          api.getUserXPHistory(),
          api.getUserXPLevel(),
        ]);

        if (historyResponse.success) {
          setXPHistory(historyResponse.xpHistory);
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

  return (
    <div className="min-h-screen bg-[#E6EBFD] py-5 px-5">
      <img src="/images/Helios-Testnet.png" alt="logo" className="mb-10" />
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-[#F2F4FE] p-10 rounded-3xl">
              <div className="flex">
                <div>
                  <img src="/images/Avatar1.svg" alt="logo" />
                </div>
                <div className="grid grid-cols-2 w-full">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-2xl text-[#060F32] custom-font font-bold">
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
            <section className="bg-[#F2F4FE] p-10 rounded-3xl">
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
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-3xl mt-2 px-1 py-1">
                  <img src="/images/Icon2.svg" alt="logo" className="w-8 h-8" />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <span className="text-base sm:text- text-[#060F32] custom-font font-bold">
                        Connected to Helios
                      </span>
                      <div>
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm font-medium">
                          + 20 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-3xl mt-2 px-1 py-1">
                  <img src="/images/Icon3.svg" alt="logo" className="w-8 h-8" />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <span className="text-base text-[#060F32] custom-font font-bold">
                        Claimed Faucet
                      </span>
                      <div>
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm font-medium">
                          + 10 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-3xl mt-2 px-1 py-1">
                  <img src="/images/Icon3.svg" alt="logo" className="w-8 h-8" />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <span className="text-base text-[#060F32] custom-font font-bold">
                        Minted NFT
                      </span>
                      <div>
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm font-medium">
                          + 5 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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
              <div className="mt-4 mb-15">
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-4xl mt-2 px-2 py-0.5">
                  <img src="/images/Rank1.png" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#060F32] custom-font font-bold">
                            CryptoWhale
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#828DB3]">
                            0x1234....5678
                          </span>
                        </div>
                      </div>
                      <div className="place-content-center">
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm custom-font font-bold">
                          250 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-4xl mt-2 px-2 py-0.5">
                  <img src="/images/Rank2.png" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#060F32] custom-font font-bold">
                            CryptoWhale
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#828DB3]">
                            0x1234....5678
                          </span>
                        </div>
                      </div>
                      <div className="place-content-center">
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm custom-font font-bold">
                          250 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-4xl mt-2 px-2 py-0.5">
                  <img src="/images/Rank3.png" alt="logo" />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#060F32] custom-font font-bold">
                            CryptoWhale
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#828DB3]">
                            0x1234....5678
                          </span>
                        </div>
                      </div>
                      <div className="place-content-center">
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm custom-font font-bold">
                          250 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#F9FAFF] rounded-4xl mt-2 px-2 py-0.5">
                  <span className="mx-1 custom-font font-bold text-sm">4</span>
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#060F32] custom-font font-bold">
                            CryptoWhale
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#828DB3]">
                            0x1234....5678
                          </span>
                        </div>
                      </div>
                      <div className="place-content-center">
                        <span className="ml-2 px-3 py-1 text-[#002DCB] text-sm custom-font font-bold">
                          250 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
