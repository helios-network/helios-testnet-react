"use client";

import React, { useState } from "react";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./NetworkSwitcher.module.scss";

type NetworkConfig = {
  id: number;
  name: string;
  shortName: string;
  icon: string;
  category: 'mainnet' | 'testnet';
  color: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

const NETWORKS: NetworkConfig[] = [
  // Helios
  {
    id: 42000,
    name: "Helios",
    shortName: "Helios",
    icon: "/images/logo.png",
    category: 'mainnet',
    color: "#002DCB",
    rpcUrls: ["https://testnet1.helioschainlabs.org/"],
    blockExplorerUrls: ["https://explorer.helioschainlabs.org/"],
    nativeCurrency: { name: "Helios", symbol: "HLS", decimals: 18 }
  },
  // Ethereum
  {
    id: 1,
    name: "Ethereum",
    shortName: "Ethereum",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    category: 'mainnet',
    color: "#627EEA",
    rpcUrls: ["https://cloudflare-eth.com", "https://ethereum.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  {
    id: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    category: 'testnet',
    color: "#627EEA",
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 }
  },
  // BNB Chain
  {
    id: 56,
    name: "BNB Chain",
    shortName: "BNB",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
    category: 'mainnet',
    color: "#F3BA2F",
    rpcUrls: [
      "https://bsc-dataseed1.bnbchain.org",
      "https://bsc-dataseed.binance.org",
      "https://bsc.publicnode.com"
    ],
    blockExplorerUrls: ["https://bscscan.com"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }
  },
  {
    id: 97,
    name: "BNB Testnet",
    shortName: "BNB Test",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
    category: 'testnet',
    color: "#F3BA2F",
    rpcUrls: [
      "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      "https://bsc-testnet.publicnode.com"
    ],
    blockExplorerUrls: ["https://testnet.bscscan.com"],
    nativeCurrency: { name: "BNB", symbol: "tBNB", decimals: 18 }
  },
  // Arbitrum
  {
    id: 42161,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    category: 'mainnet',
    color: "#28A0F0",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    category: 'testnet',
    color: "#28A0F0",
    rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  // Base
  {
    id: 8453,
    name: "Base",
    shortName: "Base",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
    category: 'mainnet',
    color: "#0052FF",
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  {
    id: 84532,
    name: "Base Sepolia",
    shortName: "Base Test",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
    category: 'testnet',
    color: "#0052FF",
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  // Optimism
  {
    id: 10,
    name: "Optimism",
    shortName: "Optimism",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    category: 'mainnet',
    color: "#FF0420",
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  {
    id: 11155420,
    name: "Optimism Sepolia",
    shortName: "OP Sepolia",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    category: 'testnet',
    color: "#FF0420",
    rpcUrls: ["https://sepolia.optimism.io"],
    blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  // Polygon
  {
    id: 137,
    name: "Polygon",
    shortName: "Polygon",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    category: 'mainnet',
    color: "#8247E5",
    rpcUrls: ["https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  },
  {
    id: 80002,
    name: "Polygon Amoy",
    shortName: "Amoy",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    category: 'testnet',
    color: "#8247E5",
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://www.oklink.com/amoy"],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  },
];

export default function NetworkSwitcher() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mainnet' | 'testnet'>('mainnet');
  const [switching, setSwitching] = useState(false);

  const currentNetwork = NETWORKS.find(n => n.id === chainId);

  const filteredNetworks = NETWORKS.filter(n => 
    filter === 'all' ? true : n.category === filter
  );

  const handleSwitchNetwork = async (network: NetworkConfig) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (chainId === network.id) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      // Prefer using the wallet to switch to existing networks first
      const ethereum = (window as any).ethereum;
      const chainIdHex = `0x${network.id.toString(16)}`;

      if (ethereum && ethereum.request) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          setIsOpen(false);
          return;
        } catch (switchError: any) {
          // 4902: Unrecognized chain - proceed to add
          if (switchError?.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: chainIdHex,
                    chainName: network.name,
                    nativeCurrency: network.nativeCurrency,
                    rpcUrls: network.rpcUrls,
                    blockExplorerUrls: network.blockExplorerUrls,
                  },
                ],
              });
              setIsOpen(false);
              return;
            } catch (addError) {
              console.error('Error adding network:', addError);
              // Fall through to wagmi as a last resort
            }
          } else {
            console.log('wallet_switchEthereumChain failed, trying wagmi:', switchError);
          }
        }
      }

      // Last resort: wagmi switch (will also trigger add in some wallets)
      if (switchChain) {
        await switchChain({ chainId: network.id });
        setIsOpen(false);
        return;
      }
    } catch (error) {
      console.error('Network switch error:', error);
    } finally {
      setSwitching(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={styles.networkSwitcher}>
      <button
        className={styles.triggerButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.currentNetwork}>
          {currentNetwork ? (
            <>
              <img 
                src={currentNetwork.icon} 
                alt={currentNetwork.name}
                className={styles.networkIcon}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logo.png';
                }}
              />
              <span className={styles.networkName}>{currentNetwork.shortName}</span>
            </>
          ) : (
            <>
              <div className={styles.unknownIcon}>?</div>
              <span className={styles.networkName}>Unknown</span>
            </>
          )}
          <svg 
            className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.header}>
                <h3 className={styles.title}>Switch Network</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setIsOpen(false)}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className={styles.filters}>
                <button
                  className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All Networks
                </button>
                <button
                  className={`${styles.filterButton} ${filter === 'mainnet' ? styles.active : ''}`}
                  onClick={() => setFilter('mainnet')}
                >
                  Mainnet
                </button>
                <button
                  className={`${styles.filterButton} ${filter === 'testnet' ? styles.active : ''}`}
                  onClick={() => setFilter('testnet')}
                >
                  Testnet
                </button>
              </div>

              <div className={styles.networkList}>
                {filteredNetworks.map((network) => (
                  <button
                    key={network.id}
                    className={`${styles.networkItem} ${chainId === network.id ? styles.active : ''}`}
                    onClick={() => handleSwitchNetwork(network)}
                    disabled={switching || chainId === network.id}
                    style={{ 
                      borderLeft: chainId === network.id ? `4px solid ${network.color}` : '4px solid transparent' 
                    }}
                  >
                    <img 
                      src={network.icon} 
                      alt={network.name}
                      className={styles.networkIcon}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/helios-icon.svg';
                      }}
                    />
                    <div className={styles.networkInfo}>
                      <div className={styles.networkNameRow}>
                        <span className={styles.networkLabel}>{network.name}</span>
                        {network.category === 'testnet' && (
                          <span className={styles.testnetBadge}>Testnet</span>
                        )}
                      </div>
                      <span className={styles.networkSymbol}>{network.nativeCurrency.symbol}</span>
                    </div>
                    {chainId === network.id && (
                      <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {switching && (
                <div className={styles.switchingOverlay}>
                  <svg className={styles.spinner} viewBox="0 0 24 24">
                    <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Switching network...</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

