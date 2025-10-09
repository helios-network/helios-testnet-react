import React, { useEffect, useState } from "react";
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
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
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
  const chartHeight = 140;
  const chartWidth = 360;

  // Calculate growth percentage
  const firstValue = data[0]?.tvl || 0;
  const lastValue = data[data.length - 1]?.tvl || 0;
  const growthPercentage = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  const getPointPosition = (value: number, index: number) => {
    const x = 50 + (index / (data.length - 1)) * chartWidth; // Add 50px padding for Y-axis labels
    const y = 30 + chartHeight - ((value - minTVL + padding) / (range + padding * 2)) * chartHeight; // Add 30px padding for X-axis
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
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#060F32]">TVL Growth</h3>
          <p className="text-[#5C6584] mt-1 text-sm">Total Value Locked over time</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#002DCB]">
            {formatCurrency(lastValue)}
          </div>
          <div className={`text-sm font-medium ${
            growthPercentage > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}% growth
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          width="100%"
          height={chartHeight + 60}
          viewBox={`0 0 ${chartWidth + 60} ${chartHeight + 60}`}
          className="overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis line */}
          <line
            x1="50"
            y1="30"
            x2="50"
            y2={30 + chartHeight}
            stroke="#D7E0FF"
            strokeWidth="2"
          />
          
          {/* X-axis line */}
          <line
            x1="50"
            y1={30 + chartHeight}
            x2={chartWidth + 50}
            y2={30 + chartHeight}
            stroke="#D7E0FF"
            strokeWidth="2"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <g key={index}>
              <line
                x1="50"
                y1={30 + chartHeight * ratio}
                x2={chartWidth + 50}
                y2={30 + chartHeight * ratio}
                stroke="#E2EBFF"
                strokeWidth="1"
                opacity="0.5"
              />
              <text
                x="45"
                y={30 + chartHeight * ratio + 4}
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
            d={`${pathData} L ${chartWidth + 50} ${30 + chartHeight} L 50 ${30 + chartHeight} Z`}
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

          {/* Data points */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#002DCB"
              stroke="white"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            />
          ))}

          {/* Hover tooltips */}
          {points.map((point, index) => (
            <motion.g
              key={`tooltip-${index}`}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <rect
                x={point.x - 20}
                y={point.y - 30}
                width="40"
                height="20"
                fill="#002DCB"
                rx="4"
              />
              <text
                x={point.x}
                y={point.y - 15}
                fontSize="10"
                fill="white"
                textAnchor="middle"
              >
                {formatCurrency(data[index].tvl)}
              </text>
            </motion.g>
          ))}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#D7E0FF]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#002DCB]">
            {formatCurrency(data[0]?.tvl || 0)}
          </div>
          <div className="text-sm text-[#5C6584]">Starting TVL</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#002DCB]">
            {formatCurrency(lastValue)}
          </div>
          <div className="text-sm text-[#5C6584]">Current TVL</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#002DCB]">
            {formatCurrency(lastValue - firstValue)}
          </div>
          <div className="text-sm text-[#5C6584]">Total Growth</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TVLChart;
