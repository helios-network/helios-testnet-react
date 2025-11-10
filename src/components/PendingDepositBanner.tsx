"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { checkStatus } from "@/services/bridgeApi";
import { motion } from "framer-motion";

type DepositRecord = {
  chainId: number;
  tokenSymbol: string;
  amount: string;
  sender: string;
  destination?: string;
  depositId: string;
  createdAt: number;
  status: string;
  txHash?: string;
  lastTxHash?: string;
};

const formatShort = (addr?: string) =>
  addr && addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr || "";

export default function PendingDepositBanner() {
  const { address } = useAccount();
  const [record, setRecord] = useState<{ key: string; rec: DepositRecord } | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "confirmed" | "error">("idle");
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [xpBase, setXpBase] = useState<number | undefined>(undefined);
  const [usdValue, setUsdValue] = useState<number | undefined>(undefined);

  const etherscanTxUrl = useMemo(() => {
    const tx = record?.rec?.txHash || record?.rec?.lastTxHash;
    const chainId = record?.rec?.chainId;
    if (!tx || !chainId) return null;
    const explorerByChainId: Record<number, string> = {
      1: 'https://etherscan.io',
      56: 'https://bscscan.com',
      42161: 'https://arbiscan.io',
      8453: 'https://basescan.org',
      10: 'https://optimistic.etherscan.io',
      137: 'https://polygonscan.com',
      11155111: 'https://sepolia.etherscan.io',
      97: 'https://testnet.bscscan.com'
    };
    const base = explorerByChainId[Number(chainId)] || 'https://etherscan.io';
    return `${base}/tx/${tx}`;
  }, [record]);

  useEffect(() => {
    try {
      if (!address) {
        setRecord(null);
        return;
      }
      const prefix = "helios:deposit:";
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      const now = Date.now();
      const pending = keys
        .map((k) => ({ key: k, rec: JSON.parse(localStorage.getItem(k) || "{}") as DepositRecord }))
        .filter(
          (x) =>
            x.rec &&
            x.rec.sender?.toLowerCase() === address.toLowerCase() &&
            // Only show submitted, pending, or initiated deposits (not dismissed, error, cancelled, timeout, or success)
            (x.rec.status === "submitted" || x.rec.status === "pending" || x.rec.status === "initiated") &&
            // Ignore stale records older than 30 minutes
            (x.rec.createdAt && (now - x.rec.createdAt) < 30 * 60 * 1000)
        )
        .sort((a, b) => (b.rec.createdAt || 0) - (a.rec.createdAt || 0));

      if (pending.length > 0) {
        setRecord(pending[0]);
        setStatus("waiting");
        setMessage("Deposit submitted.");
      } else {
        setRecord(null);
        setStatus("idle");
        setMessage("");
      }
    } catch {
      // ignore
    }
  }, [address]);

  // Listen for deposit updates from the transfer flow to show banner immediately
  useEffect(() => {
    const onDepositUpdated = (e: any) => {
      try {
        const { key, record } = e?.detail || {};
        if (!key || !record) return;
        if (!address) return;
        if (record.sender?.toLowerCase() !== address.toLowerCase()) return;
        setRecord({ key, rec: record });
        setStatus("waiting");
        setMessage("Deposit submitted.");
      } catch {}
    };
    window.addEventListener('helios:deposit-updated', onDepositUpdated as any);
    return () => window.removeEventListener('helios:deposit-updated', onDepositUpdated as any);
  }, [address]);

  useEffect(() => {
    let timer: any;
    const startPolling = async () => {
      if (!record || polling) return;
      setPolling(true);
      const doPoll = async () => {
        try {
          const res = await checkStatus({
            chainId: record.rec.chainId,
            tokenSymbol: record.rec.tokenSymbol,
            sender: record.rec.sender,
            amount: record.rec.amount,
            destination: record.rec.destination,
            depositId: record.rec.depositId,
          });
          if (res.found) {
            const updated: DepositRecord = { ...record.rec, status: "success", txHash: res.deposit?.txHash };
            localStorage.setItem(record.key, JSON.stringify(updated));
            setRecord({ key: record.key, rec: updated });
            setStatus("confirmed");
            setMessage("Deposit confirmed on Helios.");
            setXpBase(typeof res.deposit?.xpBase === 'number' ? res.deposit.xpBase : undefined);
            setUsdValue(typeof res.deposit?.usdValue === 'number' ? res.deposit.usdValue : undefined);
            try { window.dispatchEvent(new Event('helios:liquidity-refresh')); } catch {}
            setPolling(false);
            return;
          }
        } catch {
          // ignore errors and continue polling
        }
        // Continue polling more frequently (every 10s) until confirmed
        timer = setTimeout(doPoll, 10000);
      };
      // Immediate first check, then continue every 30s
      doPoll();
    };
    if (record && status === "waiting") startPolling();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [record, status, polling, refreshTick]);

  const handleRefresh = async () => {
    if (!record) return;
    try {
      setRefreshing(true);
      setMessage("Checking status...");
      const res = await checkStatus({
        chainId: record.rec.chainId,
        tokenSymbol: record.rec.tokenSymbol,
        sender: record.rec.sender,
        amount: record.rec.amount,
        destination: record.rec.destination,
        depositId: record.rec.depositId,
      });
      if (res.found) {
        const updated: DepositRecord = { ...record.rec, status: "success", txHash: res.deposit?.txHash };
        localStorage.setItem(record.key, JSON.stringify(updated));
        setRecord({ key: record.key, rec: updated });
        setStatus("confirmed");
        setMessage("Deposit confirmed on Helios.");
        setXpBase(typeof res.deposit?.xpBase === 'number' ? res.deposit.xpBase : undefined);
        setUsdValue(typeof res.deposit?.usdValue === 'number' ? res.deposit.usdValue : undefined);
        try { window.dispatchEvent(new Event('helios:liquidity-refresh')); } catch {}
      } else {
        setStatus("waiting");
        setMessage("Still waiting for confirmation...");
        // trigger (re)polling cycle
        setRefreshTick((t) => t + 1);
      }
    } catch {
      setMessage("Failed to refresh status. Try again in a moment.");
    } finally {
      setRefreshing(false);
    }
  };

  if (!record) return null;

  const isConfirmed = status === "confirmed" || record.rec.status === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 w-full ${
        isConfirmed
          ? "bg-gradient-to-r from-green-50 via-emerald-100 to-green-50 border-b-2 border-emerald-300"
          : "bg-gradient-to-r from-amber-50 to-yellow-100 border-b-2 border-amber-300"
      } text-[#060F32] px-4 md:px-6 py-3 md:py-4 shadow-md z-50`}
    >
      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 pr-8">
        <div className="flex items-start md:items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConfirmed ? "bg-emerald-200" : "bg-amber-200"}`}>
            {!isConfirmed ? (
              <svg className="animate-spin h-5 w-5 text-[#060F32]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-green-700">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 10.435a1 1 0 111.414-1.414l3.222 3.222 6.657-6.657a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <div className="font-bold text-lg md:text-xl text-[#060F32]">
              {!isConfirmed ? "Deposit in progress" : "Deposit confirmed!"}
            </div>
            <div className="text-sm md:text-base text-[#5C6584]">
              {!isConfirmed ? (
                <>
                  {message} Your funds are safe and being tracked. This typically takes 2-5 minutes.
                </>
              ) : (
                <div className="space-y-1">
                  <div>
                    Congrats! Your tokens will be sent directly to your wallet and will appear on the Helios Portal shortly.
                    {" "}
                    <a href="https://portal.helioschain.network" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-[#002DCB]">Open Portal</a>
                  </div>
                  <div>
                    Put them to work across the Helios ecosystem to earn APY:
                    {" "}
                    <a href="https://helioschain.network/ecosystem/" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-[#002DCB]">Explore Ecosystem</a>
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm md:text-base text-[#060F32] mt-1 font-semibold">
              {record.rec.amount} {record.rec.tokenSymbol} • From {formatShort(record.rec.sender)}
            </div>
            {isConfirmed && (
              <div className="mt-1 flex items-center gap-3 text-sm">
                {typeof xpBase === 'number' && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-white border border-emerald-300 text-green-700 font-semibold">
                    +{xpBase} XP
                  </div>
                )}
                {typeof usdValue === 'number' && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-white border border-[#E2EBFF] text-[#5C6584]">
                    ~${usdValue.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
          <div className="flex items-center gap-2 md:gap-3">
          {etherscanTxUrl && (
            <a
              href={etherscanTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 md:px-4 py-2 rounded-full bg-white border border-[#E2EBFF] text-[#002DCB] text-sm font-semibold hover:bg-gray-50"
            >
              View on Explorer
            </a>
          )}
          {!isConfirmed && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 md:px-4 py-2 rounded-full bg-[#002DCB] text-white text-sm font-semibold hover:bg-[#0045FF] disabled:opacity-60"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          )}
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => {
            if (record) {
              // Mark as dismissed in localStorage so it won't be restored
              try {
                const updated: DepositRecord = { ...record.rec, status: "dismissed" };
                localStorage.setItem(record.key, JSON.stringify(updated));
              } catch {}
            }
            setRecord(null);
          }}
          className="absolute right-0 top-1 text-[#5C6584] hover:text-[#060F32]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {isConfirmed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* subtle confetti sparkles */}
          <div className="absolute -top-6 right-10 w-24 h-24 rounded-full bg-emerald-300 opacity-20 blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-8 left-20 w-28 h-28 rounded-full bg-green-300 opacity-20 blur-2xl animate-pulse"></div>
        </div>
      )}
    </motion.div>
  );
}


