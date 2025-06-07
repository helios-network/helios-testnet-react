import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { api } from "../services/api";
import { Users, Trophy, Award } from "lucide-react";
import Footer from "./Footer";
import InviteQuotaInfo from "./InviteQuotaInfo";

interface ReferralStats {
  totalUsers: number;
  totalReferrals: number;
  totalReferralXP: number;
  referredUsers: number;
  activeReferrers: number;
}

interface TopReferrer {
  _id: string;
  wallet: string;
  username?: string;
  referralCode: string;
  actualReferralCount: number;
  referralXP: number;
}

export function ReferralLeaderboard() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (address) {
      fetchStats();
    }
  }, [address]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.getGlobalReferralStats();
      
      if (response.success) {
        setStats(response.stats);
        
        // Set top referrers
        if (response.topReferrers) {
          setTopReferrers(response.topReferrers);
          
          // Find current user's rank if they are in the top referrers
          if (address) {
            const userIndex = response.topReferrers.findIndex(
              (referrer) => referrer.wallet.toLowerCase() === address.toLowerCase()
            );
            
            if (userIndex !== -1) {
              setCurrentUserRank(userIndex + 1);
            }
          }
        }
        
        setError(null);
      }
    } catch (err) {
      setError('Error fetching referral statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const abbreviateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title with subtle animation */}
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-[#060F32] mb-6 flex items-center"
          >
            <Trophy className="w-7 h-7 text-[#002DCB] mr-3" />
            Referral Leaderboard
            <span className="ml-3 text-sm px-3 py-1 bg-[#E2EBFF] text-[#002DCB] rounded-full">Beta</span>
          </motion.h1>

          {/* Invite Quota Information */}
          <div className="mb-8">
            <InviteQuotaInfo showDetailed={true} />
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#002DCB]"></div>
              <p className="mt-4 text-[#002DCB] font-medium">Loading leaderboard data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl shadow-sm flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-lg text-red-700 mb-1">Error Loading Data</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards with modern Web3 styling */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="web3-card p-6 flex flex-col items-center hover-float"
                >
                  <div className="bg-[#E2EBFF] p-3 rounded-full mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                    <Users className="w-6 h-6 text-[#002DCB]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#060F32]">{stats?.referredUsers?.toLocaleString() || 0}</h3>
                  <p className="text-sm text-gray-500">Referred Users</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="web3-card p-6 flex flex-col items-center hover-float"
                >
                  <div className="bg-[#E2EBFF] p-3 rounded-full mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                    <Award className="w-6 h-6 text-[#002DCB]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#060F32]">{stats?.activeReferrers?.toLocaleString() || 0}</h3>
                  <p className="text-sm text-gray-500">Active Referrers</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="web3-card p-6 flex flex-col items-center hover-float"
                >
                  <div className="bg-[#E2EBFF] p-3 rounded-full mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                    <Trophy className="w-6 h-6 text-[#002DCB]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#060F32]">{stats?.totalReferralXP?.toLocaleString() || 0}</h3>
                  <p className="text-sm text-gray-500">Total Referral XP</p>
                </motion.div>
              </div>

              {/* Leaderboard with enhanced styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-md p-6 md:p-8 w-full"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-[#002DCB] p-2 rounded-full mr-4">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#060F32]">Top Referrers</h2>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="web3-table">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#828DB3]">Rank</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#828DB3]">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#828DB3]">Referrals</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#828DB3]">XP Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topReferrers.map((referrer, index) => {
                        const isCurrentUser = address && referrer.wallet.toLowerCase() === address.toLowerCase();
                        const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

                        return (
                          <motion.tr 
                            key={referrer._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`border-b border-[#D7E0FF] transition-all duration-200 ${isCurrentUser ? 'bg-[#D7E0FF]/50' : ''} hover:bg-[#E2EBFF]/20`}
                          >
                            <td className="px-4 py-4">
                              {index < 3 ? (
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                  style={{ 
                                    backgroundColor: rankColors[index],
                                    boxShadow: `0 2px 8px ${rankColors[index]}80`
                                  }}
                                >
                                  {index + 1}
                                </div>
                              ) : (
                                <div className="text-[#060F32] font-medium">{index + 1}</div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-[#060F32] flex items-center">
                                {isCurrentUser && (
                                  <span className="inline-block w-2 h-2 bg-[#002DCB] rounded-full mr-2" title="You"></span>
                                )}
                                {referrer.username || abbreviateAddress(referrer.wallet)}
                                {index < 3 && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-[#FFF7E2] text-[#FFB800] rounded-full font-medium">
                                    {index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#828DB3]">{abbreviateAddress(referrer.wallet)}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-bold text-[#002DCB] flex items-center">
                                <span className="bg-[#E2EBFF] w-6 h-6 rounded-full flex items-center justify-center mr-2">
                                  <Users className="w-3 h-3 text-[#002DCB]" />
                                </span>
                                {referrer.actualReferralCount}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-[#060F32] flex items-center">
                                <span className="bg-[#E2EBFF] w-6 h-6 rounded-full flex items-center justify-center mr-2">
                                  <Award className="w-3 h-3 text-[#002DCB]" />
                                </span>
                                +{referrer.referralXP} XP
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                      
                      {topReferrers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Trophy className="w-12 h-12 text-gray-300 mb-3" />
                              <p className="text-lg font-medium mb-1">No referral data available yet</p>
                              <p className="text-sm">Be the first to refer friends and earn rewards!</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {currentUserRank === null && address && (
                  <div className="mt-6 p-5 bg-[#E2EBFF]/50 rounded-xl text-[#002DCB] border border-[#002DCB]/10 flex items-start">
                    <div className="bg-[#002DCB] p-2 rounded-full mr-3 shrink-0">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">You're not on the leaderboard yet</h3>
                      <p className="text-sm">Invite friends using your referral code to climb the leaderboard and earn XP rewards!</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
      
      {/* Use the new Footer component */}
      <Footer />
    </div>
  );
}

export default ReferralLeaderboard; 