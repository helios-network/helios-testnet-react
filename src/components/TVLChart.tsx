import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";
import { fetchTVLHistory, formatCurrency } from "../services/metricsApi";

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const tvlData = await fetchTVLHistory();
        setData(tvlData);
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
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl px-7 py-5">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  // Calculate chart dimensions and scaling
  const maxTVL = Math.max(...data.map(d => d.tvl));
  const minTVL = Math.min(...data.map(d => d.tvl));
  const range = maxTVL - minTVL;
  const padding = range * 0.1;
  // Derive chart size from container (with fallbacks)
  const innerWidth = Math.max(360, Math.floor((containerWidth || 600) - 60));
  const innerHeight = Math.max(260, Math.floor((containerHeight || 420) - 52));
  const chartHeight = innerHeight;
  const chartWidth = innerWidth;
  const yAxisPad = 44; // reduced left padding so plot uses more width
  const topPad = 24;   // reduced top padding to increase plot area

  // Calculate growth percentage
  const firstValue = data[0]?.tvl || 0;
  const lastValue = data[data.length - 1]?.tvl || 0;
  const growthPercentage = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  const getPointPosition = (value: number, index: number) => {
    const x = yAxisPad + (index / (data.length - 1)) * chartWidth;
    const y = topPad + chartHeight - ((value - minTVL + padding) / (range + padding * 2)) * chartHeight;
    return { x, y };
  };

  const points = data.map((point, index) => getPointPosition(point.tvl, index));
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl px-7 pt-5 pb-6 h-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-md font-medium">TVL Growth</h3>
          <p className="text-[#5C6584] text-xs">Total Value Locked over time</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#060F32]">
            {formatCurrency(lastValue)}
          </div>
          <div className={`text-sm font-medium ${
            growthPercentage > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}% growth
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

          {/* Data points and hover hit areas */}
          {points.map((point, index) => (
            <g key={index}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="4.5"
                fill="#002DCB"
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.08, duration: 0.25 }}
              />
              {/* Larger transparent hit area to improve hover reliability */}
              <circle
                cx={point.x}
                cy={point.y}
                r="14"
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
                {formatCurrency(data[hoveredIndex].tvl)}
              </text>
            </motion.g>
          )}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-3 text-[10px] text-[#5C6584] px-8">
          {data.map((point, index) => (
            <span key={index} className="text-center">
              {new Date(point.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Stats (hidden on small screens to give more space to the chart) */}
      <div className="hidden md:grid grid-cols-3 gap-6 pt-6">
        <div className="pr-6 border-r border-[#D7E0FF]">
          <div className="text-xs text-[#5C6584]">Starting TVL</div>
          <div className="text-2xl font-bold">
            {formatCurrency(data[0]?.tvl || 0)}
          </div>
        </div>
        <div className="pr-6 border-r border-[#D7E0FF]">
          <div className="text-xs text-[#5C6584]">Current TVL</div>
          <div className="text-2xl font-bold">
            {formatCurrency(lastValue)}
          </div>
        </div>
        <div className="">
          <div className="text-xs text-[#5C6584]">Total Growth</div>
          <div className="text-2xl font-bold">
            {formatCurrency(lastValue - firstValue)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TVLChart;
