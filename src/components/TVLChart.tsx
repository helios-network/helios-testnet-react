import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChartLine } from "lucide-react";
import { fetchTVLHistory, fetchChainData, formatCurrency } from "../services/metricsApi";

interface TVLDataPoint {
  date: string;
  tvl: number;
}

const TVLChart: React.FC = () => {
  const [data, setData] = useState<TVLDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [liveCurrentUsd, setLiveCurrentUsd] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly'>('weekly');

  // Build display series: append a live "now" point if available and different from last snapshot
  // This must be before any conditional returns to follow Rules of Hooks
  const series: TVLDataPoint[] = React.useMemo(() => {
    const base = data.slice();
    if (liveCurrentUsd != null && isFinite(liveCurrentUsd) && liveCurrentUsd > 0) {
      const last = base[base.length - 1];
      // Only append if it differs meaningfully from last snapshot (>$1 to avoid duplicates)
      if (!last || Math.abs(liveCurrentUsd - last.tvl) > 1) {
        base.push({ date: new Date().toISOString(), tvl: liveCurrentUsd });
      }
    }
    return base;
  }, [data, liveCurrentUsd]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const days = timeRange === 'daily' ? 1 : 7;
        const [tvlData, chains] = await Promise.all([
          fetchTVLHistory(days),
          fetchChainData().catch(() => [])
        ]);
        // Compute live current from chain breakdown if available (more up-to-date than last snapshot)
        if (Array.isArray(chains) && chains.length > 0) {
          const current = chains.reduce((sum: number, c: any) => sum + (Number(c?.tvl) || 0), 0);
          if (isFinite(current) && current > 0) setLiveCurrentUsd(current);
        }
        // Dynamic downsample to avoid overcrowding: aim for ~1 point per 14px, cap between 24 and 60
        const containerApproxWidth = Math.max(360, (containerRef.current?.getBoundingClientRect().width || 600) - 60);
        const targetPoints = Math.min(60, Math.max(24, Math.floor(containerApproxWidth / 14)));
        if (tvlData.length > targetPoints) {
          const step = Math.ceil(tvlData.length / targetPoints);
          const sampled = tvlData.filter((_, idx) => idx % step === 0);
          // Ensure last point is included
          if (sampled[sampled.length - 1] !== tvlData[tvlData.length - 1]) {
            sampled.push(tvlData[tvlData.length - 1]);
          }
          setData(sampled);
        } else {
          setData(tvlData);
        }
      } catch (error) {
        console.error("Failed to fetch TVL history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Observe container size for responsive chart dimensions
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerWidth(cr.width);
        setContainerHeight(cr.height);
      }
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl px-7 py-5">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl px-7 py-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
              <ChartLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-md font-medium">TVL Growth</h3>
              <p className="text-[#5C6584] text-xs">Total Value Locked over time</p>
            </div>
          </div>
        </div>
        <div className="min-h-[260px] sm:min-h-[360px] md:min-h-[420px] flex items-center justify-center text-[#5C6584] text-sm">
          TVL data unavailable. Please try again later.
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scaling using full series (including live point)
  const maxTVL = Math.max(...series.map(d => d.tvl));
  const minTVL = Math.min(...series.map(d => d.tvl));
  const range = maxTVL - minTVL;
  const padding = range * 0.1;
  // Derive chart size from container (with fallbacks)
  const innerWidth = Math.max(360, Math.floor((containerWidth || 600) - 60));
  const innerHeight = Math.max(260, Math.floor((containerHeight || 420) - 52));
  const chartHeight = innerHeight;
  const chartWidth = innerWidth;
  const yAxisPad = 44; // reduced left padding so plot uses more width
  const topPad = 24;   // reduced top padding to increase plot area

  // Calculate growth percentage based on start vs end of time range
  const startValue = series[0]?.tvl || 0;
  const currentValue = series[series.length - 1]?.tvl || 0;
  const growthPercentage = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;

  const getPointPosition = (value: number, index: number) => {
    const x = yAxisPad + (index / (series.length - 1)) * chartWidth;
    const y = topPad + chartHeight - ((value - minTVL + padding) / (range + padding * 2)) * chartHeight;
    return { x, y };
  };

  const points = series.map((point, index) => getPointPosition(point.tvl, index));
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl px-7 py-7"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
            <ChartLine className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-md font-medium">TVL Growth</h3>
            <p className="text-[#5C6584] text-xs">Total Value Locked over time</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 md:gap-6">
          {/* Time range filter */}
          <div className="flex items-center gap-1 bg-blue-50/50 rounded-[12px] p-1">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                timeRange === 'daily'
                  ? 'bg-[#002DCB] text-white'
                  : 'text-[#5C6584] hover:text-[#002DCB]'
              }`}
            >
              24H
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                timeRange === 'weekly'
                  ? 'bg-[#002DCB] text-white'
                  : 'text-[#5C6584] hover:text-[#002DCB]'
              }`}
            >
              7D
            </button>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#060F32]">
              {formatCurrency(currentValue)}
            </div>
            <div className={`text-xs sm:text-sm font-medium ${
              growthPercentage > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-[260px] sm:min-h-[360px] md:min-h-[420px]">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth + 60} ${chartHeight + 60}`}
          className="overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis line */}
          <line
            x1={yAxisPad}
            y1={topPad}
            x2={yAxisPad}
            y2={topPad + chartHeight}
            stroke="#D7E0FF"
            strokeWidth="2"
          />
          
          {/* X-axis line */}
          <line
            x1={yAxisPad}
            y1={topPad + chartHeight}
            x2={chartWidth + yAxisPad}
            y2={topPad + chartHeight}
            stroke="#D7E0FF"
            strokeWidth="2"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <g key={index}>
              <line
                x1={yAxisPad}
                y1={topPad + chartHeight * ratio}
                x2={chartWidth + yAxisPad}
                y2={topPad + chartHeight * ratio}
                stroke="#E2EBFF"
                strokeWidth="1"
                opacity="0.5"
              />
              <text
                x={yAxisPad - 5}
                y={topPad + chartHeight * ratio + 4}
                fontSize="10"
                fill="#5C6584"
                textAnchor="end"
              >
                {formatCurrency(minTVL + (range * (1 - ratio)))}
              </text>
            </g>
          ))}

          {/* Area under the curve */}
          <defs>
            <linearGradient id="tvlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#002DCB" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#002DCB" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <path
            d={`${pathData} L ${chartWidth + yAxisPad} ${topPad + chartHeight} L ${yAxisPad} ${topPad + chartHeight} Z`}
            fill="url(#tvlGradient)"
          />

          {/* Line */}
          <motion.path
            d={pathData}
            stroke="#002DCB"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Hover hit areas only (no visible point markers) */}
          {points.map((point, index) => (
            <g key={index}>
              {/* Larger transparent hit area to improve hover reliability */}
              <circle
                cx={point.x}
                cy={point.y}
                r={12}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
              />
            </g>
          ))}

          {/* Single tooltip driven by hoveredIndex */}
          {hoveredIndex !== null && (
            <motion.g
              key={`tooltip-active`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <rect
                x={points[hoveredIndex].x - 28}
                y={points[hoveredIndex].y - 36}
                width="56"
                height="22"
                fill="#002DCB"
                rx="5"
                stroke="white"
                strokeWidth="1"
              />
              <text
                x={points[hoveredIndex].x}
                y={points[hoveredIndex].y - 22}
                fontSize="10"
                fill="white"
                textAnchor="middle"
              >
                {formatCurrency(series[hoveredIndex].tvl)}
              </text>
            </motion.g>
          )}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-3 text-[10px] text-[#5C6584] px-8">
          {(() => {
            const MAX_TICKS = 8;
            const n = series.length;
            if (n <= MAX_TICKS) {
              return series.map((point, index) => (
                <span key={index} className="text-center">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ));
            }
            const step = Math.ceil(n / MAX_TICKS);
            const ticks = series.filter((_, i) => i % step === 0);
            if (ticks[ticks.length - 1] !== series[n - 1]) ticks.push(series[n - 1]);
            return ticks.map((point, index) => (
              <span key={index} className="text-center">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ));
          })()}
        </div>
      </div>

      {/* Stats (hidden on small screens to give more space to the chart) */}
      <div className="hidden md:grid grid-cols-3 gap-6 pt-6">
        <div className="pr-6 border-r border-[#D7E0FF]">
          <div className="text-xs text-[#5C6584]">{timeRange === 'daily' ? '24H Start' : '7D Start'}</div>
          <div className="text-2xl font-bold">
            {formatCurrency(startValue)}
          </div>
        </div>
        <div className="pr-6 border-r border-[#D7E0FF]">
          <div className="text-xs text-[#5C6584]">Current TVL</div>
          <div className="text-2xl font-bold">
            {formatCurrency(currentValue)}
          </div>
        </div>
        <div className="">
          <div className="text-xs text-[#5C6584]">Change</div>
          <div className="text-2xl font-bold">
            {formatCurrency(currentValue - startValue)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TVLChart;
