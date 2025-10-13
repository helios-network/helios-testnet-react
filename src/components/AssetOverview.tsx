import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from "lucide-react";
import { fetchAssetData, formatCurrency, formatPercentage, AssetData } from "../services/metricsApi";

interface AssetRowProps {
  asset: AssetData;
  index: number;
}

const AssetRow: React.FC<AssetRowProps> = ({ asset, index }) => {
  const isPositive = asset.change24h > 0;
  const isNegative = asset.change24h < 0;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="hover:bg-[#EBEEFF] transition-colors"
    >
      <td className="rounded-tl-lg rounded-bl-lg px-3 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
            <span className="text-sm font-bold text-[#002DCB]">
              {asset.symbol.charAt(0)}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-[#060F32]">{asset.symbol}</div>
            <div className="text-xs text-[#5C6584]">{asset.name}</div>
          </div>
        </div>
      </td>
      
      <td className="px-3 py-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#5C6584]">{asset.chain}</span>
        </div>
      </td>
      
      <td className="px-3 py-3">
        <div className="font-bold text-[#060F32]">
          {formatCurrency(asset.tvl)}
        </div>
      </td>
      
      <td className="px-3 py-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-[#002DCB]">
            {asset.futureAPY}
          </span>
          <Clock className="w-4 h-4 text-[#002DCB]" />
        </div>
      </td>
      
      <td className="rounded-tr-lg rounded-br-lg px-3 py-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-[#060F32]">
            ${asset.price.toFixed(2)}
          </span>
          <div className={`flex items-center space-x-1 ${
            isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : isNegative ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : null}
            <span className="text-sm font-medium">
              {formatPercentage(asset.change24h)}
            </span>
          </div>
        </div>
      </td>
    </motion.tr>
  );
};

// Chain overview moved to full-width component

const AssetOverview: React.FC = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const assetData = await fetchAssetData();
        setAssets(assetData);
      } catch (error) {
        console.error("Failed to fetch asset data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Asset Table */}
      <div className="bg-white/80 backdrop-blur-sm pb-6 rounded-xl overflow-hidden">
        <div className="px-7 pt-5 pb-6">
          <h2 className="text-md font-medium">Asset Overview</h2>
          <p className="text-xs text-[#5C6584]">
            Track TVL and future APY across all supported assets
          </p>
        </div>
        
        <div className="mx-7 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50 text-xs">
              <tr>
                <th className="rounded-tl-lg rounded-bl-lg px-4 py-3 text-left font-medium">
                  Asset
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  Chain
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  TVL
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  Future APY
                </th>
                <th className="rounded-tr-lg rounded-br-lg px-3 py-2 text-left font-medium">
                  Price (24h)
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <AssetRow key={asset.symbol} asset={asset} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chain Overview moved to full-width SupportedChains */}

      {/* Info Section moved to a full-width component in Dashboard */}
    </div>
  );
};

export default AssetOverview;
