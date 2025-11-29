// Wrapper contract addresses for each chain
export const WRAPPER_CONTRACTS: Record<number, { address: string; nativeSymbol: string; wrappedSymbol: string }> = {
  1: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', nativeSymbol: 'ETH', wrappedSymbol: 'WETH' },
  56: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', nativeSymbol: 'BNB', wrappedSymbol: 'WBNB' },
  137: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', nativeSymbol: 'POL', wrappedSymbol: 'WPOL' },
  42161: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBaB1', nativeSymbol: 'ETH', wrappedSymbol: 'WETH' },
  10: { address: '0x4200000000000000000000000000000000000006', nativeSymbol: 'ETH', wrappedSymbol: 'WETH' },
  8453: { address: '0x4200000000000000000000000000000000000006', nativeSymbol: 'ETH', wrappedSymbol: 'WETH' },
  // Testnets
  11155111: { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', nativeSymbol: 'ETH', wrappedSymbol: 'WETH' },
  97: { address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', nativeSymbol: 'BNB', wrappedSymbol: 'WtBNB' },
};

export function getWrapperConfig(chainId: number) {
  return WRAPPER_CONTRACTS[chainId] || null;
}

