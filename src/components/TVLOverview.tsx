import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer, X } from "lucide-react";
import { fetchChainData, formatCurrency, formatCurrencyFull, ChainData } from "../services/metricsApi";
import ReactECharts from 'echarts-for-react';

type ChainKey = "Ethereum" | "BNB Chain" | "Arbitrum" | "Base" | "Optimism" | "Polygon";

const CHAIN_ORDER: ChainKey[] = [
  "Ethereum",
  "BNB Chain",
  "Arbitrum",
  "Base",
  "Optimism",
  "Polygon",
];

const CHAIN_COLORS: Record<ChainKey, string> = {
  Ethereum: "#627EEA",
  "BNB Chain": "#F3BA2F",
  Arbitrum: "#28A0F0",
  Base: "#305CFF",
  Optimism: "#FF0420",
  Polygon: "#8247E5",
};

// Use TrustWallet logos to match "Your Liquidity on Helios"
const CHAIN_ICON_URLS: Record<ChainKey, string> = {
  Ethereum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  "BNB Chain": 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  Arbitrum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  Base: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
  Optimism: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  Polygon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
};

const RING_THICKNESS = 30; // between 28-36px per spec

// Helper function to calculate bounded tooltip position
const calculateTooltipPosition = (
  angle: number,
  cx: number,
  cy: number,
  radius: number,
  chartSize: number,
  tooltipWidth: number = 160,
  tooltipHeight: number = 64,
  offset: number = 12
) => {
  // Calculate initial position slightly outside the ring
  const distance = radius + offset;
  const rawX = cx + distance * Math.cos(angle);
  const rawY = cy + distance * Math.sin(angle);
  
  // Define margins from container edges
  const margin = 8;
  
  // Calculate bounded x position
  let x = rawX;
  // If tooltip would overflow right, shift it left
  if (x + tooltipWidth > chartSize - margin) {
    x = chartSize - tooltipWidth - margin;
  }
  // If tooltip would overflow left, shift it right
  if (x < margin) {
    x = margin;
  }
  
  // Calculate bounded y position
  let y = rawY;
  // If tooltip would overflow bottom, shift it up
  if (y + tooltipHeight > chartSize - margin) {
    y = chartSize - tooltipHeight - margin;
  }
  // If tooltip would overflow top, shift it down
  if (y < margin) {
    y = margin;
  }
  
  return { x, y };
};

interface TVLOverviewProps {
  compact?: boolean;
  inline?: boolean; // when true, render only logos row + overlay without card wrapper
}

