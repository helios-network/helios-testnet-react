import { createConfig, http } from "wagmi";

const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_HELIOS_RPC ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8545'
    : 'https://testnet1.helioschainlabs.org/');

export const heliosTestnet = {
  id: 42000,
  name: "Helios Testnet",
  network: "helios-testnet",
  nativeCurrency: {
    name: "Helios",
    symbol: "HLS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [DEFAULT_RPC],
    },
    public: {
      http: [DEFAULT_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: "Helios Explorer",
      url: "https://explorer.helioschainlabs.org/",
    },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [heliosTestnet],
  transports: {
    [heliosTestnet.id]: http(DEFAULT_RPC),
  },
});
