import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ChevronRight } from "lucide-react";
import { api, LiquiditySummaryResponse } from "@/services/api";
import { useStore } from "@/store/onboardingStore";

interface ChainStakeSummary {
  chain: string;
  amountUsd: number;
}

interface LiquidityPosition {
  id: string;
  chain: string; // Ethereum, BNB Chain, etc.
  asset: string; // USDT, WBTC, etc.
  amount: number; // asset units (optional)
  amountUsd: number; // normalized USD value
}

// Removed mocks; real data comes from API

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const formatTokenAmount = (amount: number) => {
  if (amount >= 1000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (amount >= 1) return amount.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

const StakedSummaryBar: React.FC = () => {
  const [byChain, setByChain] = useState<ChainStakeSummary[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [claimableHls, setClaimableHls] = useState<number>(0);
  const isAuthenticated = useStore((s) => s.step > 0);
  const [loading, setLoading] = useState<boolean>(false);

  const CHAIN_ICON_URLS: Record<string, string> = {
    'Ethereum': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    'BNB Chain': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    'Arbitrum': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    'Base': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
    'Optimism': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    'Polygon': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  };
  const CHAINS: string[] = ['Ethereum', 'BNB Chain', 'Arbitrum', 'Base', 'Optimism', 'Polygon'];

  const TOKEN_ICON_BASE = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color';
  const TOKEN_SYMBOL_OVERRIDES: Record<string, string> = {
    // Normalize wrapped to base
    'WETH': 'eth',
    'WBTC': 'btc',
    'WBNB': 'bnb',
    'WMATIC': 'matic',
    'WAVAX': 'avax',
    // Base symbols
    'USDT': 'usdt',
    'USDC': 'usdc',
    'DAI': 'dai',
    'ETH': 'eth',
    'BNB': 'bnb',
    'MATIC': 'matic',
    'ARB': 'arb',
    'OP': 'op',
    'AVAX': 'avax',
    'BTC': 'btc',
  };
  const getTokenIconUrl = (symbol: string): string => {
    const key = TOKEN_SYMBOL_OVERRIDES[symbol?.toUpperCase() || ''] || symbol?.toLowerCase() || 'generic';
    return `${TOKEN_ICON_BASE}/${key}.svg`;
  };

  // Hyperion deposit contract config (per chain)
  const CHAIN_HYPERION_CONTRACTS: Record<string, { address: string; explorer: string }> = {
    'Ethereum': {
      address: '0x0f7c41147ad3b58f9804045593b078fdd41919f3',
      explorer: 'https://sepolia.etherscan.io/address/0x0f7c41147ad3b58f9804045593b078fdd41919f3'
    },
    'BNB Chain': {
      address: '',
      explorer: ''
    },
    'Arbitrum': {
      address: '',
      explorer: ''
    },
    'Base': {
      address: '',
      explorer: ''
    },
    'Optimism': {
      address: '',
      explorer: ''
    },
    'Polygon': {
      address: '',
      explorer: ''
    },
  };

  const shortenAddress = (addr: string): string => {
    if (!addr) return 'Coming soon';
    return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
  };

  // Rewards config (can be wired to API later)
  const HLS_PRICE_USD = 0.02;
  const BASE_APY = 0.20; // 20%
  const FALLBACK_APY = 0.10; // 10% for amounts beyond cap
  const MULTIPLIER_CAP_USD = 50000; // eligible cap for XP multiplier
  const xpMultiplier = 1.2; // mock multiplier; replace with real user XP multiplier

  useEffect(() => {
    (async () => {
      try {
        if (!isAuthenticated) {
          // When unauthenticated, clear content
          setByChain([]);
          setPositions([]);
          setTotal(0);
          return;
        }
        setLoading(true);
        const data: LiquiditySummaryResponse = await api.getUserLiquidity();
        if (data?.success) {
          const incoming = data.byChain || [];
          const merged = CHAINS.map(chain => {
            const found = incoming.find(x => x.chain === chain);
            return { chain, amountUsd: found?.amountUsd || 0 };
          });
          setByChain(merged);
          setTotal(data.totalUsd || 0);
          setPositions((data.positions || []).map(p => ({ id: p.id, chain: p.chain, asset: p.asset, amount: p.amount, amountUsd: p.amountUsd })));
        } else {
          // Keep previous data to avoid UI flicker
        }
      } catch (e) {
        // Keep previous data on transient errors to avoid flicker
      }
      finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const positionsByChain = useMemo(() => {
    const grouped: Record<string, { totalUsd: number; items: LiquidityPosition[] }> = {};
    for (const p of positions) {
      if (!grouped[p.chain]) grouped[p.chain] = { totalUsd: 0, items: [] };
      grouped[p.chain].totalUsd += p.amountUsd;
      grouped[p.chain].items.push(p);
    }
    // Sort items within each chain by USD desc for nicer display
    Object.values(grouped).forEach(g => g.items.sort((a, b) => b.amountUsd - a.amountUsd));
    return grouped;
  }, [positions]);

  const toggleChain = (chain: string) =>
    setExpanded(prev => ({ ...prev, [chain]: !prev[chain] }));

  // Rewards calculations
  const eligibleUsd = Math.min(total, MULTIPLIER_CAP_USD);
  const remainderUsd = Math.max(0, total - MULTIPLIER_CAP_USD);
  const bonusApy = BASE_APY * xpMultiplier;
  const yearlyRewardsUsd = eligibleUsd * bonusApy + remainderUsd * FALLBACK_APY;
  const yearlyRewardsHls = yearlyRewardsUsd / HLS_PRICE_USD;
  const dailyRewardsHls = yearlyRewardsHls / 365;
  const dailyRewardsUsd = dailyRewardsHls * HLS_PRICE_USD;
  const blendedApy = total > 0 ? ((eligibleUsd * bonusApy + remainderUsd * FALLBACK_APY) / total) : 0;
  const eligiblePercent = total > 0 ? Math.min(100, (eligibleUsd / total) * 100) : 0;

  // Simulate live claimable accrual (placeholder until backend provides real-time data)
  useEffect(() => {
    // reset when rate changes
    setClaimableHls(0);
    const perSecond = dailyRewardsHls / 86400; // HLS per second
    const intervalMs = 2000; // update every 2s for smoother feel
    const id = setInterval(() => {
      setClaimableHls(prev => prev + perSecond * (intervalMs / 1000));
    }, intervalMs);
    return () => clearInterval(id);
  }, [dailyRewardsHls]);
  const claimableUsd = claimableHls * HLS_PRICE_USD;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50"
    >
      {loading && (
        <div className="absolute top-3 right-3 text-[#828DB3]">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#002DCB] text-white flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#5C6584]">Your Liquidity on Helios</div>
            <div className="text-lg font-bold text-[#060F32]">{formatCurrency(total)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {byChain.map((item) => (
            <div key={item.chain} className="px-2 py-1 bg-[#F5F7FF] rounded-md text-xs font-medium text-[#002DCB] whitespace-nowrap">
              {item.chain}: {formatCurrency(item.amountUsd)}
            </div>
          ))}
          <ChevronRight className="w-4 h-4 text-[#828DB3]" />
        </div>
      </div>

      {/* Grouped by chain cards with asset chips (always render all chains) */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CHAINS.map((chain) => {
            const group = positionsByChain[chain] || { totalUsd: 0, items: [] };
            const isExpanded = !!expanded[chain];
            const visibleItems = isExpanded ? group.items : group.items.slice(0, 4);
            const hiddenCount = Math.max(0, group.items.length - visibleItems.length);
            return (
              <div key={chain} className="rounded-lg border border-[#E2EBFF] bg-[#F9FAFF] p-3">
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-white border border-[#E2EBFF] flex items-center justify-center overflow-hidden">
                    <img
                      src={CHAIN_ICON_URLS[chain] || CHAIN_ICON_URLS['Ethereum']}
                      alt={chain}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                    <div>
                      <div className="text-xs text-[#5C6584]">{chain}</div>
                      <div className="text-sm font-semibold text-[#060F32]">{formatCurrency(group.totalUsd)}</div>
                    </div>
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => toggleChain(chain)}
                      className="text-xs text-[#002DCB] hover:underline"
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {visibleItems.map(item => (
                    <div key={item.id} className="px-2 py-1 rounded-md bg-white border border-[#E2EBFF] text-[11px] text-[#060F32] flex items-center gap-1.5">
                      <img src={getTokenIconUrl(item.asset)} alt={item.asset} className="w-3.5 h-3.5 object-contain" />
                      <span className="font-semibold text-[#060F32]">{formatTokenAmount(item.amount)} {item.asset}</span>
                      <span className="opacity-60">·</span>
                      <span className="text-[#002DCB]">{formatCurrency(item.amountUsd)}</span>
                    </div>
                  ))}
                </div>
                {/* Deposit contract info */}
                <div className="mt-3 pt-2 border-t border-[#E2EBFF] text-[11px] text-[#5C6584]">
                  <div className="flex items-center justify-between">
                    <span>Deposit Contract</span>
                    {CHAIN_HYPERION_CONTRACTS[chain]?.address ? (
                      <a
                        href={CHAIN_HYPERION_CONTRACTS[chain].explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#002DCB] hover:underline"
                        title={CHAIN_HYPERION_CONTRACTS[chain].address}
                      >
                        {shortenAddress(CHAIN_HYPERION_CONTRACTS[chain].address)}
                      </a>
                    ) : (
                      <span className="italic">Coming soon</span>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <button
                    onClick={() => toggleChain(chain)}
                    className="mt-2 text-xs text-[#5C6584] hover:text-[#060F32]"
                  >
                    Show less
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Rewards summary - polished (neutral) */}
      <div className="mt-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#E2EBFF] p-5 shadow-sm">
        {/* Overview */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="text-xs text-[#5C6584]">Accrued HLS (claimable after TGE)</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#060F32]">
              {claimableHls.toLocaleString(undefined, { maximumFractionDigits: 3 })} HLS
            </div>
            <div className="text-sm text-[#828DB3] mt-1">{formatCurrency(claimableUsd)} estimated</div>
            <div className="text-sm text-[#828DB3] mt-1">Estimated Daily HLS · {dailyRewardsHls.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({formatCurrency(dailyRewardsUsd)})</div>
          </div>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-[#F5F7FF] border border-[#E2EBFF] text-sm font-semibold text-[#002DCB]">Blended APY {(blendedApy * 100).toFixed(1)}%</div>
            <div className="px-3 py-1.5 rounded-full bg-[#F5F7FF] border border-[#E2EBFF] text-sm text-[#060F32]">XP Multiplier x{xpMultiplier.toFixed(2)} up to {formatCurrency(MULTIPLIER_CAP_USD)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-[#E2EBFF]" />

        {/* Eligibility bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#5C6584] mb-1">
            <span>Eligible ({formatCurrency(eligibleUsd)})</span>
            <span>Remainder ({formatCurrency(remainderUsd)})</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#E2EBFF] overflow-hidden">
            <div
              className="h-2.5 bg-[#002DCB]"
              style={{ width: `${eligiblePercent}%` }}
            />
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-3 text-[11px] text-[#5C6584]">
          Liquidity above {formatCurrency(MULTIPLIER_CAP_USD)} earns {Math.round(FALLBACK_APY * 100)}% APY. Learn about multipliers in the{' '}
          <a className="text-[#002DCB] underline" href="#">season XP guide</a>.
        </div>
      </div>
    </motion.div>
  );
};

export default StakedSummaryBar;