const TVLOverview: React.FC<TVLOverviewProps> = ({ compact = false, inline = false }) => {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverKey, setHoverKey] = useState<ChainKey | null>(null);
  const [activeKey, setActiveKey] = useState<ChainKey | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [logosHover, setLogosHover] = useState(false);
  const [panelHover, setPanelHover] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isTouch, setIsTouch] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number>(0);
  const [showAttention, setShowAttention] = useState(true);

  // Whether overlay should be visible (computed early for use in effects)
  const showOverlay = logosHover || panelHover || !!activeKey;

  const handleToggle = (key: ChainKey) => {
    setShowAttention(false); // Disable attention effect on first interaction
    setActiveKey((prev) => {
      if (prev === key) {
        setPanelHover(false);
        setLogosHover(false);
        return null;
      }
      return key;
    });
  };

  const handleHover = (key: ChainKey | null) => {
    if (key !== null) {
      setShowAttention(false); // Disable attention effect on first hover
      setLogosHover(true);
    } else {
      setLogosHover(false);
    }
    setHoverKey(key);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchChainData();
        if (!mounted) return;
        // filter to the 6 chains in spec and sort
        const filtered = data.filter(d => CHAIN_ORDER.includes(d.name as ChainKey));
        const complete = CHAIN_ORDER.map((name) => {
          const found = filtered.find((c) => c.name === name);
          return found || { name, logo: `/images/chains/${name.toLowerCase().replace(" ", "-")}.svg`, tvl: 0, assets: 0, status: 'active' } as ChainData;
        });
        setChains(complete);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!isTouch) return;
    const handler = (e: Event) => {
      if (!showOverlay) return;
      const overlayEl = overlayRef.current;
      const rootEl = rootRef.current;
      const target = e.target as Node | null;
      if (overlayEl && target && overlayEl.contains(target)) return; // clicks inside overlay allowed
      if (rootEl && target && rootEl.contains(target)) return; // clicks inside component (e.g., logos) handled by own handlers
      setActiveKey(null);
      setLogosHover(false);
      setPanelHover(false);
    };
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [isTouch, showOverlay]);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerWidth(cr.width);
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setOverlayWidth(cr.width);
      }
    });
    if (overlayRef.current) ro.observe(overlayRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Detect touch devices for copy adjustments
    try {
      setIsTouch(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    } catch {
      setIsTouch(false);
    }
    // Auto-hide the hint after a few seconds
    const id = setTimeout(() => setShowHint(false), 6000);
    const id2 = setTimeout(() => setShowAttention(false), 8000);
    return () => { clearTimeout(id); clearTimeout(id2); };
  }, []);

  const total = useMemo(() => chains.reduce((sum, c) => sum + (c.tvl || 0), 0), [chains]);

  const chartSize = Math.max(280, Math.min(520, Math.floor(containerWidth * 0.9)));
  const radius = Math.max(80, Math.floor(chartSize / 2) - RING_THICKNESS);
  const cx = Math.floor(chartSize / 2);
  const cy = Math.floor(chartSize / 2);
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    let cumulative = 0;
    // Start from top of circle (rotate by -90 degrees = -0.25 of circumference)
    const startOffset = -circumference * 0.25;
    
    return CHAIN_ORDER.map((name, index) => {
      const data = chains.find((c) => c.name === name);
      const value = data?.tvl || 0;
      const percent = total > 0 ? value / total : 0;
      const rawLength = percent * circumference;
      
      // For the last segment, use remaining circumference to ensure 100% fill
      const isLast = index === CHAIN_ORDER.length - 1;
      const length = isLast ? Math.max(0, circumference - cumulative) : rawLength;
      
      // Offset positions where this segment starts (negative because SVG rotates counter-clockwise)
      const offset = startOffset - cumulative;
      
      const segment = { 
        key: name as ChainKey, 
        value, 
        percent, 
        length, 
        offset, 
        logo: data?.logo || "", 
        color: CHAIN_COLORS[name as ChainKey] 
      };
      
      cumulative += length;
      return segment;
    });
  }, [chains, total, circumference]);

  const centerLabel = useMemo(() => formatCurrencyFull(total), [total]);

  const legendItems = segments.map(s => ({
    key: s.key,
    logo: CHAIN_ICON_URLS[s.key],
    color: s.color,
    tvl: s.value,
    percent: s.percent,
  }));

  const pieSeriesData = useMemo(() => legendItems.map(item => ({
    name: item.key,
    value: Math.max(0, item.tvl),
    itemStyle: { color: item.color }
  })), [legendItems]);

  const echartsColors = useMemo(() => CHAIN_ORDER.map(k => CHAIN_COLORS[k]), []);

  const echartsOption = useMemo(() => ({
    color: echartsColors,
    tooltip: {
      trigger: 'item',
      confine: true,
      extraCssText: 'max-width:220px; white-space:normal;',
      formatter: (params: any) => {
        const pct = params.percent?.toFixed(1) || '0.0';
        const value = formatCurrencyFull(params.value || 0);
        return `<div style="display:flex;align-items:center;gap:6px;">
          <img src="${CHAIN_ICON_URLS[params.name as ChainKey]}" width="14" height="14" style="border-radius:4px;" />
          <strong>${params.name}</strong>
        </div>
        <div style="margin-top:4px;"><strong>${value}</strong></div>
        <div style="color:#5C6584;">${pct}% of total</div>`;
      }
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['64%', '88%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          color: '#060F32',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 6,
          lineStyle: { color: '#BFD0FF' }
        },
        emphasis: {
          scale: true,
          scaleSize: 4,
          label: {
            show: true,
            fontWeight: 'bold',
            color: '#060F32'
          }
        },
        data: pieSeriesData,
        animationDuration: 600,
        animationEasing: 'cubicOut',
      }
    ]
  }), [pieSeriesData, echartsColors]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-[25px] px-7 py-5">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // showOverlay already computed above

  if (compact && inline) {
    return (
      <div className="relative" ref={(el) => { containerRef.current = el; rootRef.current = el; }}>
        <div className="flex flex-wrap gap-3 items-center justify-center">
          {legendItems.map((item) => (
            <button
              key={`logo-${item.key}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition relative ${
                showAttention ? 'animate-glow' : ''
              } ${
                (hoverKey === item.key || activeKey === item.key) ? 'bg-blue-50 border-[#BFD0FF]' : 'bg-white/90 border-[#E2EBFF]'
              }`}
              onMouseEnter={() => handleHover(item.key)}
              onMouseLeave={() => handleHover(null)}
              onFocus={() => handleHover(item.key)}
              onBlur={() => handleHover(null)}
              onClick={() => handleToggle(item.key)}
              aria-pressed={activeKey === item.key}
              title={`${isTouch ? 'Tap' : 'Hover'} to see TVL chart`}
            >
              <span className="w-6 h-6 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.logo} alt={`${item.key} logo`} className="w-6 h-6" />
              </span>
              <span className="text-xs font-medium text-[#060F32]">{item.key}</span>
            </button>
          ))}
          <AnimatePresence>
            {showHint && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F5F7FF] border border-[#E2EBFF] text-[11px] text-[#002DCB]"
              >
                <MousePointer className="w-3.5 h-3.5" />
                {isTouch ? 'Tap a chain to see TVL' : 'Hover a chain to see TVL'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-full mt-2 z-50"
              onMouseEnter={() => setPanelHover(true)}
              onMouseLeave={() => setPanelHover(false)}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E2EBFF] px-6 py-5 max-w-6xl mx-auto shadow-xl" ref={overlayRef}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium">TVL Overview</h3>
                    <p className="text-[#5C6584] text-xs">Hover a chain to see its share</p>
                  </div>
                  <div className="text-right flex items-start gap-3">
                    {isTouch && (
                      <button
                        onClick={() => { setActiveKey(null); setPanelHover(false); setLogosHover(false); }}
                        className="p-1 rounded-md border border-[#E2EBFF] hover:bg-[#F5F7FF]"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4 text-[#5C6584]" />
                      </button>
                    )}
                    <div className="text-[11px] text-[#5C6584]">Total TVL</div>
                    <div className="text-xl font-bold text-[#060F32]">{centerLabel}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5 flex items-center justify-center">
                    <div className="w-full max-w-[360px]">
                      {typeof window !== 'undefined' ? (
                        <ReactECharts option={echartsOption} style={{ width: '100%', height: chartSize }} notMerge={true} lazyUpdate={true} />
                      ) : (
                        <svg width="100%" height="100%" viewBox={`0 0 ${chartSize} ${chartSize}`} className="w-full h-auto">
                          {/* fallback svg */}
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-7 flex items-center">
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 w-full">
                      {legendItems.map((item) => (
                        <button
                          key={`legend-${item.key}`}
                          className={`flex sm:flex-row flex-col items-start sm:items-center justify-between gap-3 px-3 py-2 rounded-lg border transition text-left w-full ${
                            (hoverKey === item.key || activeKey === item.key) ? 'bg-blue-50 border-[#BFD0FF]' : 'bg-white border-[#E2EBFF]'
                          }`}
                          onMouseEnter={() => setHoverKey(item.key)}
                          onMouseLeave={() => setHoverKey((prev) => prev === item.key ? null : prev)}
                          onFocus={() => setHoverKey(item.key)}
                          onBlur={() => setHoverKey((prev) => prev === item.key ? null : prev)}
                          onClick={() => handleToggle(item.key)}
                          aria-pressed={activeKey === item.key}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="w-6 h-6 overflow-hidden flex items-center justify-center">
                              <img src={item.logo} alt={`${item.key} logo`} className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-medium text-[#060F32]">{item.key}</span>
                          </div>
                          <div className="sm:text-right text-left w-full sm:w-auto whitespace-normal break-words leading-tight">
                            <div className="text-xs font-bold text-[#060F32]">{formatCurrencyFull(item.tvl)}</div>
                            <div className="text-[11px] text-[#5C6584]">{(item.percent * 100).toFixed(1)}%</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(0, 45, 203, 0.4),
                          0 0 10px rgba(74, 108, 247, 0.3);
            }
            50% {
              box-shadow: 0 0 0 4px rgba(0, 45, 203, 0),
                          0 0 20px rgba(74, 108, 247, 0.5);
            }
          }

          .animate-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-[25px] px-7 py-5">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="text-md font-medium">
              Helios Beta Mainnet expands across 6 chains
            </div>
            <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50/40 text-xs text-blue-400/80 font-medium border border-[#E2EBFF]">
              {isTouch ? 'Tap a chain to see TVL' : 'Hover a chain to see TVL'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {legendItems.map((item) => (
              <button
                key={`logo-${item.key}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border transition relative ${
                  showAttention ? 'animate-glow' : ''
                } ${
                  (hoverKey === item.key || activeKey === item.key) ? 'bg-blue-50 border-blue-100' : 'bg-blue-50/50 border-blue-50'
                }`}
                          onMouseEnter={() => handleHover(item.key)}
                          onMouseLeave={() => handleHover(null)}
                          onFocus={() => handleHover(item.key)}
                          onBlur={() => handleHover(null)}
                          onClick={() => handleToggle(item.key)}
                aria-pressed={activeKey === item.key}
                title={`${isTouch ? 'Tap' : 'Hover'} to see TVL chart`}
              >
                <span className="w-6 h-6 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.logo} alt={`${item.key} logo`} className="w-6 h-6" />
                </span>
                <span className="text-xs font-medium text-[#060F32]">{item.key}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-full mt-2 z-50"
              onMouseEnter={() => setPanelHover(true)}
              onMouseLeave={() => setPanelHover(false)}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-[25px] border border-[#E2EBFF] px-8 py-7 max-w-5xl mx-auto shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-md font-medium">TVL Overview</h3>
                    <p className="text-[#5C6584] text-xs">Hover a chain to see its share</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#5C6584]">Total TVL</div>
                    <div className="text-xl font-bold text-[#060F32]">{centerLabel}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5 flex items-center justify-center">
                    <div className="w-full max-w-[400px]">
                      {typeof window !== 'undefined' ? (
                        <ReactECharts option={echartsOption} style={{ width: '100%', height: chartSize }} notMerge={true} lazyUpdate={true} />
                      ) : (
                        <svg width="100%" height="100%" viewBox={`0 0 ${chartSize} ${chartSize}`} className="w-full h-auto">
                          {/* fallback svg */}
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-7 flex items-center">
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 w-full">
                      {legendItems.map((item) => (
                        <button
                          key={`legend-${item.key}`}
                          className={`flex sm:flex-row flex-col items-start sm:items-center justify-between gap-3 px-3 py-2 rounded-[12px] transition border text-left w-full ${
                            (hoverKey === item.key || activeKey === item.key) ? 'bg-blue-50 border-blue-100' : 'bg-blue-50/50 border-blue-50'
                          }`}
                          onMouseEnter={() => setHoverKey(item.key)}
                          onMouseLeave={() => setHoverKey((prev) => prev === item.key ? null : prev)}
                          onFocus={() => setHoverKey(item.key)}
                          onBlur={() => setHoverKey((prev) => prev === item.key ? null : prev)}
                          onClick={() => handleToggle(item.key)}
                          aria-pressed={activeKey === item.key}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="w-6 h-6 overflow-hidden flex items-center justify-center">
                              <img src={item.logo} alt={`${item.key} logo`} className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-medium text-[#060F32]">{item.key}</span>
                          </div>
                          <div className="sm:text-right text-left w-full sm:w-auto whitespace-normal break-words leading-tight">
                            <div className="text-xs font-bold text-[#060F32]">{formatCurrencyFull(item.tvl)}</div>
                            <div className="text-[11px] text-[#5C6584]">{(item.percent * 100).toFixed(1)}%</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(0, 45, 203, 0.4),
                          0 0 10px rgba(74, 108, 247, 0.3);
            }
            50% {
              box-shadow: 0 0 0 4px rgba(0, 45, 203, 0),
                          0 0 20px rgba(74, 108, 247, 0.5);
            }
          }

          .animate-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl px-7 py-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-md font-medium">TVL Overview</h3>
          <p className="text-[#5C6584] text-xs">Deposits by origin chain</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#5C6584]">Total TVL</div>
          <div className="text-2xl font-bold text-[#060F32]">{centerLabel}</div>
        </div>
      </div>

      {/* Logos row with hover cue */}
      <div className="flex flex-wrap gap-3 items-center justify-center mb-4">
        {legendItems.map((item) => (
          <button
            key={item.key}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition relative ${
              showAttention ? 'animate-glow' : ''
            } ${
              (hoverKey === item.key || activeKey === item.key) ? 'bg-blue-50 border-[#BFD0FF]' : 'bg-white border-[#E2EBFF]'
            }`}
            onMouseEnter={() => handleHover(item.key)}
            onMouseLeave={() => handleHover(null)}
            onFocus={() => handleHover(item.key)}
            onBlur={() => handleHover(null)}
            onClick={() => handleToggle(item.key)}
            aria-pressed={activeKey === item.key}
          >
            <span className="w-6 h-6 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chains.find(c => c.name === item.key)?.logo} alt={`${item.key} logo`} className="w-5 h-5" />
            </span>
            <span className="text-xs font-medium text-[#060F32]">{item.key}</span>
          </button>
        ))}
        <span className="text-[11px] text-[#5C6584] ml-1">Hover or tap a chain to see details</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" ref={containerRef}>
        {/* Donut chart */}
        <div className="md:col-span-5 flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            {typeof window !== 'undefined' ? (
              <ReactECharts option={echartsOption} style={{ width: '100%', height: chartSize }} notMerge={true} lazyUpdate={true} />
            ) : (
              <svg width="100%" height="100%" viewBox={`0 0 ${chartSize} ${chartSize}`} className="w-full h-auto">
                {/* fallback svg */}
              </svg>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="md:col-span-7 flex items-center">
          <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 w-full">
            {legendItems.map((item) => (
              <button
                key={`legend-${item.key}`}
                className={`flex sm:flex-row flex-col items-start sm:items-center justify-between gap-3 px-3 py-2 rounded-lg border transition text-left w-full ${
                  (hoverKey === item.key || activeKey === item.key) ? 'bg-blue-50 border-[#BFD0FF]' : 'bg-white border-[#E2EBFF]'
                }`}
                onMouseEnter={() => setHoverKey(item.key)}
                onMouseLeave={() => setHoverKey((prev) => prev === item.key ? null : prev)}
                onFocus={() => setHoverKey(item.key)}
                onBlur={() => setHoverKey((prev) => prev === item.key ? null : prev)}
                onClick={() => handleToggle(item.key)}
                aria-pressed={activeKey === item.key}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="w-6 h-6 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.logo} alt={`${item.key} logo`} className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-medium text-[#060F32]">{item.key}</span>
                </div>
                <div className="sm:text-right text-left w-full sm:w-auto whitespace-normal break-words leading-tight">
                  <div className="text-xs font-bold text-[#060F32]">{formatCurrencyFull(item.tvl)}</div>
                  <div className="text-[11px] text-[#5C6584]">{(item.percent * 100).toFixed(1)}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes rotate-border {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-glow::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 0.5rem;
          background: conic-gradient(
            from 0deg,
            #002DCB,
            #4A6CF7,
            #002DCB,
            #4A6CF7,
            #002DCB
          );
          animation: rotate-border 3s linear infinite;
          z-index: -1;
        }

        .animate-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 0.5rem;
          background: inherit;
          z-index: -1;
        }
      `}</style>
    </motion.div>
  );
};

export default TVLOverview;


