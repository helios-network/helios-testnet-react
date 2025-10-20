"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/services/api";
import { Button } from "@/components/button";
import { useAccount } from "wagmi";
import { Droplet, Clock, CheckCircle, AlertCircle, Globe, Database } from "lucide-react";
import Footer from "@/components/Footer";
import { EXPLORER_URL } from "@/wagmiConfig/app";

// No token selection UI in automatic mode

interface ClaimHistoryItem {
  _id: string;
  wallet: string;
  amount: number;
  token: string;
  chain: string;
  status: string;
  transactionHash?: string;
  createdAt: string;
  triggeredByExternalDeposit?: boolean;
  externalDepositTxHash?: string;
  externalDepositChainId?: number;
  externalDepositUsdValue?: number;
  externalDepositAmountFormatted?: string;
  externalDepositSymbol?: string;
}

export default function FaucetContent() {
  const { address, isConnected } = useAccount();
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isConnected) {
      fetchData();
    }
  }, [isConnected]);

  // No selection/eligibility logic in auto mode

  const fetchData = async () => {
    setLoading(true);
    try {
      const historyResponse = await api.getFaucetClaimHistory(1, 10);
      setClaimHistory(historyResponse?.faucetClaims || []);
    } catch (error) {
      console.error("Faucet data loading error:", error);
      setError("Failed to load faucet data. Please try again later.");
      setClaimHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // No selection or manual claim handlers in automatic mode

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Map external chain IDs to their transaction explorer URLs
  const getExternalExplorerTxUrl = (
    chainId?: number,
    txHash?: string
  ): string | null => {
    if (!chainId || !txHash) return null;
    switch (chainId) {
      // Mainnets
      case 1: return `https://etherscan.io/tx/${txHash}`;
      case 56: return `https://bscscan.com/tx/${txHash}`;
      case 42161: return `https://arbiscan.io/tx/${txHash}`;
      case 8453: return `https://basescan.org/tx/${txHash}`;
      case 10: return `https://optimistic.etherscan.io/tx/${txHash}`;
      case 137: return `https://polygonscan.com/tx/${txHash}`;
      // Testnets commonly used in our listener config
      case 11155111: return `https://sepolia.etherscan.io/tx/${txHash}`;
      case 97: return `https://testnet.bscscan.com/tx/${txHash}`;
      case 421614: return `https://sepolia.arbiscan.io/tx/${txHash}`;
      case 84532: return `https://sepolia.basescan.org/tx/${txHash}`;
      case 11155420: return `https://sepolia-optimistic.etherscan.io/tx/${txHash}`;
      case 80002: return `https://amoy.polygonscan.com/tx/${txHash}`;
      default: return null;
    }
  };

  const getExternalChainName = (chainId?: number): string | null => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 56: return 'BNB Chain';
      case 42161: return 'Arbitrum';
      case 8453: return 'Base';
      case 10: return 'Optimism';
      case 137: return 'Polygon';
      case 11155111: return 'Ethereum Sepolia';
      case 97: return 'BSC Testnet';
      case 421614: return 'Arbitrum Sepolia';
      case 84532: return 'Base Sepolia';
      case 11155420: return 'OP Sepolia';
      case 80002: return 'Polygon Amoy';
      default: return null;
    }
  };

  // No eligibility in automatic mode

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
            Helios Faucet
            <span className="ml-3 text-sm px-3 py-1 bg-[#E2EBFF] text-[#002DCB] rounded-full">Beta</span>
          </motion.h1>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#002DCB]"></div>
              <p className="mt-4 text-[#002DCB] font-medium">Loading faucet data...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-md p-8 mb-8"
            >
              <div className="flex items-center mb-6">
                <div className="bg-[#E2EBFF] p-3 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#002DCB]/10 to-transparent rounded-full"></div>
                  <Droplet className="w-6 h-6 text-[#002DCB]" />
                </div>
                <div className="ml-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-[#060F32] custom-font font-bold">Automatic HLS Faucet</span>
                    <span className="text-xs px-2 py-0.5 bg-[#E2EBFF] text-[#002DCB] rounded-full">Beta</span>
                  </div>
                  <p className="text-sm text-[#828DB3] mt-1">Every eligible external deposit (≥ $1) triggers 1 HLS sent automatically to your wallet on Helios.</p>
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

              <div className="p-4 rounded-xl bg-[#E9F7EF] border border-[#00CC00]/30 mb-6">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#00CC00] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#060F32] font-semibold">How it works</p>
                    <ul className="list-disc ml-5 mt-2 text-[#4A5775] text-sm space-y-1">
                      <li>Bridge assets from Ethereum, BNB, Arbitrum, Base, Optimism, or Polygon to Helios.</li>
                      <li>Each deposit worth $1+ gets you <span className="font-semibold">1 HLS</span> sent automatically.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <div className="bg-[#002DCB] p-2 rounded-full mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#060F32]">Reward History</h2>
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

                      <div className="flex justify-between items-start gap-3">
                        <div className="text-sm text-[#4A5775]">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span className="inline-flex items-center text-[#828DB3]">
                              <Globe className="w-3 h-3 mr-1" />
                              {claim.chain}
                            </span>
                            <span className="text-[#828DB3]">•</span>
                            <span>{claim.amount} HLS</span>
                          </div>
                          {claim.triggeredByExternalDeposit ? (
                            <div className="mt-1 text-xs text-[#4A5775]">
                              <span className="text-[#828DB3]">from deposit</span>
                              <span className="ml-1">
                                {claim.externalDepositAmountFormatted || '?' } {claim.externalDepositSymbol || ''}
                              </span>
                              {typeof claim.externalDepositUsdValue === 'number' && (
                                <span className="ml-2">(~${claim.externalDepositUsdValue.toFixed(2)} USD)</span>
                              )}
                              {(() => {
                                const name = getExternalChainName(claim.externalDepositChainId);
                                return name ? <span className="ml-2 text-[#828DB3]">on {name}</span> : null;
                              })()}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-xs text-[#828DB3] whitespace-nowrap">
                          {formatDate(claim.createdAt)}
                        </div>
                      </div>

                      {claim.transactionHash && (
                        <div className="mt-2">
                          <a 
                            href={`${EXPLORER_URL}/tx/${claim.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#002DCB] hover:underline"
                          >
                            View HLS transfer →
                          </a>
                        </div>
                      )}

                      {claim.triggeredByExternalDeposit && claim.externalDepositTxHash && (
                        <div className="mt-1 text-xs text-[#4A5775]">
                          Deposit:
                          {(() => {
                            const extUrl = getExternalExplorerTxUrl(
                              claim.externalDepositChainId,
                              claim.externalDepositTxHash
                            );
                            const short = `${claim.externalDepositTxHash.slice(0, 10)}...`;
                            return extUrl ? (
                              <a
                                href={extUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-[#002DCB] hover:underline"
                              >
                                {short}
                              </a>
                            ) : (
                              <span className="ml-1">{short}</span>
                            );
                          })()}
                          {typeof claim.externalDepositUsdValue === 'number' && (
                            <span className="ml-2">(~${claim.externalDepositUsdValue.toFixed(2)} USD)</span>
                          )}
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
                  <p className="text-[#060F32] font-medium">No reward history yet</p>
                  <p className="text-sm text-[#828DB3] mt-1">Make a deposit from an external chain to earn HLS</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
} 