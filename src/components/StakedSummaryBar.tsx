import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Wallet, ChevronRight } from "lucide-react";
import { api, LiquiditySummaryResponse, ApySummaryResponse } from "@/services/api";
import { useAccount } from "wagmi";
import { useStore } from "@/store/onboardingStore";
import { normalizeTokenSymbol } from "@/lib/tokenUtils";

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
  if (amount >= 0.001) return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (amount >= 0.0001) return amount.toLocaleString(undefined, { maximumFractionDigits: 5 });
  if (amount >= 0.00001) return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
  if (amount >= 0.000001) return amount.toLocaleString(undefined, { maximumFractionDigits: 7 });
  if (amount >= 0.0000001) return amount.toLocaleString(undefined, { maximumFractionDigits: 8 });
  if (amount >= 0.00000001) return amount.toLocaleString(undefined, { maximumFractionDigits: 9 });
  if (amount >= 0.000000001) return amount.toLocaleString(undefined, { maximumFractionDigits: 10 });
  if (amount >= 0.0000000001) return amount.toLocaleString(undefined, { maximumFractionDigits: 11 });
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
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [chainContracts, setChainContracts] = useState<Record<string, { address: string; explorer?: string }>>({});
  const [showBonuses, setShowBonuses] = useState<boolean>(false);

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
  
  // TrustWallet contract addresses for tokens (for better icon coverage)
  const TRUSTWALLET_TOKEN_ADDRESSES: Record<string, { chain: string; address: string }> = {
    'ARB': { chain: 'arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548' },
    'OP': { chain: 'optimism', address: '0x4200000000000000000000000000000000000042' },
    'AAVE': { chain: 'ethereum', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
    'SNX': { chain: 'ethereum', address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F' },
  };
  
  // Local overrides for tokens that lack reliable icons in external repos
  const LOCAL_TOKEN_ICON_OVERRIDES: Record<string, string> = {
    'CAKE': '/images/tokens/cake.png',
    'GMX': '/images/tokens/gmx.png',
    'SUSD': '/images/tokens/susd.png',
    'AERO': '/images/tokens/aero.png',
  };
  
  const TOKEN_SYMBOL_OVERRIDES: Record<string, string> = {
    // Normalize wrapped to base
    'WETH': 'eth',
    'WBTC': 'btc',
    'WBNB': 'bnb',
    'WtBNB': 'bnb',
    'WPOL': 'matic',
    'WMATIC': 'matic',
    'WAVAX': 'avax',
    'cbETH': 'eth',
    // Base symbols
    'USDT': 'usdt',
    'USD₮0': 'usdt',
    'USDT0': 'usdt',
    'USD₮': 'usdt',
    'USDC': 'usdc',
    'DAI': 'dai',
    'ETH': 'eth',
    'BNB': 'bnb',
    'MATIC': 'matic',
    'POL': 'matic',
    'AVAX': 'avax',
    'BTC': 'btc',
    'BTCB': 'btc',
    'stETH': 'steth',
    // Tokens in local folder
    'GMX': 'gmx',
    'CAKE': 'cake',
    'AERO': 'aero',
    'sUSD': 'susd',
    'SUSD': 'susd',
  };

  const mapIncomingPositions = (incomingPositions: any[] = []): LiquidityPosition[] => {
    return (incomingPositions || []).map((p: any) => {
      const normalizedAsset = normalizeTokenSymbol(p?.asset);
      return {
        id: p.id,
        chain: p.chain,
        asset: normalizedAsset || p.asset || '',
        amount: p.amount,
        amountUsd: p.amountUsd,
      };
    });
  };
  
  const getTokenIconUrl = (symbol: string): string => {
    const sym = (symbol || '').toUpperCase();

    // Override for HLS token
    if (sym === 'HLS') {
      return '/images/logo.png'; // Assuming this is the correct path for HLS logo
    }
    
    // Check local overrides first
    if (LOCAL_TOKEN_ICON_OVERRIDES[sym]) {
      return LOCAL_TOKEN_ICON_OVERRIDES[sym];
    }
    
    // Check if we have a TrustWallet address for this token
    if (TRUSTWALLET_TOKEN_ADDRESSES[sym]) {
      const { chain, address } = TRUSTWALLET_TOKEN_ADDRESSES[sym];
      return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${address}/logo.png`;
    }
    
    // Check symbol overrides (for Spot icon keys)
    const override = TOKEN_SYMBOL_OVERRIDES[sym];
    if (override) {
      return `${TOKEN_ICON_BASE}/${override}.svg`;
    }
    
    // Final fallback to lowercase symbol
    const key = symbol?.toLowerCase() || 'generic';
    return `${TOKEN_ICON_BASE}/${key}.svg`;
  };

  // Deposit contract data is provided by API via chainContracts

  const shortenAddress = (addr: string): string => {
    if (!addr) return 'Coming soon';
    return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
  };

  // Rewards config (can be wired to API later)
  const [apy, setApy] = useState<ApySummaryResponse | null>(null);
  const { address } = useAccount();

  // Extracted fetch function to be reused by initial load and polling
  const fetchData = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        // When unauthenticated, clear content
        setByChain([]);
        setPositions([]);
        setTotal(0);
        setApy(null);
        setHasLoaded(false);
        return;
      }
      setLoading(true);
      const liq: LiquiditySummaryResponse = await api.getUserLiquidity();
      let apySummary: ApySummaryResponse | null = null;
      const walletLower = (address || '').toLowerCase();
      if (walletLower) {
        try {
          apySummary = await api.getApySummary(walletLower);
        } catch {}
      }
      if (liq?.success) {
        const incoming = liq.byChain || [];
        const merged = CHAINS.map((chain: string) => {
          const found = incoming.find((x: { chain: string; amountUsd: number }) => x.chain === chain);
          return { chain, amountUsd: found?.amountUsd || 0 };
        });
        setByChain(merged);
        setTotal(liq.totalUsd || 0);
        setPositions(mapIncomingPositions(liq.positions));
        setChainContracts(liq.chainContracts || {});
      }
      setApy(apySummary);
      if (liq?.success) {
        setHasLoaded(true);
      }
    } catch (e) {
      // Keep previous data on transient errors to avoid flicker
    }
    finally {
      setLoading(false);
    }
  }, [isAuthenticated, address]);

  // Initial load when authenticated or address changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh polling: refresh data every 3 minutes to show real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
    const intervalId = setInterval(() => {
      fetchData();
    }, POLL_INTERVAL_MS);

    // Cleanup interval on unmount or when auth status changes
    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchData]);

  // Refresh liquidity when a deposit is confirmed
  useEffect(() => {
    const refresh = async () => {
      try {
        setLoading(true);
        const liq: LiquiditySummaryResponse = await api.getUserLiquidity();
        let apySummary: ApySummaryResponse | null = null;
        const walletLower = (address || '').toLowerCase();
        if (walletLower) {
          try {
            apySummary = await api.getApySummary(walletLower);
          } catch {}
        }
        if (liq?.success) {
          const incoming = liq.byChain || [];
          const merged = CHAINS.map((chain: string) => {
            const found = incoming.find((x: { chain: string; amountUsd: number }) => x.chain === chain);
            return { chain, amountUsd: found?.amountUsd || 0 };
          });
          setByChain(merged);
          setTotal(liq.totalUsd || 0);
          setPositions(mapIncomingPositions(liq.positions));
          setChainContracts(liq.chainContracts || {});
        }
        setApy(apySummary);
        if (liq?.success) {
          setHasLoaded(true);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    };
    const handler = () => { void refresh(); };
    window.addEventListener('helios:liquidity-refresh', handler);
    return () => window.removeEventListener('helios:liquidity-refresh', handler);
  }, []);

  const positionsByChain = useMemo(() => {
    const grouped: Record<string, { totalUsd: number; items: LiquidityPosition[] }> = {};
    for (const p of positions) {
      if (!grouped[p.chain]) {
        grouped[p.chain] = { totalUsd: 0, items: [] };
      }
      grouped[p.chain].totalUsd += p.amountUsd;

      // Merge positions with the same asset within a chain
      const existingIndex = grouped[p.chain].items.findIndex(i => i.asset === p.asset);
      if (existingIndex >= 0) {
        const existing = grouped[p.chain].items[existingIndex];
        grouped[p.chain].items[existingIndex] = {
          ...existing,
          amount: (existing.amount || 0) + (p.amount || 0),
          amountUsd: existing.amountUsd + p.amountUsd,
        };
      } else {
        grouped[p.chain].items.push({
          id: `${p.chain}-${p.asset}`,
          chain: p.chain,
          asset: p.asset,
          amount: p.amount,
          amountUsd: p.amountUsd,
        });
      }
    }
    // Sort items within each chain by USD desc for nicer display
    Object.values(grouped).forEach(g => g.items.sort((a, b) => b.amountUsd - a.amountUsd));
    return grouped;
  }, [positions]);

  const toggleChain = (chain: string) =>
    setExpanded(prev => ({ ...prev, [chain]: !prev[chain] }));

  // Rewards calculations
  const eligibleUsd = apy?.eligibleUsd ?? Math.min(total, 50000);
  const remainderUsd = apy?.remainderUsd ?? Math.max(0, total - 50000);
  const dailyRewardsHls = apy?.estimatedDailyHls ?? 0;
  const dailyRewardsUsd = apy?.estimatedDailyUsd ?? 0;
  const blendedApy = apy?.blendedApy ?? 0;
  const eligiblePercent = total > 0 ? Math.min(100, ((apy?.eligibleUsd ?? eligibleUsd) / total) * 100) : 0;

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
  const claimableUsd = (apy?.claimableUsd ?? 0) + 0 * claimableHls;
  const boostedApyPct = (apy ? Math.min((apy.rawUsd * (apy.multiplier ?? 1)), (apy.boostCapUsd ?? 50000)) / Math.max(1, apy.rawUsd) * (apy.targetApy ?? 0) * 100 : 0);
  const baseApyPct = (apy?.targetApy ?? 0) * 100;
  const effectiveApyPct = (blendedApy * 100);
  const hourlyRewardsHls = (dailyRewardsHls || 0) / 24;
  const hourlyRewardsUsd = (dailyRewardsUsd || 0) / 24;

  // Check if user has multiplier bonus but no deposits - show incentive banner
  const hasMultiplierBonus = (apy?.multiplier ?? 1) > 1.05; // > 5% bonus
  const hasNoDeposits = total <= 0;
  const shouldShowIncentiveBanner = hasMultiplierBonus && hasNoDeposits;

  // Derive clear APY values for banner
  const userMultiplier = apy?.multiplier ?? 1;
  const baseApy = apy?.targetApy ?? 0.20;
  const bonusApyPct = Math.max(0, (userMultiplier - 1) * baseApy * 100); // additional APY over base
  const boostedApyPctHeadline = userMultiplier * baseApy * 100; // total APY on first cap

  // Example calculator helpers (match backend distributor formula)
  const capUsd = apy?.boostCapUsd ?? 50000;
  const effectiveFor = (amount: number) => Math.min(amount * userMultiplier, capUsd) + Math.max(0, amount - capUsd);
  const yearlyFor = (amount: number) => effectiveFor(amount) * baseApy;
  const ex100Eff = effectiveFor(100);
  const ex500Eff = effectiveFor(500);
  const ex1000Eff = effectiveFor(1000);
  const ex100Year = yearlyFor(100);
  const ex500Year = yearlyFor(500);
  const ex1000Year = yearlyFor(1000);

  return (
    loading && !hasLoaded ? (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-xl p-4 border border-white/50"
      >
        <div className="flex items-center justify-center h-32 text-[#828DB3]">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-sm">Loading your liquidity…</span>
        </div>
      </motion.div>
    ) : (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-xl p-4 border border-white/50"
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
                      <img 
                        src={getTokenIconUrl(item.asset)} 
                        alt={item.asset} 
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => {
                          try {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('/images/helios-icon.svg')) {
                              target.src = '/images/helios-icon.svg';
                            }
                          } catch {}
                        }}
                      />
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
                    {chainContracts[chain]?.address ? (
                      <a
                        href={chainContracts[chain]?.explorer || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#002DCB] hover:underline"
                        title={chainContracts[chain]?.address}
                      >
                        {shortenAddress(chainContracts[chain]?.address || '')}
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

      {/* 🎯 INCENTIVE BANNER: Show when user has multiplier but no deposits */}
      {shouldShowIncentiveBanner && (
        <div className="mt-4 rounded-2xl bg-gradient-to-t from-[#F0F4FF] to-white border border-[#E2EBFF] p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#002DCB] text-white flex items-center justify-center text-xs font-bold">XP</div>
                <div className="text-sm font-semibold text-[#060F32]">Your +{bonusApyPct.toFixed(1)}% APY bonus is ready</div>
                <div className="px-2 py-0.5 rounded-full bg-[#002DCB]/10 text-[#002DCB] text-[11px] font-semibold border border-[#002DCB]/20">Total {boostedApyPctHeadline.toFixed(1)}% APY</div>
              </div>
              <div className="mt-2 text-[12px] text-[#5C6584] leading-relaxed">
                Thanks to your activity in the <span className="font-semibold text-[#060F32]">current season</span> and <span className="font-semibold text-[#060F32]">past seasons</span>, your deposits earn a boosted APY on your first {formatCurrency(capUsd)}.
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-white border border-[#E2EBFF] p-3">
                  <div className="text-[#5C6584]">If you deposit $100</div>
                  <div className="mt-1 font-bold text-[#060F32]">≈ {formatCurrency(ex100Eff)} effective</div>
                  <div className="text-[#5C6584] mt-0.5">~{formatCurrency(ex100Year)} / year</div>
                </div>
                <div className="rounded-lg bg-white border border-[#E2EBFF] p-3">
                  <div className="text-[#5C6584]">If you deposit $500</div>
                  <div className="mt-1 font-bold text-[#060F32]">≈ {formatCurrency(ex500Eff)} effective</div>
                  <div className="text-[#5C6584] mt-0.5">~{formatCurrency(ex500Year)} / year</div>
                </div>
                <div className="rounded-lg bg-white border border-[#E2EBFF] p-3">
                  <div className="text-[#5C6584]">If you deposit $1,000</div>
                  <div className="mt-1 font-bold text-[#060F32]">≈ {formatCurrency(ex1000Eff)} effective</div>
                  <div className="text-[#5C6584] mt-0.5">~{formatCurrency(ex1000Year)} / year</div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              <div className="rounded-xl bg-white border border-[#E2EBFF] p-4 text-center">
                <div className="text-[11px] text-[#5C6584]">Your Multiplier</div>
                <div className="text-3xl font-extrabold text-[#002DCB]">x{userMultiplier.toFixed(2)}</div>
                <div className="text-[11px] text-[#5C6584] mt-1">Applies to first {formatCurrency(capUsd)}</div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('helios:open-bridge'))}
                  className="mt-3 w-full bg-[#002DCB] hover:bg-[#0045FF] text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Bridge now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards summary - enhanced */}
      <div className="mt-4 rounded-2xl bg-white border border-[#E2EBFF] p-5 shadow-sm space-y-4">
        {/* Top row: Accrued + Estimated earnings */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="text-xs text-[#5C6584]">Accrued HLS (claimable after TGE)</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#060F32]">
              {(apy?.claimableHls ?? claimableHls).toLocaleString(undefined, { maximumFractionDigits: 3 })} HLS
            </div>
            <div className="text-sm text-[#828DB3] mt-1">
              {formatCurrency(claimableUsd)} estimated <span className="opacity-60">(based on ${(apy?.hlsPriceUsd ?? 0.02).toFixed(2)}/HLS)</span>
            </div>
            <div className="text-sm text-[#828DB3] mt-1">
              Estimated Daily HLS · {dailyRewardsHls.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({formatCurrency(dailyRewardsUsd)})
            </div>
            <div className="text-[11px] text-[#A0A9C3] mt-0.5">Hourly ≈ {hourlyRewardsHls.toLocaleString(undefined, { maximumFractionDigits: 2 })} HLS ({formatCurrency(hourlyRewardsUsd)})</div>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[220px]">
            <div className="px-3 py-1.5 rounded-lg bg-[#F5F7FF] border border-[#E2EBFF] text-sm font-semibold text-[#002DCB]" title="Weighted average between boosted and unboosted liquidity">
              Effective (Blended) APY {(effectiveApyPct).toFixed(1)}%
            </div>
            <div className="text-xs text-[#5C6584]">Base APY: {(baseApyPct).toFixed(1)}%</div>
          </div>
        </div>

        {/* Middle: Dual-tier eligibility bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#5C6584] mb-1">
            <span>Eligible ({formatCurrency(eligibleUsd)})</span>
            <span>Remainder ({formatCurrency(remainderUsd)})</span>
          </div>
          <div className="h-3 rounded-full bg-[#EEF2FF] overflow-hidden flex">
            <div
              className="h-3 bg-gradient-to-r from-[#002DCB] to-[#4A6CF7]"
              style={{ width: `${eligiblePercent}%` }}
              title={`Eligible ${formatCurrency(eligibleUsd)} @ ${(boostedApyPct).toFixed(1)}% APY`}
            />
            <div
              className="h-3 bg-[#D9E2FF]"
              style={{ width: `${Math.max(0, 100 - eligiblePercent)}%` }}
              title={`Remainder ${formatCurrency(remainderUsd)} @ ${(baseApyPct).toFixed(1)}% APY`}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#5C6584]">
            <span>Eligible ({formatCurrency(eligibleUsd)} @ {(boostedApyPct).toFixed(1)}% APY)</span>
            <span>Remainder ({formatCurrency(remainderUsd)} @ {(baseApyPct).toFixed(1)}% APY)</span>
          </div>
          <div className="mt-2 text-[11px] text-[#5C6584]">
            XP applies up to {formatCurrency(apy?.boostCapUsd ?? 50000)} liquidity. Liquidity above cap earns base {(baseApyPct).toFixed(0)}% APY.
          </div>
        </div>

        {/* Bottom: XP multiplier breakdown and bonuses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#E2EBFF] bg-[#F9FAFF] p-4">
              <div className="text-xs text-[#5C6584] mb-2">Multiplier Breakdown</div>
              <div className="flex flex-wrap gap-2">
                <div className="px-2.5 py-1 rounded-md bg-white border border-[#E2EBFF] text-xs" title="Base multiplier applied to all liquidity">Base: x1.00</div>
                <div className="px-2.5 py-1 rounded-md bg-white border border-[#E2EBFF] text-xs" title="Your current XP-derived multiplier">
                  Current XP Multiplier: x{(apy?.multiplier ?? 1).toFixed(2)}
                </div>
                <div className="px-2.5 py-1 rounded-md bg-white border border-[#E2EBFF] text-xs" title="Overall multiplier after combining factors">
                  Effective Multiplier: x{(apy?.multiplier ?? 1).toFixed(2)}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#5C6584]">XP applies up to {formatCurrency(apy?.boostCapUsd ?? 50000)}.</div>
            </div>

            <div className="mt-3 rounded-xl border border-[#E2EBFF] bg-white p-4">
              <button className="w-full text-left text-xs text-[#5C6584] flex items-center justify-between" onClick={() => setShowBonuses(v => !v)}>
                <span>Seasonal Bonuses</span>
                <span className="text-[#002DCB]">{showBonuses ? 'Hide' : 'Show'}</span>
              </button>
              {showBonuses && (
                <div className="mt-2 text-[12px] text-[#060F32] space-y-1">
                  <div className="flex items-center justify-between"><span>Base Liquidity APY</span><span className="font-semibold">{(baseApyPct).toFixed(0)}%</span></div>
                  <div className="flex items-center justify-between"><span>Current XP Multiplier</span><span className="font-semibold">x{(apy?.multiplier ?? 1).toFixed(2)}</span></div>
                  <div className="text-[11px] text-[#5C6584]">More seasonal bonuses may be displayed here when available.</div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-[#E2EBFF] bg-[#F5F7FF] p-4">
              <div className="text-xs text-[#5C6584] mb-1">APY Summary</div>
              <div className="flex items-center justify-between text-sm">
                <span>Boosted APY</span>
                <span className="font-semibold">{(boostedApyPct).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Base APY</span>
                <span className="font-semibold">{(baseApyPct).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Effective (Blended) APY</span>
                <span className="font-semibold">{(effectiveApyPct).toFixed(1)}%</span>
              </div>
              <div className="mt-2 text-[11px] text-[#5C6584]" title="Weighted by eligible vs remainder liquidity">
                Blended APY is a weighted average between boosted and unboosted tiers.
              </div>
            </div>
            <div className="mt-3 text-[11px] text-[#5C6584]">
              Liquidity above {formatCurrency(apy?.boostCapUsd ?? 50000)} earns base {(baseApyPct).toFixed(0)}% APY. Learn about multipliers in the <a className="text-[#002DCB] underline" href="#">season XP guide</a>.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    )
  );
};

export default StakedSummaryBar;
