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
    tvl: 0,
    assets: 0,
    status: 'coming-soon'
  },
  {
    name: 'Optimism',
    logo: '/images/chains/optimism.svg',
    tvl: 0,
    assets: 0,
    status: 'coming-soon'
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
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockChainData;
};

export const fetchTVLHistory = async (): Promise<typeof mockTVLHistory> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockTVLHistory;
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

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};
