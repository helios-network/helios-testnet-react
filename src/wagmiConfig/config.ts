import { createConfig, http } from "wagmi";

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
      http: ["https://testnet1.helioschainlabs.org/"],
    },
    public: {
      http: ["https://testnet1.helioschainlabs.org/"],
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
    [heliosTestnet.id]: http(),
  },
});
