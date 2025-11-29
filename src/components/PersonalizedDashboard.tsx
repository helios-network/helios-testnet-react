import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Award, 
  TrendingUp, 
  Clock, 
  Zap,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useStore } from "../store/onboardingStore";
import { useAccount } from "wagmi";

interface PersonalStats {
  totalStaked: number;
  activeStakes: number;
  claimableRewards: number;
  xpEarned: number;
  airdropScore: number;
  nextRewardClaim: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  type: 'stake' | 'bridge' | 'referral' | 'social';
}

const PersonalStatsCard: React.FC<{ stats: PersonalStats }> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6584]">Total Staked</h3>
            <p className="text-xs text-[#828DB3]">Across all assets</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-[#060F32]">
          {formatCurrency(stats.totalStaked)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6584]">Active Stakes</h3>
            <p className="text-xs text-[#828DB3]">Currently earning</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-[#060F32]">
          {stats.activeStakes}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6584]">Claimable Rewards</h3>
            <p className="text-xs text-[#828DB3]">HLS tokens ready</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-[#060F32]">
          {stats.claimableRewards.toFixed(2)} HLS
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#002DCB] to-[#4A6CF7] rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6584]">Airdrop Score</h3>
            <p className="text-xs text-[#828DB3]">XP + Liquidity</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-[#060F32]">
          {stats.airdropScore.toLocaleString()}
        </div>
      </motion.div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'stake': return <Shield className="w-5 h-5" />;
      case 'bridge': return <ArrowRight className="w-5 h-5" />;
      case 'referral': return <Star className="w-5 h-5" />;
      case 'social': return <Award className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'stake': return 'text-blue-500 bg-blue-100';
      case 'bridge': return 'text-green-500 bg-green-100';
      case 'referral': return 'text-purple-500 bg-purple-100';
      case 'social': return 'text-orange-500 bg-orange-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-6 rounded-2xl border-2 transition-all ${
        task.completed
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-white hover:border-[#002DCB]/50'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTaskColor(task.type)}`}>
            {getTaskIcon(task.type)}
          </div>
          <div>
            <h3 className="font-semibold text-[#060F32]">{task.title}</h3>
            <p className="text-sm text-[#5C6584]">{task.description}</p>
          </div>
        </div>
        {task.completed ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <div className="text-right">
            <div className="text-sm font-semibold text-[#002DCB]">
              +{task.reward} XP
            </div>
            <div className="text-xs text-[#5C6584]">Reward</div>
          </div>
        )}
      </div>
      
      {!task.completed && (
        <button className="w-full bg-[#002DCB] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#0045FF] transition-colors">
          Complete Task
        </button>
      )}
    </motion.div>
  );
};

const PersonalizedDashboard: React.FC = () => {
  const { address } = useAccount();
  const user = useStore((state) => state.user);
  const displayName =
    user?.discordUsername ||
    user?.discord?.username ||
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const [stats, setStats] = useState<PersonalStats>({
    totalStaked: 0,
    activeStakes: 0,
    claimableRewards: 0,
    xpEarned: 0,
    airdropScore: 0,
    nextRewardClaim: '2024-02-15'
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPersonalData = async () => {
      try {
        setIsLoading(true);
        
        // Mock data - replace with real API calls
        const mockStats: PersonalStats = {
          totalStaked: 25000,
          activeStakes: 3,
          claimableRewards: 125.5,
          xpEarned: 2450,
          airdropScore: 18750,
          nextRewardClaim: '2024-02-15'
        };

        const mockTasks: Task[] = [
          {
            id: '1',
            title: 'Stake ETH',
            description: 'Stake 1 ETH to earn HLS rewards',
            reward: 100,
            completed: true,
            type: 'stake'
          },
          {
            id: '2',
            title: 'Bridge Assets',
            description: 'Bridge assets from Ethereum to Helios',
            reward: 50,
            completed: false,
            type: 'bridge'
          },
          {
            id: '3',
            title: 'Refer Friends',
            description: 'Invite 3 friends to join Helios',
            reward: 200,
            completed: false,
            type: 'referral'
          },
          {
            id: '4',
            title: 'Social Engagement',
            description: 'Share about Helios on social media',
            reward: 25,
            completed: false,
            type: 'social'
          }
        ];

        setStats(mockStats);
        setTasks(mockTasks);
      } catch (error) {
        console.error("Failed to load personal data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      loadPersonalData();
    }
  }, [address]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#002DCB] to-[#4A6CF7] rounded-2xl p-5 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Welcome back, {displayName || 'Friend'}!
            </h2>
            <p className="text-blue-100 text-sm">
              Continue your journey on Helios Beta Mainnet and earn more rewards.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-100">Next reward claim</div>
            <div className="text-base font-semibold">{stats.nextRewardClaim}</div>
          </div>
        </div>
      </motion.div>

      {/* Personal Stats */}
      <PersonalStatsCard stats={stats} />

      {/* Tasks & XP Progress */}
      {/* <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#060F32]">Your Tasks & XP</h3>
            <p className="text-[#5C6584] mt-1">
              Complete tasks to earn XP and increase your airdrop score
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#002DCB]">
              {stats.xpEarned.toLocaleString()} XP
            </div>
            <div className="text-sm text-[#5C6584]">Total earned</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
        </div>
      </div> */}

      {/* Active Stakes */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <h3 className="text-2xl font-bold text-[#060F32] mb-6">Your Active Stakes</h3>
        
        {stats.activeStakes > 0 ? (
          <div className="space-y-4">
            {/* Mock stake data */}
            <div className="flex items-center justify-between p-4 bg-[#F9FAFF] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">ETH</span>
                </div>
                <div>
                  <div className="font-semibold text-[#060F32]">Ethereum Staking</div>
                  <div className="text-sm text-[#5C6584]">2.5 ETH • 180 days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#002DCB]">18% APY</div>
                <div className="text-sm text-[#5C6584]">$6,125 staked</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-[#060F32] mb-2">No Active Stakes</h4>
            <p className="text-[#5C6584] mb-4">Start staking to earn HLS rewards</p>
            <button className="bg-[#002DCB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0045FF] transition-colors">
              Start Staking
            </button>
          </div>
        )}
      </div>

      {/* Claimable Rewards */}
      {stats.claimableRewards > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Claimable Rewards</h3>
              <p className="text-green-100">
                You have {stats.claimableRewards} HLS tokens ready to claim
              </p>
            </div>
            <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Claim Now
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PersonalizedDashboard;
