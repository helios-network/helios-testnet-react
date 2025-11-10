"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { Trophy, ChevronLeft, ChevronRight, Users, Medal, Star, DollarSign } from 'lucide-react';

interface LeaderboardItem {
  _id: string;
  wallet: string;
  xp: number;
  level: number;
  discordUsername: string;
}

interface TVLLeaderboardItem {
  _id: string;
  wallet: string;
  totalTVL: number;
  discordUsername: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
}

interface TVLLeaderboardData {
  leaderboard: TVLLeaderboardItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
}

const Leaderboard: React.FC = () => {
  const { address } = useAccount();
  const { currentSeason, seasons } = useSeason();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [tvlLeaderboardData, setTvlLeaderboardData] = useState<TVLLeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const itemsPerPage = 50;

  useEffect(() => {
    if (currentSeason) {
      setSelectedSeason(currentSeason.identifier);
    }
  }, [currentSeason]);

  const fetchLeaderboard = useCallback(async () => {
    if (!selectedSeason) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getLeaderboardPage(currentPage, itemsPerPage, selectedSeason);
      
      if (response.success) {
        setLeaderboardData(response);
      } else {
        setError('Failed to fetch leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Error loading leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSeason, currentPage, itemsPerPage]);

  const fetchTVLLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getTVLLeaderboardPage(currentPage, itemsPerPage);
      
      if (response.success) {
        setTvlLeaderboardData(response);
      } else {
        setError('Failed to fetch TVL leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching TVL leaderboard:', err);
      setError('Error loading TVL leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (selectedSeason === 'tvl') {
      fetchTVLLeaderboard();
    } else if (selectedSeason) {
      fetchLeaderboard();
    }
  }, [selectedSeason, currentPage, fetchLeaderboard, fetchTVLLeaderboard]);


  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    if (selectedSeason === 'tvl') {
      setTvlLeaderboardData(null);
    } else {
      setLeaderboardData(null);
    }
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeasonChange = (seasonIdentifier: string) => {
    setIsLoading(true);
    setLeaderboardData(null);
    setTvlLeaderboardData(null);
    setSelectedSeason(seasonIdentifier);
    setCurrentPage(1);
  };

  const abbreviateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-600">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-white border border-gray-200';
  };


  if (error) {
    return (
      <div className="bg-[#E6EBFD] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Trophy className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Error loading leaderboard</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#E6EBFD] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
          <p className="text-gray-600">Compete with other players and climb the ranks!</p>
        </div>

        {/* Season Selector */}
        <div className="mb-8">
          {isLoading && !(selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData) ? (
            <div className="flex flex-wrap gap-2 justify-center animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-300 rounded-lg w-24"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => handleSeasonChange(season.identifier)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSeason === season.identifier
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {season.name}
                  {season.status === 'active' && (
                    <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              ))}
              {/* TVL Leaderboard Button */}
              <button
                onClick={() => handleSeasonChange('tvl')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                  selectedSeason === 'tvl'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                TVL Leaderboard
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading && !(selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData) ? (
            // Loading skeleton for leaderboard table
            <div className="overflow-x-auto animate-pulse">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 bg-gray-300 rounded w-8"></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(10)].map((_, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                          </div>
                          <div className="ml-4">
                            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-16"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (() => {
            const currentData = selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData;
            return currentData && currentData.leaderboard && currentData.leaderboard.length > 0;
          })() ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    {selectedSeason === 'tvl' ? (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TVL
                      </th>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          XP
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(selectedSeason === 'tvl' ? tvlLeaderboardData?.leaderboard : leaderboardData?.leaderboard)?.map((player, index) => {
                    const rank = (currentPage - 1) * itemsPerPage + index + 1;
                    const isCurrentUser = address && player.wallet.toLowerCase() === address.toLowerCase();
                    
                    return (
                      <tr
                        key={player._id}
                        className={`hover:bg-gray-50 transition-colors ${
                          isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRankIcon(rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getRankColor(rank)}`}>
                                <span className="text-sm font-medium">
                                  {player.discordUsername ? player.discordUsername.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {player.discordUsername || 'Anonymous'}
                                {isCurrentUser && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {abbreviateAddress(player.wallet)}
                              </div>
                            </div>
                          </div>
                        </td>
                        {selectedSeason === 'tvl' ? (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${(player as TVLLeaderboardItem).totalTVL.toLocaleString()}
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">Level {(player as LeaderboardItem).level}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {(player as LeaderboardItem).xp.toLocaleString()} XP
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (() => {
            const currentData = selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData;
            return currentData && currentData.leaderboard && currentData.leaderboard.length === 0;
          })() ? (
            // Empty state
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <Trophy className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedSeason === 'tvl' ? 'No TVL Data Yet' : 'No Players Yet'}
                </h3>
                <p className="text-gray-500 max-w-md">
                  {selectedSeason === 'tvl' 
                    ? 'No users have contributed to the TVL yet. Be the first to participate!'
                    : 'No players have joined this season yet. Be the first to start earning XP!'
                  }
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Pagination */}
        {isLoading && !(selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData) ? (
          <div className="mt-8 flex items-center justify-center space-x-2 animate-pulse">
            <div className="h-10 bg-gray-300 rounded-lg w-20"></div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-300 rounded-lg w-10"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-300 rounded-lg w-20"></div>
          </div>
        ) : (() => {
          const currentData = selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData;
          return currentData && currentData.leaderboard && currentData.leaderboard.length > 0 && currentData.pagination.totalPages > 1;
        })() ? (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex space-x-1">
              {(() => {
                const currentData = selectedSeason === 'tvl' ? tvlLeaderboardData : leaderboardData;
                const totalPages = currentData?.pagination.totalPages || 0;
                const current = currentPage;
                const elements = [];
                
                // Always show page 1
                elements.push(
                  <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    1
                  </button>
                );
                
                // Show ellipsis if there's a gap
                if (current > 4) {
                  elements.push(
                    <span key="ellipsis1" className="px-2 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                
                // Show pages around current page
                const startPage = Math.max(2, current - 1);
                const endPage = Math.min(totalPages - 1, current + 1);
                
                for (let i = startPage; i <= endPage; i++) {
                  if (i !== 1 && i !== totalPages) {
                    elements.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === i
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                }
                
                // Show ellipsis if there's a gap
                if (current < totalPages - 3) {
                  elements.push(
                    <span key="ellipsis2" className="px-2 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                
                // Always show last page (if there's more than 1 page)
                if (totalPages > 1) {
                  elements.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return elements;
              })()}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === (selectedSeason === 'tvl' ? tvlLeaderboardData?.pagination.totalPages : leaderboardData?.pagination.totalPages)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default Leaderboard;
