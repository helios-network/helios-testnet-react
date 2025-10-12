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
      className="bg-white/80 backdrop-blur-sm rounded-xl px-7 pt-5 pb-4"
    >
      <div className="flex items-center">
        {icon}
      </div>
      <div className="py-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#828DB3]">{subtitle}</p>
        )}
      </div>
      <div className="flex items-end space-x-3">
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
        {change !== undefined && (
          <div className={`flex items-center space-x-1 pb-0.5 ${
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
    <div className="space-y-4 mb-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Value Locked"
          value={metrics ? formatCurrency(metrics.totalTVL) : "Loading..."}
          change={metrics?.tvlGrowth24h}
          icon={<TrendingUp className="w-6 h-6 text-[#002DCB]" />}
          subtitle="Across all chains"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Highest APY"
          value={metrics ? `${metrics.highestAPY}%` : "Loading..."}
          icon={<Zap className="w-6 h-6 text-[#002DCB]" />}
          subtitle="Future rewards"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Active Markets"
          value={metrics ? metrics.activeMarkets.toString() : "Loading..."}
          icon={<Activity className="w-6 h-6 text-[#002DCB]" />}
          subtitle="Supported chains"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Users"
          value={metrics ? formatNumber(metrics.totalUsers) : "Loading..."}
          change={metrics?.tvlGrowth7d}
          icon={<Users className="w-6 h-6 text-[#002DCB]" />}
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
          className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-xl px-7 py-5 text-white"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-md font-medium">Network Growth</h3>
              <p className="text-xs text-blue-100">
                TVL increased by {formatPercentage(metrics.tvlGrowth24h)} in the last 24 hours
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPercentage(metrics.tvlGrowth7d)}
              </div>
              <div className="text-xs text-blue-100">7-day growth</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NetworkMetrics;
