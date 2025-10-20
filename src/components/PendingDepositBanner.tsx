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

  const etherscanTxUrl = useMemo(() => {
    const tx = record?.rec?.txHash || record?.rec?.lastTxHash;
    if (!tx) return null;
    // Currently we support Sepolia only
    return `https://sepolia.etherscan.io/tx/${tx}`;
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
            (x.rec.status === "submitted" || x.rec.status === "pending" || x.rec.status === "initiated")
        )
        .sort((a, b) => (b.rec.createdAt || 0) - (a.rec.createdAt || 0));

      if (pending.length > 0) {
        setRecord(pending[0]);
        setStatus("waiting");
        setMessage("Deposit submitted. Waiting for confirmation on Helios...");
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
        setMessage("Deposit submitted. Waiting for confirmation on Helios...");
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
          ? "bg-gradient-to-r from-green-50 to-emerald-100 border-b-2 border-emerald-300"
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
                <>
                  Your deposit has been successfully received on Helios! You should see your funds in your wallet shortly and also HLS rewards in your wallet.
                </>
              )}
            </div>
            <div className="text-sm md:text-base text-[#060F32] mt-1 font-semibold">
              {record.rec.amount} {record.rec.tokenSymbol} • From {formatShort(record.rec.sender)}
            </div>
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
              View on Etherscan
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
          onClick={() => setRecord(null)}
          className="absolute right-0 top-1 text-[#5C6584] hover:text-[#060F32]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}


