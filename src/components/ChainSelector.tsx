import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle,
  ExternalLink,
  Zap
} from "lucide-react";
import { toast } from "react-toastify";
import { prepareBridge, checkStatus, getAssets } from "@/services/bridgeApi";
import { useAccount, useBalance, useChainId } from "wagmi";
import { ethers } from "ethers";

interface Chain {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  supportedAssets: string[];
  bridgeFee: string;
  estimatedTime: string;
}

const SUPPORTED_CHAINS: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-xs">E</div>,
    description: "Bridge from Ethereum mainnet",
    supportedAssets: ["ETH", "USDC", "USDT", "WETH"],
    bridgeFee: "0.001 ETH",
    estimatedTime: "5-10 minutes"
  },
  {
    id: "bnb",
    name: "BNB Chain",
    icon: <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">B</div>,
    description: "Bridge from BNB Smart Chain",
    supportedAssets: ["BNB", "USDC", "USDT", "BUSD"],
    bridgeFee: "0.001 BNB",
    estimatedTime: "3-5 minutes"
  },
  {
    id: "polygon",
    name: "Polygon",
    icon: <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">P</div>,
    description: "Bridge from Polygon network",
    supportedAssets: ["MATIC", "USDC", "USDT", "WMATIC"],
    bridgeFee: "0.1 MATIC",
    estimatedTime: "2-3 minutes"
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">A</div>,
    description: "Bridge from Arbitrum One",
    supportedAssets: ["ETH", "USDC", "USDT", "ARB"],
    bridgeFee: "0.0001 ETH",
    estimatedTime: "3-5 minutes"
  },
  {
    id: "optimism",
    name: "Optimism",
    icon: <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">O</div>,
    description: "Bridge from Optimism",
    supportedAssets: ["ETH", "USDC", "USDT", "OP"],
    bridgeFee: "0.0001 ETH",
    estimatedTime: "3-5 minutes"
  },
  {
    id: "base",
    name: "Base",
    icon: <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">B</div>,
    description: "Bridge from Base",
    supportedAssets: ["ETH", "USDC"],
    bridgeFee: "0.0001 ETH",
    estimatedTime: "3-5 minutes"
  }
];

