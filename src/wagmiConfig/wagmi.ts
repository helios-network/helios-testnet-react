import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { 
  mainnet, 
  sepolia, 
  bsc, 
  bscTestnet,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy
} from "@reown/appkit/networks";
import { cookieStorage, createStorage } from "@wagmi/core";
import { defineChain } from "viem";
import { HELIOS_NETWORK_ID, RPC_URL } from "./app";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Define the custom Helios chain
export const heliosChain = defineChain({
  id: HELIOS_NETWORK_ID,
  name: "Helios",
  network: "helios",
  nativeCurrency: {
    decimals: 18,
    name: "HELIOS",
    symbol: "HELIOS",
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Helios Explorer",
      url: "https://explorer.helioschainlabs.org/",
    },
  },
});

// // Convert the Helios chain to AppKitNetwork format
// const heliosAppKitNetwork = {
//   id: heliosChain.id,
//   name: heliosChain.name,
//   chainNamespace: "eip155",
//   caipNetworkId: `eip155:${heliosChain.id}`,
//   nativeCurrency: heliosChain.nativeCurrency,
//   rpcUrls: heliosChain.rpcUrls,
//   blockExplorers: heliosChain.blockExplorers
// };

// Include all major networks for easy switching
export const networks = [
  heliosChain, 
  mainnet, 
  sepolia,
  bsc,
  bscTestnet,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
