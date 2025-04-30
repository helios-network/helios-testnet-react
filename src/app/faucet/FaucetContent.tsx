"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, AvailableTokensResponse, FaucetClaimHistoryResponse } from "@/services/api";
import { Button } from "@/components/button";
import styles from "./faucet.module.scss";
import { useAccount } from "wagmi";
import { ViewContext } from "@/components/LayoutClientWrapper";
import LoadingIndicator from "@/components/LoadingIndicator";
import { Droplet, Clock, CheckCircle, AlertCircle, Globe, Database } from "lucide-react";
import Footer from "@/components/Footer";

interface TokenInfo {
  token: string;
  chain: string;
  maxClaimAmount: number;
  cooldownHours: number;
  nativeToken: boolean;
  contractAddress?: string;
}

interface ClaimHistoryItem {
  _id: string;
  wallet: string;
  amount: number;
  token: string;
  chain: string;
  status: string;
  transactionHash?: string;
  createdAt: string;
}

export default function FaucetContent() {
  const { address, isConnected } = useAccount();
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimLoading, setClaimLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [eligibility, setEligibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isConnected) {
      fetchData();
    }
  }, [isConnected]);

  useEffect(() => {
    if (selectedToken) {
      setSelectedChain(selectedToken.chain);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (selectedToken && selectedChain) {
      checkEligibility(selectedToken.token, selectedChain);
    }
  }, [selectedToken, selectedChain]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tokensResponse, historyResponse] = await Promise.all([
        api.getAvailableFaucetTokens(),
        api.getFaucetClaimHistory(1, 10)
      ]);
      
      if (tokensResponse && tokensResponse.tokens && tokensResponse.tokens.length > 0) {
        setAvailableTokens(tokensResponse.tokens);
        setSelectedToken(tokensResponse.tokens[0]);
        setAmount(tokensResponse.tokens[0].maxClaimAmount);
        
        // With new format each token has a single chain, so just use that
        if (tokensResponse.tokens[0].chain) {
          setSelectedChain(tokensResponse.tokens[0].chain);
        }
      } else {
        setAvailableTokens([]);
        setSelectedToken(null);
        setError("No tokens available. Please try again later.");
      }
      
      if (historyResponse && historyResponse.faucetClaims) {
        setClaimHistory(historyResponse.faucetClaims);
      } else {
        setClaimHistory([]);
      }
    } catch (error) {
      console.error("Faucet data loading error:", error);
      setError("Failed to load faucet data. Please try again later.");
      setAvailableTokens([]);
      setSelectedToken(null);
      setClaimHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (token: string, chain: string) => {
    if (!token || !chain) {
      setEligibility(prev => ({
        ...prev,
        [`${token}-${chain}`]: false
      }));
      return;
    }
    
    try {
      const response = await api.checkFaucetEligibility(token, chain);
      
      if (response && response.isEligible !== undefined) {
        setEligibility(prev => ({
          ...prev,
          [`${token}-${chain}`]: response.isEligible
        }));
      } else {
        setEligibility(prev => ({
          ...prev,
          [`${token}-${chain}`]: false
        }));
      }
    } catch (error) {
      console.error("Eligibility check error:", error);
      setEligibility(prev => ({
        ...prev,
        [`${token}-${chain}`]: false
      }));
    }
  };

  const handleClaimTokens = async () => {
    if (!selectedToken || !selectedChain) return;
    
    setClaimLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const response = await api.requestFaucetTokens(
        selectedToken.token,
        selectedChain,
        amount
      );
      
      setSuccessMessage(`Successfully claimed ${amount} ${selectedToken.token} on ${selectedChain}!`);
      
      // Refresh claim history and eligibility
      const historyResponse = await api.getFaucetClaimHistory(1, 10);
      setClaimHistory(historyResponse.faucetClaims);
      checkEligibility(selectedToken.token, selectedChain);
    } catch (error: any) {
      setError(error.message || "Failed to claim tokens. Please try again later.");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tokenValue = e.target.value;
    const token = availableTokens.find(t => t.token === tokenValue) || null;
    setSelectedToken(token);
    if (token) {
      setAmount(token.maxClaimAmount);
      setSelectedChain(token.chain);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isEligible = selectedToken && selectedChain 
    ? (eligibility[`${selectedToken.token}-${selectedChain}`] === true)
    : false;

  const shortenAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  if (!isConnected) {
    return (
      <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
        <div className="flex-grow py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#060F32] mb-8 flex items-center"
            >
              <Droplet className="w-7 h-7 text-[#002DCB] mr-3" />
              Helios Testnet Faucet
              <span className="ml-3 text-sm px-3 py-1 bg-[#E2EBFF] text-[#002DCB] rounded-full">Beta</span>
            </motion.h1>
            
            <div className="bg-white rounded-2xl shadow-md p-8 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <p className="text-lg mb-6 text-[#060F32]">Please connect your wallet to access the faucet.</p>
                <Button variant="primary" size="medium" disabled={true}>
                  Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#E6EBFD] min-h-screen flex flex-col">
      <div className="flex-grow py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title with subtle animation */}
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-[#060F32] mb-8 flex items-center"
          >
            <Droplet className="w-7 h-7 text-[#002DCB] mr-3" />
            Helios Testnet Faucet
            <span className="ml-3 text-sm px-3 py-1 bg-[#E2EBFF] text-[#002DCB] rounded-full">Beta</span>
          </motion.h1>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#002DCB]"></div>
              <p className="mt-4 text-[#002DCB] font-medium">Loading faucet data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Claim Section - Wider column */}
              <div className="lg:col-span-3 flex flex-col space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl shadow-md p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-[#E2EBFF] p-3 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                        <Droplet className="w-6 h-6 text-[#002DCB]" />
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl text-[#060F32] custom-font font-bold">
                            Claim Test Tokens
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#828DB3]">
                            Get tokens to test features on the Helios testnet
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-xl mb-6 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-600 p-5 rounded-xl mb-6 flex items-start">
                      <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{successMessage}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-5">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-[#060F32] mb-2" htmlFor="token">
                        Select Token
                      </label>
                      <select 
                        id="token" 
                        value={selectedToken?.token || ""}
                        onChange={handleTokenChange}
                        className="w-full p-3 bg-[#F9FAFF] border border-[#D7E0FF] rounded-lg text-[#060F32] focus:outline-none focus:ring-2 focus:ring-[#002DCB] focus:border-transparent"
                        disabled={!availableTokens || availableTokens.length === 0}
                      >
                        {availableTokens && availableTokens.length > 0 ? (
                          availableTokens.map((token, index) => (
                            <option key={`${token.token}-${index}`} value={token.token}>
                              {token.token} on {token.chain} (Max: {token.maxClaimAmount})
                            </option>
                          ))
                        ) : (
                          <option key="no-tokens" value="">No tokens available</option>
                        )}
                      </select>
                    </div>
                    
                    {selectedToken && (
                      <>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-[#060F32] mb-2" htmlFor="chain">
                            Chain
                          </label>
                          <input
                            type="text"
                            id="chain"
                            value={selectedToken.chain}
                            className="w-full p-3 bg-[#F9FAFF] border border-[#D7E0FF] rounded-lg text-[#060F32]"
                            disabled={true}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="block text-sm font-medium text-[#060F32] mb-2" htmlFor="amount">
                            Amount
                          </label>
                          <input 
                            id="amount" 
                            type="number" 
                            min={0}
                            max={selectedToken.maxClaimAmount || 0}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full p-3 bg-[#F9FAFF] border border-[#D7E0FF] rounded-lg text-[#060F32] focus:outline-none focus:ring-2 focus:ring-[#002DCB] focus:border-transparent"
                            disabled={!isEligible}
                          />
                          <p className="text-xs text-[#828DB3] mt-1">
                            Max: {selectedToken.maxClaimAmount || 0}
                          </p>
                        </div>
                        
                        <div className={`p-4 rounded-xl ${isEligible ? 'bg-[#E9F7EF] border border-[#00CC00]/30' : 'bg-[#FDEDED] border border-[#FF6666]/30'} mt-4`}>
                          <div className="flex items-start">
                            {isEligible ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-[#00CC00] mr-3 mt-0.5 flex-shrink-0" />
                                <p className="text-[#00CC00] font-medium">You are eligible to claim this token!</p>
                              </>
                            ) : (
                              <>
                                <Clock className="w-5 h-5 text-[#FF6666] mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[#FF6666] font-medium">Not eligible yet</p>
                                  <p className="text-[#FF6666] text-sm mt-1">Please wait for the cooldown period ({selectedToken.cooldownHours || "unknown"} hours) to end.</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <Button 
                            onClick={handleClaimTokens}
                            disabled={!isEligible || claimLoading || !selectedToken || !selectedChain}
                            variant="primary"
                            size="medium"
                            className="w-full py-3"
                          >
                            {claimLoading ? "Processing..." : "Claim Tokens"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
              
              {/* History Section - Narrower column */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-md p-8"
                >
                  <div className="flex items-center mb-6">
                    <div className="bg-[#002DCB] p-2 rounded-full mr-4">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#060F32]">Claim History</h2>
                  </div>
                  
                  {claimHistory && claimHistory.length > 0 ? (
                    <div className="overflow-hidden">
                      {claimHistory.map((claim, index) => (
                        <motion.div
                          key={claim._id || `claim-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="border-b border-[#D7E0FF] last:border-b-0 py-4 first:pt-0"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <div className="bg-[#E2EBFF] p-1.5 rounded-full mr-2">
                                <Database className="w-3.5 h-3.5 text-[#002DCB]" />
                              </div>
                              <span className="font-medium text-[#060F32]">{claim.token}</span>
                            </div>
                            <div className={`text-sm font-medium px-2 py-1 rounded-full 
                              ${claim.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 
                                claim.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'}`}
                            >
                              {claim.status || 'Unknown'}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-[#828DB3]">
                              <span className="inline-flex items-center">
                                <Globe className="w-3 h-3 mr-1" />
                                {claim.chain}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{claim.amount} tokens</span>
                            </div>
                            <div className="text-xs text-[#828DB3]">
                              {formatDate(claim.createdAt)}
                            </div>
                          </div>
                          
                          {claim.transactionHash && (
                            <div className="mt-2">
                              <a 
                                href={`https://explorer.helioschainlabs.org/tx/${claim.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#002DCB] hover:underline"
                              >
                                View transaction →
                              </a>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-[#E2EBFF] mx-auto flex items-center justify-center mb-4">
                        <Database className="w-8 h-8 text-[#002DCB]" />
                      </div>
                      <p className="text-[#060F32] font-medium">No claim history yet</p>
                      <p className="text-sm text-[#828DB3] mt-1">Your token claims will appear here</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
} 