interface ChainSelectorProps {
  onChainSelect?: (chain: Chain) => void;
  selectedChain?: Chain;
  onComplete?: () => void;
  onSubmitted?: () => void; // called once the final deposit tx is submitted
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ onChainSelect, selectedChain: selectedChainProp, onComplete, onSubmitted }) => {
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>(selectedChainProp as Chain | undefined);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferPhase, setTransferPhase] = useState<
    'idle' | 'wrapping' | 'approving' | 'sending' | 'submitted' | 'waiting' | 'confirmed' | 'error'
  >('idle');
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  // Guards to avoid duplicate polling/render flicker
  const isMountedRef = useRef<boolean>(false);
  const pollingActiveRef = useRef<boolean>(false);
  const pollTimeoutRef = useRef<any>(null);
  const hasRestoredRef = useRef<boolean>(false);

  // Warn user if they try to leave during a transfer
  useEffect(() => {
    isMountedRef.current = true;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTransferring && transferPhase !== 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      isMountedRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      pollingActiveRef.current = false;
    };
  }, [isTransferring, transferPhase]);
  const isChoosingChain = !selectedChain;

  // Sync internal selectedChain when parent prop changes
  useEffect(() => {
    if (selectedChainProp && (!selectedChain || selectedChain.id !== (selectedChainProp as Chain).id)) {
      setSelectedChain(selectedChainProp as Chain);
    }
    if (!selectedChainProp && selectedChain) {
      setSelectedChain(undefined);
    }
  }, [selectedChainProp]);

  // Chain and token icon helpers (TrustWallet / Spot icons)
  const CHAIN_ICON_URLS: Record<string, string> = {
    'Ethereum': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    'BNB Chain': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    'Arbitrum': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    'Base': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
    'Optimism': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    'Polygon': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  };
  const TOKEN_ICON_BASE = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color';
  const TOKEN_SYMBOL_OVERRIDES: Record<string, string> = {
    'WETH': 'weth',
    'WBTC': 'wbtc',
    'USDT': 'usdt',
    'USDC': 'usdc',
    'DAI': 'dai',
    'ETH': 'eth',
    'BNB': 'bnb',
    'MATIC': 'matic',
    'ARB': 'arb',
    'OP': 'op',
  };
  const getTokenIconUrl = (symbol: string): string => {
    // For WETH, prefer ETH icon if WETH not present in Spot icons
    if (symbol?.toUpperCase() === 'WETH') return `${TOKEN_ICON_BASE}/eth.svg`;
    const key = TOKEN_SYMBOL_OVERRIDES[symbol?.toUpperCase() || ''] || symbol?.toLowerCase() || 'generic';
    return `${TOKEN_ICON_BASE}/${key}.svg`;
  };

  // Dynamic Hyperion address fetched from backend based on chainId
  const [hyperionAddress, setHyperionAddress] = useState<string>("");
  useEffect(() => {
    const fetchHyperion = async () => {
      if (selectedChain?.name === 'Ethereum') {
        try {
          const res = await getAssets(11155111);
          setHyperionAddress(res.hyperionContract || "");
        } catch {}
      } else {
        setHyperionAddress("");
      }
    };
    fetchHyperion();
  }, [selectedChain]);
  const shortenAddress = (addr: string): string => (addr && addr.length > 10 ? `${addr.slice(0,6)}...${addr.slice(-4)}` : addr || 'Coming soon');

  const handleSelectChain = (chain: Chain) => {
    setSelectedChain(chain);
    setSelectedToken("");
    setAmount("");
    setAcknowledged(false);
    if (onChainSelect) onChainSelect(chain);
  };

  const handleBackToChains = () => {
    setSelectedChain(undefined);
    setSelectedToken("");
    setAmount("");
    setAcknowledged(false);
  };

  const { address } = useAccount();
  const walletChainId = useChainId();

  // Keep selected chain in sync with wallet network
  useEffect(() => {
    if (!walletChainId) return;
    const chainIdMap: Record<number, string> = {
      // Mainnets
      1: 'ethereum',
      56: 'bnb',
      42161: 'arbitrum',
      8453: 'base',
      10: 'optimism',
      137: 'polygon',
      // Testnets
      11155111: 'ethereum', // Sepolia treated as Ethereum in UI
      97: 'bnb',
      421614: 'arbitrum',
      84532: 'base',
      11155420: 'optimism',
      80002: 'polygon',
    };
    const uiId = chainIdMap[Number(walletChainId)];
    if (!uiId) return;
    const uiChain = SUPPORTED_CHAINS.find(c => c.id === uiId);
    if (!uiChain) return;
    setSelectedChain(uiChain);
  }, [walletChainId]);

  // Fetch balance for selected token
  const { data: balanceData } = useBalance({
    address: address,
    token: selectedToken && selectedToken !== 'ETH' ? undefined : undefined, // Will handle ERC20 tokens separately
    chainId: selectedChain?.name === 'Ethereum' ? 11155111 : undefined,
  });

  const [tokenBalance, setTokenBalance] = useState<string>("0");

  // Fetch token balance when selectedToken changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !selectedToken || !selectedChain) {
        setTokenBalance("0");
        return;
      }
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        if (selectedToken === 'ETH') {
          // Native ETH balance
          const balance = await provider.getBalance(address);
          setTokenBalance(ethers.formatEther(balance));
        } else {
          // For ERC20 tokens, fetch from backend to get contract address
          try {
            const chainId = selectedChain.name === 'Ethereum' ? 11155111 : undefined;
            if (!chainId) {
              setTokenBalance("0");
              return;
            }
            
            const assetsResponse = await getAssets(chainId);
            const asset = assetsResponse.assets?.find(
              (a: any) => a.symbol.toUpperCase() === selectedToken.toUpperCase()
            );
            
            if (!asset || !asset.contractAddress) {
              setTokenBalance("0");
              return;
            }
            
            // ERC20 ABI for balanceOf
            const erc20Abi = [
              "function balanceOf(address owner) view returns (uint256)",
              "function decimals() view returns (uint8)"
            ];
            
            const contract = new ethers.Contract(asset.contractAddress, erc20Abi, provider);
            const balance = await contract.balanceOf(address);
            const decimals = asset.decimals || 18;
            setTokenBalance(ethers.formatUnits(balance, decimals));
          } catch (erc20Err) {
            console.error('Error fetching ERC20 balance:', erc20Err);
            setTokenBalance("0");
          }
        }
      } catch (err) {
        console.error('Error fetching balance:', err);
        setTokenBalance("0");
      }
    };
    fetchBalance();
  }, [address, selectedToken, selectedChain]);

  const handlePercentage = (percentage: number) => {
    if (!tokenBalance || tokenBalance === "0") {
      toast.info("Unable to fetch balance. Please enter amount manually.");
      return;
    }
    const balance = Number(tokenBalance);
    const amountToSet = (balance * percentage / 100).toFixed(6);
    setAmount(amountToSet);
  };

  const destinationBytes32 = useMemo(() => {
    // Must be 32 bytes; if a hex string without 0x and <64 nibbles, left-pad; if 0x-prefixed, strip then pad
    const raw = "0x882f8A95409C127f0dE7BA83b4Dfa0096C3D8D79"; // example provided (20 bytes)
    const hex = raw.startsWith('0x') ? raw.slice(2) : raw;
    const padded = hex.padStart(64, '0');
    return `0x${padded}`;
  }, []);

  const restorePendingFromCache = async () => {
    try {
      if (!address) return;
      if (hasRestoredRef.current || pollingActiveRef.current) return;
      const prefix = 'helios:deposit:';
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      const now = Date.now();
      const pending = keys
        .map(k => ({ key: k, rec: JSON.parse(localStorage.getItem(k) || '{}') }))
        // resume only solid submissions within the last 30 minutes
        .filter(x => x.rec
          && x.rec.sender?.toLowerCase() === address.toLowerCase()
          && x.rec.status === 'submitted'
          && x.rec.lastTxHash
          && (x.rec.createdAt && (now - x.rec.createdAt) < 30 * 60 * 1000)
        )
        .sort((a, b) => (b.rec.createdAt || 0) - (a.rec.createdAt || 0));
      if (pending.length > 0) {
        const { key, rec } = pending[0];
        setActiveDepositId(rec.depositId);
        // Move to waiting state once when resuming
        setTransferPhase((prev) => prev === 'waiting' ? prev : 'waiting');
        setIsTransferring(true);
        hasRestoredRef.current = true;
        pollingActiveRef.current = true;
        // Resume polling
        const { chainId, tokenSymbol, amount, destination, depositId: depId } = rec;
        const start = Date.now();
        const poll = async () => {
          try {
            const res = await checkStatus({ chainId, tokenSymbol, sender: address, amount, destination, depositId: depId });
            if (res.found) {
              const successRecord = { ...rec, status: 'success', txHash: res.deposit?.txHash };
              localStorage.setItem(key, JSON.stringify(successRecord));
              setTransferPhase('confirmed');
              setLastTxHash(res.deposit?.txHash || null);
              toast.success('Deposit confirmed on Helios.');
              if (onComplete) onComplete();
              pollingActiveRef.current = false;
              if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
              return;
            }
          } catch {}
          if (!isMountedRef.current) return;
          if (Date.now() - start < 15 * 60 * 1000 && pollingActiveRef.current) {
            pollTimeoutRef.current = setTimeout(poll, 5000);
          }
        };
        pollTimeoutRef.current = setTimeout(poll, 1000);
      }
    } catch {}
  };

  useEffect(() => {
    restorePendingFromCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleTransfer = async () => {
    if (!selectedChain || !selectedToken || !amount || Number(amount) <= 0) {
      toast.error("Please select a token and enter a valid amount.");
      return;
    }
    if (!acknowledged) {
      toast.info("Please review and acknowledge the transfer summary.");
      return;
    }
    if (!address) {
      toast.error("Connect your wallet first.");
      return;
    }
    setIsTransferring(true);
    setTransferPhase('idle');
    setLastError(null);
    try {
      const chainId = selectedChain.name === 'Ethereum' ? 11155111 : undefined;
      if (!chainId) {
        toast.error("Only Ethereum (Sepolia) supported for now.");
        return;
      }

      const symbol = selectedToken.toUpperCase();
      const depositId = `helios-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      setActiveDepositId(depositId);

      let prep;
      try {
        prep = await prepareBridge({
          chainId,
          tokenSymbol: symbol,
          amount: amount,
          destination: destinationBytes32,
          data: depositId
        });
      } catch (e: any) {
        setLastError(e?.message || 'Failed to prepare bridge');
        toast.error(e?.message || 'Failed to prepare bridge');
        setTransferPhase('error');
        setIsTransferring(false);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      // Ensure wallet is on Sepolia when bridging from Ethereum testnet
      try {
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== 11155111) {
          toast.info('Please switch your wallet to Sepolia network');
          const targetHex = '0xaa36a7'; // 11155111
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetHex }]
            });
            toast.success('Network switched to Sepolia');
          } catch (switchErr: any) {
            if (switchErr?.code === 4902) {
              toast.info('Adding Sepolia network to your wallet...');
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: targetHex,
                  chainName: 'Ethereum Sepolia',
                  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });
              toast.success('Sepolia network added successfully');
            } else {
              throw switchErr;
            }
          }
        }
      } catch (netErr: any) {
        if (netErr?.code === 4001) {
          toast.error('You declined the network switch. Please switch to Sepolia manually.');
          setIsTransferring(false);
          return;
        }
      }
      const signer = await provider.getSigner();

      // Initialize cache record early
      const key = `helios:deposit:${depositId}`;
      const record = {
        chainId,
        tokenSymbol: symbol,
        amount,
        sender: address,
        destination: destinationBytes32,
        depositId,
        createdAt: Date.now(),
        status: 'initiated'
      };
      localStorage.setItem(key, JSON.stringify(record));

      // Execute steps in order
      for (const step of prep.steps) {
        // Update phase for UX and persist phase early
        const phaseForStep = step.type === 'wrap' ? 'wrapping' : step.type === 'approve' ? 'approving' : step.type === 'send' ? 'sending' : 'idle';
        setTransferPhase(phaseForStep as any);
        const txRequest: any = {
          ...step.tx,
        };
        // Normalize populated tx for ethers v6 signer
        if (txRequest.from) delete txRequest.from;
        if (txRequest.gasLimit && !txRequest.gas) {
          txRequest.gas = txRequest.gasLimit;
          delete txRequest.gasLimit;
        }
        try {
          const tx = await signer.sendTransaction(txRequest);
          setLastTxHash(tx.hash);
          // persist progress
          try {
            const cur = JSON.parse(localStorage.getItem(key) || '{}');
            cur.status = step.type === 'send' ? 'submitted' : 'pending';
            cur.phase = phaseForStep;
            cur.lastTxHash = tx.hash;
            localStorage.setItem(key, JSON.stringify(cur));
            if (step.type === 'send') {
              try {
                const latest = JSON.parse(localStorage.getItem(key) || '{}');
                window.dispatchEvent(new CustomEvent('helios:deposit-updated', { detail: { key, record: latest } }));
              } catch {}
            }
          } catch {}
          if (step.type !== 'send') {
            // wait for confirmation for non-final steps
            await tx.wait();
          } else {
            // Final send step: do not keep modal open; notify and hand off to global banner
            setTransferPhase('submitted');
            toast.success('Transaction sent successfully');
            // Close modal (parent) and stop local UI spinner; banner will take over
            try {
              try {
                const latest = JSON.parse(localStorage.getItem(key) || '{}');
                window.dispatchEvent(new CustomEvent('helios:deposit-updated', { detail: { key, record: latest } }));
              } catch {}
              if (onSubmitted) onSubmitted();
            } finally {
              setIsTransferring(false);
            }
            return; // stop further handling in the modal
          }
        } catch (err: any) {
          setLastError(err?.message || 'Transaction failed');
          const msg = (err?.code === 4001 || /denied|rejected/i.test(err?.message))
            ? 'You declined the request in your wallet.'
            : (err?.message || 'Transaction failed');
          toast.error(msg);
          // persist error
          try {
            const cur = JSON.parse(localStorage.getItem(key) || '{}');
            cur.status = 'error';
            cur.error = err?.message || 'Transaction failed';
            localStorage.setItem(key, JSON.stringify(cur));
          } catch {}
          setTransferPhase('error');
          setIsTransferring(false);
          return;
        }
      }
      // For safety, keep UI active; finalization happens via polling
    } finally {
      // keep transferring state active until confirmed or error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#060F32] mb-1">
            {isChoosingChain ? "Choose Your Origin Chain" : `Deposit from ${selectedChain?.name}`}
          </h2>
          <p className="text-[#5C6584] max-w-2xl">
            {isChoosingChain ? (
              <>Select the blockchain where your assets are currently located. We'll help you bridge them to Helios.</>
            ) : (
              <>Select a token and amount to deposit. Deposits are recoverable and withdrawable back to the origin chain by December 1.</>
            )}
          </p>
        </div>
        {!isChoosingChain && (
          <button onClick={handleBackToChains} className="text-sm text-[#002DCB] hover:underline">← Back to chains</button>
        )}
      </div>

      {isChoosingChain ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUPPORTED_CHAINS.map((chain: Chain) => {
          const isSelected = (selectedChain as Chain | undefined)?.id === chain.id;
          const isHovered = hoveredChain === chain.id;
          
          return (
            <motion.div
              key={chain.id}
              className={`relative bg-white rounded-2xl shadow-sm border border-[#E2EBFF] p-6 cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? "ring-2 ring-[#002DCB] bg-[#F5F7FF]" 
                  : "hover:shadow-md hover:border-[#002DCB] hover:-translate-y-0.5"
              }`}
              onClick={() => handleSelectChain(chain)}
              onMouseEnter={() => setHoveredChain(chain.id)}
              onMouseLeave={() => setHoveredChain(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-[#002DCB]" />
                </div>
              )}

              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-white border border-[#E2EBFF] overflow-hidden`}>
                  <img
                    src={CHAIN_ICON_URLS[chain.name] || CHAIN_ICON_URLS['Ethereum']}
                    alt={chain.name}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#060F32]">{chain.name}</h3>
                  <p className="text-sm text-[#5C6584]">{chain.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#060F32] mb-2">Supported Assets</h4>
                  <div className="flex flex-wrap gap-2">
                    {chain.supportedAssets.map((asset) => (
                      <span 
                        key={asset}
                        className="px-2 py-1 bg-[#E2EBFF] text-[#002DCB] text-xs rounded-full"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#5C6584]">Network Fee:</span>
                    <p className="font-semibold text-[#060F32]">Gas only (no bridge fee)</p>
                  </div>
                  <div>
                    <span className="text-[#5C6584]">Est. Time:</span>
                    <p className="font-semibold text-[#060F32]">{chain.estimatedTime}</p>
                  </div>
                </div>
              </div>


              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 pt-4 border-t border-[#D7E0FF] space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-[#5C6584] mb-1">Token</label>
                      <select 
                        className="w-full px-3 py-2 border-2 border-[#E2EBFF] rounded-lg focus:outline-none focus:border-[#002DCB]"
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                      >
                        <option value="" disabled>Select token</option>
                        {chain.supportedAssets.map((asset) => (
                          <option key={asset} value={asset}>{asset}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#5C6584] mb-1">Amount</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border-2 border-[#E2EBFF] rounded-lg focus:outline-none focus:border-[#002DCB]"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#5C6584] mb-1">Deposit Contract</label>
                      <div className="px-3 py-2 bg-[#F9FAFF] border-2 border-[#E2EBFF] rounded-lg text-sm font-mono text-[#060F32] truncate">
                        {/* TODO: replace with chain-specific contract + explorer link */}
                        <a className="text-[#002DCB] hover:underline" href="#" onClick={(e) => e.preventDefault()}>0xHyperion-{chain.id}-contract</a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start md:items-center justify-between gap-3">
                    <span className="text-sm text-[#5C6584]">Deposits are recoverable and will be withdrawable back to the origin chain by December 1.</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleTransfer}
                        disabled={isTransferring}
                        className="bg-[#002DCB] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#0045FF] transition-colors flex items-center disabled:opacity-60"
                      >
            {isTransferring ? (
              transferPhase === 'approving' ? 'Approving...' :
              transferPhase === 'wrapping' ? 'Wrapping...' :
              transferPhase === 'sending' ? 'Sending...' :
              transferPhase === 'waiting' ? 'Waiting confirmation...' :
              'Transferring...'
            ) : 'Transfer to Helios'}
                        {!isTransferring && <ArrowRight className="w-4 h-4 ml-2" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#E2EBFF] p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E2EBFF] flex items-center justify-center mr-4 overflow-hidden">
              {selectedChain && (
                <img
                  src={CHAIN_ICON_URLS[selectedChain.name] || CHAIN_ICON_URLS['Ethereum']}
                  alt={selectedChain.name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    try { (e.target as any).src = '/images/helios-icon.svg'; } catch {}
                  }}
                />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#060F32]">{selectedChain?.name}</h3>
              <p className="text-sm text-[#5C6584]">{selectedChain?.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[#5C6584] mb-1">Token</label>
              <div className="flex flex-wrap gap-2">
                {selectedChain?.supportedAssets.map((asset) => (
                  <button
                    type="button"
                    key={asset}
                    onClick={() => setSelectedToken(asset)}
                    className={`px-2.5 py-1.5 rounded-md border text-sm flex items-center gap-1.5 ${
                      selectedToken === asset ? 'bg-[#F5F7FF] border-[#002DCB] text-[#060F32]' : 'bg-white border-[#E2EBFF] text-[#060F32] hover:bg-[#F9FAFF]'
                    }`}
                  >
                    <img src={getTokenIconUrl(asset)} alt={asset} className="w-4 h-4 object-contain" />
                    <span className="font-medium">{asset}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-[#5C6584]">Amount</label>
                {selectedToken && tokenBalance && Number(tokenBalance) > 0 && (
                  <span className="text-xs text-[#5C6584]">
                    Balance: <span className="font-semibold text-[#060F32]">{Number(tokenBalance).toFixed(4)} {selectedToken}</span>
                  </span>
                )}
              </div>
              <input 
                type="number"
                min="0"
                step="any"
                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                  amount && Number(amount) <= 0 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-[#E2EBFF] focus:border-[#002DCB]'
                }`}
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {selectedToken && Number(tokenBalance) > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentage(pct)}
                      className="px-2 py-0.5 text-xs rounded border border-[#E2EBFF] bg-white text-[#002DCB] hover:bg-[#F5F7FF] hover:border-[#002DCB] transition-colors font-medium"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}
              {amount && Number(amount) <= 0 && (
                <p className="text-xs text-red-600 mt-1">⚠ Amount must be greater than 0</p>
              )}
              {(!amount || Number(amount) > 0) && (
                <p className="text-xs text-[#5C6584] mt-1">Est. network fees apply on the origin chain. No bridge fee.</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[#5C6584] mb-1">Deposit Contract</label>
              <div className="px-3 py-2 bg-[#F9FAFF] border-2 border-[#E2EBFF] rounded-lg text-sm font-mono text-[#060F32] truncate">
                {selectedChain && hyperionAddress ? (
                  <a
                    className="text-[#002DCB] hover:underline"
                    href={`https://sepolia.etherscan.io/address/${hyperionAddress}`}
                    target="_blank" rel="noopener noreferrer"
                    title={hyperionAddress}
                  >
                    {shortenAddress(hyperionAddress)}
                  </a>
                ) : (
                  <span className="italic">Coming soon</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 p-4 rounded-lg border-2 border-[#002DCB]/20 bg-gradient-to-br from-[#F9FAFF] to-[#E2EBFF]/30">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#002DCB]">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-[#060F32] font-bold">Important Safety Information</div>
            </div>
            <ul className="space-y-1.5 text-xs text-[#060F32] mb-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>Your funds are safe:</strong> All deposits are tracked and recoverable. Withdrawals back to origin chain will be enabled closer to mainnet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>Automatic tracking:</strong> We'll monitor your deposit and notify you when it's confirmed on Helios.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">⚠</span>
                <span><strong>Only supported tokens:</strong> Ensure you're sending a supported token from the correct origin chain.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">⚠</span>
                <span><strong>Gas fees apply:</strong> You'll pay network fees on {selectedChain?.name}. No additional bridge fees.</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setAcknowledged(!acknowledged)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer text-left ${
                acknowledged
                  ? 'bg-[#002DCB] border-[#002DCB] text-white'
                  : 'bg-white border-gray-300 text-[#060F32] hover:border-[#002DCB]'
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                acknowledged
                  ? 'bg-white border-white'
                  : 'bg-white border-gray-300'
              }`}>
                {acknowledged && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#002DCB]">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 11.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-xs">
                I have read and understand the above. I want to proceed with the deposit.
              </span>
            </button>
          </div>
          {selectedToken && amount && Number(amount) > 0 && acknowledged && (
            <div className="mt-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <div className="text-xs font-semibold text-green-900 mb-1">✓ Ready to deposit</div>
              <div className="text-xs text-green-800">
                You will deposit <strong>{amount} {selectedToken}</strong> from <strong>{selectedChain?.name}</strong> to <strong>Helios</strong>. 
                {selectedToken === 'ETH' && ' Your ETH will be wrapped to WETH automatically.'}
                {selectedToken !== 'ETH' && selectedToken !== 'Native' && ' You may need to approve the token first.'}
              </div>
            </div>
          )}
          {!selectedToken || !amount || Number(amount) <= 0 || !acknowledged ? (
            <div className="mt-3 p-3 rounded-lg border-2 border-amber-200 bg-amber-50">
              <div className="text-sm font-semibold text-amber-900 mb-1">⚠️ Before you can transfer:</div>
              <ul className="text-xs text-amber-800 space-y-1">
                {!selectedToken && <li>• Please select a token to deposit</li>}
                {!amount && <li>• Please enter the amount you want to deposit</li>}
                {amount && Number(amount) <= 0 && <li>• Amount must be greater than 0</li>}
                {!acknowledged && <li>• Please acknowledge the safety information above</li>}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4">
            <button 
              onClick={handleTransfer}
              disabled={isTransferring || !acknowledged || !selectedToken || !amount || Number(amount) <= 0}
              className="w-full md:w-auto bg-[#002DCB] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#0045FF] transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isTransferring ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {transferPhase === 'approving' ? 'Approving token...' :
                  transferPhase === 'wrapping' ? 'Wrapping ETH...' :
                  transferPhase === 'sending' ? 'Sending deposit...' :
                  transferPhase === 'waiting' ? 'Confirming...' :
                  'Processing...'}
                </>
              ) : (
                <>
                  Transfer to Helios
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
          {isTransferring && (
            <div className="mt-4 p-4 rounded-xl border border-[#E2EBFF] bg-[#F9FAFF]">
              <div className="flex items-center gap-3">
                {transferPhase !== 'error' ? (
                  <svg className="animate-spin h-5 w-5 text-[#002DCB]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div>
                  <div className="text-[#060F32] font-semibold">
                    {transferPhase === 'approving' && 'Waiting for token approval...'}
                    {transferPhase === 'wrapping' && 'Wrapping native ETH to WETH...'}
                    {transferPhase === 'sending' && 'Sending deposit to Hyperion...'}
                    {transferPhase === 'submitted' && 'Transaction submitted. Waiting for confirmations...'}
                    {transferPhase === 'waiting' && 'Waiting for Helios confirmation...'}
                    {transferPhase === 'error' && 'Deposit failed'}
                  </div>
                  <div className="text-[#5C6584] text-sm">
                    {lastTxHash ? (
                      <a className="text-[#002DCB] hover:underline" target="_blank" rel="noopener noreferrer" href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}>View on Etherscan →</a>
                    ) : (
                      transferPhase !== 'error' ? 'Please confirm the action in your wallet.' : (
                        <span className="text-red-600">{lastError || 'An error occurred'}</span>
                      )
                    )}
                  </div>
                  {transferPhase === 'error' && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setTransferPhase('idle');
                          setLastError(null);
                          setIsTransferring(false);
                        }}
                        className="text-sm text-[#002DCB] hover:underline font-semibold"
                      >
                        ← Try again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedChain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-2xl p-8 text-white"
        >
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 mr-3" />
            <h3 className="text-2xl font-bold">Ready to Bridge from {selectedChain.name}?</h3>
          </div>
          <p className="text-blue-100 mb-6">
            You can bridge {selectedChain.supportedAssets.join(", ")} from {selectedChain.name} to Helios Beta Mainnet.
            The process takes approximately {selectedChain.estimatedTime}.
          </p>
          <div className="flex items-center space-x-4">
            <button className="bg-white text-[#002DCB] px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center">
              Start Bridging
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
            <button className="text-blue-100 hover:text-white transition-colors">
              Learn More About Bridging
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChainSelector;
