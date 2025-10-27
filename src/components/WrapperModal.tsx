"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ethers } from "ethers";
import { toast } from "sonner";
import { WRAPPER_ABI } from "../wagmiConfig/wrapperAbi";
import { getWrapperConfig } from "../wagmiConfig/wrapperConfig";

interface WrapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: number;
  defaultSymbol?: string;
}

const WrapperModal: React.FC<WrapperModalProps> = ({ isOpen, onClose, defaultChainId, defaultSymbol }) => {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [amount, setAmount] = useState("");
  const [isWrapping, setIsWrapping] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [nativeBalance, setNativeBalance] = useState("0");
  const [wrappedBalance, setWrappedBalance] = useState("0");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");

  // Always prioritize defaultChainId if provided (from the bridge chain selector)
  const targetChainId = defaultChainId ?? currentChainId;
  const wrapperConfig = useMemo(() => {
    const config = getWrapperConfig(targetChainId);
    if (isOpen) {
      console.log('[WrapperModal] targetChainId:', targetChainId, 'config:', config);
    }
    return config;
  }, [targetChainId, isOpen]);

  const needsSwitchChain = isConnected && currentChainId !== targetChainId;

  // Reset mode when modal opens or chain changes
  useEffect(() => {
    if (isOpen) {
      setMode("wrap");
      setAmount("");
    }
  }, [isOpen, targetChainId]);

  // Auto-switch chain when modal opens with a different target chain
  useEffect(() => {
    if (!isOpen || !isConnected || !needsSwitchChain || !switchChain) return;

    const autoSwitchChain = async () => {
      try {
        console.log(`[WrapperModal] Auto-switching from chain ${currentChainId} to ${targetChainId}`);
        await switchChain({ chainId: targetChainId });
        toast.success(`Switched to chain ${targetChainId}`);
      } catch (err: any) {
        console.error('[WrapperModal] Auto-switch failed:', err);
        toast.error(`Please switch to the correct network (Chain ID: ${targetChainId}) to wrap tokens.`);
      }
    };

    // Small delay to ensure modal is fully rendered before triggering switch
    const timer = setTimeout(autoSwitchChain, 300);
    return () => clearTimeout(timer);
  }, [isOpen, isConnected, needsSwitchChain, targetChainId, currentChainId, switchChain]);

  // Fetch balances
  useEffect(() => {
    if (!isConnected || !address || !wrapperConfig) return;

    const fetchBalances = async () => {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // Native balance
        const nativeBal = await provider.getBalance(address);
        setNativeBalance(ethers.formatEther(nativeBal));

        // Wrapped balance
        const contract = new ethers.Contract(wrapperConfig.address, WRAPPER_ABI, provider);
        const wrappedBal = await contract.balanceOf(address);
        setWrappedBalance(ethers.formatEther(wrappedBal));
      } catch (err) {
        console.error("Failed to fetch balances", err);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    return () => clearInterval(interval);
  }, [isConnected, address, wrapperConfig, currentChainId]);

  const handleSwitchChain = async () => {
    if (!switchChain) return;
    try {
      await switchChain({ chainId: targetChainId });
      toast.success(`Switched to chain ${targetChainId}`);
    } catch (err: any) {
      toast.error(`Failed to switch chain: ${err.message}`);
    }
  };

  const handleWrap = async () => {
    if (!isConnected || !address || !wrapperConfig) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (Number(amount) > Number(nativeBalance)) {
      toast.error(`Insufficient ${wrapperConfig.nativeSymbol} balance`);
      return;
    }

    setIsWrapping(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(wrapperConfig.address, WRAPPER_ABI, signer);

      const wrapAmount = ethers.parseEther(amount);

      toast.info("Wrapping in progress...");
      const tx = await contract.deposit({ value: wrapAmount });
      
      toast.info("Waiting for confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success(`Successfully wrapped ${amount} ${wrapperConfig.nativeSymbol} to ${wrapperConfig.wrappedSymbol}`);
        setAmount("");
        // Refetch balances
        const nativeBal = await provider.getBalance(address);
        setNativeBalance(ethers.formatEther(nativeBal));
        const wrappedBal = await contract.balanceOf(address);
        setWrappedBalance(ethers.formatEther(wrappedBal));
      } else {
        toast.error("Wrap transaction failed");
      }
    } catch (err: any) {
      console.error("Wrap error", err);
      toast.error(err.message || "Failed to wrap");
    } finally {
      setIsWrapping(false);
    }
  };

  const handleUnwrap = async () => {
    if (!isConnected || !address || !wrapperConfig) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (Number(amount) > Number(wrappedBalance)) {
      toast.error(`Insufficient ${wrapperConfig.wrappedSymbol} balance`);
      return;
    }

    setIsUnwrapping(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(wrapperConfig.address, WRAPPER_ABI, signer);

      const unwrapAmount = ethers.parseEther(amount);

      toast.info("Unwrapping in progress...");
      const tx = await contract.withdraw(unwrapAmount);
      
      toast.info("Waiting for confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success(`Successfully unwrapped ${amount} ${wrapperConfig.wrappedSymbol} to ${wrapperConfig.nativeSymbol}`);
        setAmount("");
        // Refetch balances
        const nativeBal = await provider.getBalance(address);
        setNativeBalance(ethers.formatEther(nativeBal));
        const wrappedBal = await contract.balanceOf(address);
        setWrappedBalance(ethers.formatEther(wrappedBal));
      } else {
        toast.error("Unwrap transaction failed");
      }
    } catch (err: any) {
      console.error("Unwrap error", err);
      toast.error(err.message || "Failed to unwrap");
    } finally {
      setIsUnwrapping(false);
    }
  };

  if (!wrapperConfig) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border border-[#E2EBFF]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#060F32]">
                  {mode === "wrap" ? "Wrap" : "Unwrap"} {wrapperConfig.nativeSymbol}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-[#F5F7FF] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[#5C6584]" />
                </button>
              </div>

              {!isConnected && (
                <div className="bg-[#FFF5E6] border border-[#FFE5C2] rounded-lg p-4 mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#FF9800] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#060F32]">
                    Please connect your wallet to wrap tokens.
                  </div>
                </div>
              )}

              {isConnected && needsSwitchChain && (
                <div className="bg-[#FFF5E6] border border-[#FFE5C2] rounded-lg p-4 mb-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#FF9800] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#060F32]">
                      Please switch to the correct network (Chain ID: {targetChainId})
                    </div>
                  </div>
                  <button
                    onClick={handleSwitchChain}
                    className="bg-[#FF9800] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#F57C00] transition-colors"
                  >
                    Switch Network
                  </button>
                </div>
              )}

              {isConnected && !needsSwitchChain && (
                <>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setMode("wrap")}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                        mode === "wrap"
                          ? "bg-[#002DCB] text-white"
                          : "bg-[#F5F7FF] text-[#5C6584] hover:bg-[#E2EBFF]"
                      }`}
                    >
                      Wrap
                    </button>
                    <button
                      onClick={() => setMode("unwrap")}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                        mode === "unwrap"
                          ? "bg-[#002DCB] text-white"
                          : "bg-[#F5F7FF] text-[#5C6584] hover:bg-[#E2EBFF]"
                      }`}
                    >
                      Unwrap
                    </button>
                  </div>

                  <div className="bg-[#F5F7FF] rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#5C6584]">
                        {mode === "wrap" ? wrapperConfig.nativeSymbol : wrapperConfig.wrappedSymbol} Balance
                      </span>
                      <span className="text-sm font-semibold text-[#060F32]">
                        {mode === "wrap" ? Number(nativeBalance).toFixed(6) : Number(wrappedBalance).toFixed(6)}
                      </span>
                    </div>
                    <div className="text-xs text-[#5C6584]">
                      Available: {mode === "wrap" ? nativeBalance : wrappedBalance}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-[#5C6584] mb-2">
                      Amount to {mode === "wrap" ? "wrap" : "unwrap"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full px-4 py-3 border-2 border-[#E2EBFF] rounded-lg focus:outline-none focus:border-[#002DCB] text-[#060F32]"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <button
                        onClick={() => setAmount(mode === "wrap" ? nativeBalance : wrappedBalance)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#002DCB] hover:underline"
                      >
                        MAX
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => {
                            const balance = mode === "wrap" ? nativeBalance : wrappedBalance;
                            if (!balance || balance === "0") {
                              toast.info("Unable to fetch balance. Please enter amount manually.");
                              return;
                            }
                            const amountToSet = (Number(balance) * pct / 100).toFixed(6);
                            setAmount(amountToSet);
                          }}
                          className="px-3 py-1 bg-white border border-[#E2EBFF] rounded-md text-xs font-medium text-[#060F32] hover:bg-[#F5F7FF]"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === "wrap" && amount && Number(amount) > 0 && (
                    <div className="bg-[#E8F4FD] border border-[#B3D9F2] rounded-lg p-3 mb-4 text-sm text-[#060F32]">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#0288D1] flex-shrink-0 mt-0.5" />
                        <div>
                          You will receive <span className="font-semibold">{amount} {wrapperConfig.wrappedSymbol}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {mode === "unwrap" && amount && Number(amount) > 0 && (
                    <div className="bg-[#E8F4FD] border border-[#B3D9F2] rounded-lg p-3 mb-4 text-sm text-[#060F32]">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#0288D1] flex-shrink-0 mt-0.5" />
                        <div>
                          You will receive <span className="font-semibold">{amount} {wrapperConfig.nativeSymbol}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={mode === "wrap" ? handleWrap : handleUnwrap}
                    disabled={!amount || Number(amount) <= 0 || isWrapping || isUnwrapping}
                    className="w-full bg-[#002DCB] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#0045FF] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWrapping || isUnwrapping
                      ? `${mode === "wrap" ? "Wrapping" : "Unwrapping"}...`
                      : mode === "wrap"
                      ? `Wrap to ${wrapperConfig.wrappedSymbol}`
                      : `Unwrap to ${wrapperConfig.nativeSymbol}`}
                    {!isWrapping && !isUnwrapping && <ArrowRight className="w-5 h-5" />}
                  </button>

                  <div className="mt-4 text-xs text-[#5C6584] text-center">
                    Wrapper contract: <code className="text-[#060F32] font-mono">{wrapperConfig.address.slice(0, 6)}...{wrapperConfig.address.slice(-4)}</code>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WrapperModal;

