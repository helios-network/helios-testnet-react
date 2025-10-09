import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { fetchNetworkMetrics, formatCurrency, formatNumber, formatPercentage, NetworkMetrics } from "../services/metricsApi";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  subtitle?: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  subtitle,
  isLoading = false 
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6584]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#828DB3]">{subtitle}</p>
            )}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${
            isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : isNegative ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : null}
            <span className="text-sm font-semibold">
              {formatPercentage(change)}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        {isLoading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        ) : (
          <motion.h2 
            className="text-3xl font-bold text-[#060F32]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.h2>
        )}
      </div>
    </motion.div>
  );
};

const NetworkMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await fetchNetworkMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch network metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Value Locked"
          value={metrics ? formatCurrency(metrics.totalTVL) : "Loading..."}
          change={metrics?.tvlGrowth24h}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          subtitle="Across all chains"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Highest APY"
          value={metrics ? `${metrics.highestAPY}%` : "Loading..."}
          icon={<Zap className="w-6 h-6 text-white" />}
          subtitle="Future rewards"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Active Markets"
          value={metrics ? metrics.activeMarkets.toString() : "Loading..."}
          icon={<Activity className="w-6 h-6 text-white" />}
          subtitle="Supported chains"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Users"
          value={metrics ? formatNumber(metrics.totalUsers) : "Loading..."}
          change={metrics?.tvlGrowth7d}
          icon={<Users className="w-6 h-6 text-white" />}
          subtitle="Community members"
          isLoading={isLoading}
        />
      </div>

      {/* Growth Indicators */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Network Growth</h3>
              <p className="text-blue-100">
                TVL increased by {formatPercentage(metrics.tvlGrowth24h)} in the last 24 hours
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPercentage(metrics.tvlGrowth7d)}
              </div>
              <div className="text-sm text-blue-100">7-day growth</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NetworkMetrics;
