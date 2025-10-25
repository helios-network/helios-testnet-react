// Mock data for now - in production, this would fetch from real APIs
export interface INetworkMetrics {
  totalTVL: number;
  highestAPY: number;
  activeMarkets: number;
  totalUsers: number;
  hlsPrice: number;
  tvlGrowth24h: number;
  tvlGrowth7d: number;
}

export interface AssetData {
  symbol: string;
  name: string;
  logo: string;
  chain: string;
  tvl: number;
  futureAPY: string;
  price: number;
  change24h: number;
}

export interface ChainData {
  name: string;
  logo: string;
  tvl: number;
  assets: number;
  status: 'active' | 'coming-soon';
}

// Mock data - replace with real API calls
export const mockNetworkMetrics: INetworkMetrics = {
  totalTVL: 31030000, // $31.03M
  highestAPY: 22, // 22%
  activeMarkets: 5,
  totalUsers: 1247,
  hlsPrice: 0.15,
  tvlGrowth24h: 12.5,
  tvlGrowth7d: 45.2
};

export const mockAssetData: AssetData[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: '/images/tokens/eth.svg',
    chain: 'Ethereum',
    tvl: 12500000,
    futureAPY: '18%',
    price: 2450.50,
    change24h: 2.3
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    logo: '/images/tokens/bnb.svg',
    chain: 'BNB Chain',
    tvl: 8500000,
    futureAPY: '20%',
    price: 315.20,
    change24h: 1.8
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    logo: '/images/tokens/matic.svg',
    chain: 'Polygon',
    tvl: 6200000,
    futureAPY: '16%',
    price: 0.85,
    change24h: -0.5
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '/images/tokens/usdc.svg',
    chain: 'Multi-chain',
    tvl: 2800000,
    futureAPY: '12%',
    price: 1.00,
    change24h: 0.1
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    logo: '/images/tokens/usdt.svg',
    chain: 'Multi-chain',
    tvl: 2100000,
    futureAPY: '12%',
    price: 1.00,
    change24h: 0.0
  }
];

export const mockChainData: ChainData[] = [
  {
    name: 'Ethereum',
    logo: '/images/chains/ethereum.svg',
    tvl: 12500000,
    assets: 3,
    status: 'active'
  },
  {
    name: 'BNB Chain',
    logo: '/images/chains/bnb.svg',
    tvl: 8500000,
    assets: 2,
    status: 'active'
  },
  {
    name: 'Polygon',
    logo: '/images/chains/polygon.svg',
    tvl: 6200000,
    assets: 2,
    status: 'active'
  },
  {
    name: 'Arbitrum',
    logo: '/images/chains/arbitrum.svg',
    tvl: 2300000,
    assets: 1,
    status: 'active'
  },
  {
    name: 'Optimism',
    logo: '/images/chains/optimism.svg',
    tvl: 1800000,
    assets: 1,
    status: 'active'
  },
  {
    name: 'Base',
    logo: '/images/chains/base.svg',
    tvl: 3200000,
    assets: 1,
    status: 'active'
  }
];

export const mockTVLHistory = [
  { date: '2024-01-01', tvl: 5000000 },
  { date: '2024-01-07', tvl: 7500000 },
  { date: '2024-01-14', tvl: 12000000 },
  { date: '2024-01-21', tvl: 18000000 },
  { date: '2024-01-28', tvl: 25000000 },
  { date: '2024-02-04', tvl: 31000000 }
];

// Backend API base
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Map chainId (mainnets + testnets) to the canonical family names used in UI
const familyFromChainId = (chainId?: number): string | null => {
  switch (chainId) {
    // Ethereum mainnet + Sepolia
    case 1:
    case 11155111:
      return 'Ethereum';
    // BNB Chain mainnet + Testnet
    case 56:
    case 97:
      return 'BNB Chain';
    // Polygon mainnet + Amoy
    case 137:
    case 80002:
      return 'Polygon';
    // Arbitrum mainnet + Sepolia
    case 42161:
    case 421614:
      return 'Arbitrum';
    // Optimism mainnet + Sepolia
    case 10:
    case 11155420:
      return 'Optimism';
    // Base mainnet + Sepolia
    case 8453:
    case 84532:
      return 'Base';
    default:
      return null;
  }
};

const CANONICAL_CHAIN_LOGOS: Record<string, string> = {
  'Ethereum': '/images/chains/ethereum.svg',
  'BNB Chain': '/images/chains/bnb.svg',
  'Polygon': '/images/chains/polygon.svg',
  'Arbitrum': '/images/chains/arbitrum.svg',
  'Optimism': '/images/chains/optimism.svg',
  'Base': '/images/chains/base.svg'
};

// API functions
export const fetchNetworkMetrics = async (): Promise<INetworkMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockNetworkMetrics;
};

export const fetchAssetData = async (): Promise<AssetData[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockAssetData;
};

export const fetchChainData = async (): Promise<ChainData[]> => {
  try {
    const res = await fetch(`${API_URL}/metrics/tvl/chains`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
    const items: Array<{ chainId: number; chainName?: string; tvlUsd: number }> = json.data || [];
    const grouped = new Map<string, number>();
    for (const it of items) {
      const family = familyFromChainId(it.chainId) || (it.chainName || '').split(' ')[0];
      if (!family) continue;
      grouped.set(family, (grouped.get(family) || 0) + (it.tvlUsd || 0));
    }
    const result: ChainData[] = Array.from(grouped.entries()).map(([name, tvl]) => ({
      name,
      logo: CANONICAL_CHAIN_LOGOS[name] || '/images/chains/ethereum.svg',
      tvl,
      assets: 0,
      status: 'active'
    }));
    return result;
  } catch {
    // fallback to mock on error
    return mockChainData;
  }
};

export const fetchTVLHistory = async (days: number = 7): Promise<typeof mockTVLHistory> => {
  try {
    // Default to last 7 days for better granularity
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromISO = fromDate.toISOString();
    // Request more data points to ensure full coverage (5-min snapshots: 7d=~2016, 1d=~288)
    const limit = days === 1 ? 500 : 3000;
    const res = await fetch(`${API_URL}/metrics/tvl/history?from=${fromISO}&limit=${limit}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
    const items: Array<{ date?: string; tvl?: number; timestamp?: string; totalUsd?: number }> = json.data || [];
    const normalized = items.map((i) => ({
      date: (i.date || i.timestamp) as string,
      tvl: (i.tvl != null ? i.tvl : (i.totalUsd as number))
    }));
    return normalized.length ? normalized : mockTVLHistory;
  } catch {
    return mockTVLHistory;
  }
};

// Utility functions
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Full currency formatting for precise center labels and tooltips
export const formatCurrencyFull = (value: number): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};
