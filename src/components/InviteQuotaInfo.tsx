import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";
import { Clock, TrendingUp, Users, Activity } from "lucide-react";

interface QuotaInfoProps {
  showDetailed?: boolean;
}

const InviteQuotaInfo: React.FC<QuotaInfoProps> = ({ showDetailed = false }) => {
  const [currentQuota, setCurrentQuota] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        setLoading(true);
        const response = await api.getCurrentInviteQuota();
        if (response.success) {
          setCurrentQuota(response.data.currentQuota);
        }
      } catch (err: any) {
        console.error("Error fetching current quota:", err);
        setError(err.message || "Failed to fetch quota");
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
    
    // Refresh quota every 5 minutes
    const interval = setInterval(fetchQuota, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/70 rounded-lg p-3 flex items-center">
        <div className="loading-shimmer h-4 w-32 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/90 rounded-lg p-3 flex items-center border border-red-200">
        <div className="text-red-500 text-sm">Quota unavailable</div>
      </div>
    );
  }

  if (showDetailed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">Daily Invite Quota</h3>
            <p className="text-blue-600 text-sm">Dynamic system-wide limit</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{currentQuota}</div>
            <div className="text-sm text-blue-600">Invites per user</div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-sm text-gray-600">Adjusts based on</div>
            <div className="text-xs text-gray-500">network growth</div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-4 text-center">
            <Activity className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-sm text-gray-600">Responds to</div>
            <div className="text-xs text-gray-500">user activity</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
          <p className="text-xs text-blue-700">
            The invite quota automatically adjusts daily based on network growth and user activity. 
            Higher activity and growth = more invites available per user, <b>you win extra xp points from referrals activity.</b>
          </p>
        </div>
      </motion.div>
    );
  }

  // Simple display
  return (
    <div className="bg-white/80 rounded-lg px-3 py-2 flex items-center border border-blue-200/50 shadow-sm">
      <Clock className="h-4 w-4 text-blue-600 mr-2" />
      <div className="text-sm">
        <span className="font-medium text-blue-900">Daily Quota: </span>
        <span className="font-bold text-blue-700">{currentQuota}</span>
        <span className="text-blue-600 text-xs ml-1">invites/user</span>
      </div>
    </div>
  );
};

export default InviteQuotaInfo; 