import { ethers } from "ethers";
import { useStore } from "../store/onboardingStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export interface User {
  wallet: string;
  xp: number;
  completedSteps: string[];
  referralCode?: string;
  tags?: string[];
  discordUsername?: string;
  discord?: {
    username: string;
    id?: string;
  };
}

export interface OnboardingProgress {
  success: boolean;
  progress: Array<{
    key: string;
    title: string;
    completed: boolean;
    rewards: Array<{
      type: string;
      amount: number;
    }>;
  }>;
  completedSteps: string[];
  totalSteps: number;
}

export interface XPHistoryResponse {
  success: boolean;
  xpHistory: Array<{
    _id: string;
    amount: number;
    type: string;
    description: string;
    timestamp: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalActivities: number;
  };
}

export interface DailyMissionResponse {
  success: boolean;
  data: {
    missions: Array<{
      mission: string;
      completed: boolean;
      description: string;
    }>;
    allMissionsCompleted: boolean;
    bonusAvailable: boolean;
    bonusXP: number;
  };
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: Array<{
    _id: string;
    wallet: string;
    xp: number;
    level: number;
    discordUsername: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
}

export interface TVLLeaderboardResponse {
  success: boolean;
  leaderboard: Array<{
    _id: string;
    wallet: string;
    tvl: number;
    discordUsername: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
}

export interface UserRankResponse {
  success: boolean;
  globalRank: number;
  contributorRank: number;
  userXP: number;
  userContributionXP: number;
  discordUsername: string;
}

export interface XPLevelResponse {
  success: boolean;
  currentLevel: number;
  totalXP: number;
  nextLevelXP: number;
  xpForCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressToNextLevel: number;
  isMaxLevel: boolean;
}

export interface UserReferralsResponse {
  success: boolean;
  referrals: Array<{
    _id: string;
    wallet: string;
    username?: string;
    avatar?: string;
    xp?: number;
    level?: number;
    tags?: string[];
    referralCode?: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
  referralCode: string;
  referralCount: number;
  referralXP: number;
}

export interface GlobalReferralStatsResponse {
  success: boolean;
  stats: {
    totalUsers: number;
    totalReferrals: number;
    totalReferralXP: number;
    referredUsers: number;
    activeReferrers: number;
  };
  topReferrers: Array<{
    _id: string;
    wallet: string;
    username?: string;
    referralCode: string;
    actualReferralCount: number;
    referralXP: number;
  }>;
}

export interface LiquidityPositionDTO {
  id: string;
  chain: string;
  asset: string;
  amount: number;
  amountUsd: number;
}

export interface LiquiditySummaryResponse {
  success: boolean;
  totalUsd: number;
  byChain: Array<{ chain: string; amountUsd: number }>;
  positions: LiquidityPositionDTO[];
  chainContracts: Record<string, { address: string; explorer?: string }>;
}

export interface TagsResponse {
  success: boolean;
  tags: Array<{
    name: string;
    xpMultiplier: number;
    description: string;
    autoAssigned: boolean;
    verificationRequired: boolean;
  }>;
}

export interface FaucetTokenResponse {
  success: boolean;
  message: string;
  faucetClaim?: {
    userId: string;
    wallet: string;
    amount: number;
    token: string;
    chain: string;
    status: string;
    transactionHash?: string;
  };
  xpReward?: number;
  transactionHash?: string;
}

export interface FaucetClaimHistoryResponse {
  success: boolean;
  faucetClaims: Array<{
    _id: string;
    user: string;
    wallet: string;
    amount: number;
    token: string;
    chain: string;
    status: string;
    transactionHash?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    triggeredByExternalDeposit?: boolean;
    externalDepositTxHash?: string;
    externalDepositChainId?: number;
    externalDepositUsdValue?: number;
    externalDepositAmountFormatted?: string;
    externalDepositSymbol?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalClaims: number;
  };
}

export interface FaucetEligibilityResponse {
  success: boolean;
  isEligible: boolean;
  token: string;
  chain: string;
}

export interface AvailableTokensResponse {
  success: boolean;
  tokens: Array<{
    token: string;
    chain: string;
    maxClaimAmount: number;
    cooldownHours: number;
    nativeToken: boolean;
    contractAddress?: string;
  }>;
}

export interface InviteQuotaResponse {
  success: boolean;
  data: {
    currentQuota: number;
    timestamp: string;
  };
}

export interface UserInviteStatusResponse {
  success: boolean;
  data: {
    wallet: string;
    referralCode: string;
    canInvite: boolean;
    currentQuota: number;
    usedToday: number;
    remainingInvites: number;
    timestamp: string;
  };
}

export interface QuotaStatisticsResponse {
  success: boolean;
  data: {
    statistics: Array<{
      _id: string;
      date: string;
      inviteQuota: number;
      baseInviteQuota: number;
      growthFactor: number;
      activityFactor: number;
      usersActiveToday: number;
      usersActiveYesterday: number;
      activityToday: number;
      activityNormal: number;
      createdAt: string;
      updatedAt: string;
    }>;
    period: string;
    timestamp: string;
  };
}

export interface TemporaryInviteCode {
  code: string;
  name: string;
  description?: string;
  maxUses: number;
  currentUses: number;
  usesRemaining: number;
  expiresAt?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  canBeUsed?: boolean;
}

export interface CreateTemporaryCodeRequest {
  name: string;
  description?: string;
  maxUses: number;
  expiresAt?: string;
  customCode?: string;
}

export interface CreateTemporaryCodeResponse {
  success: boolean;
  message: string;
  data: TemporaryInviteCode;
}

export interface ListTemporaryCodesResponse {
  success: boolean;
  data: {
    codes: TemporaryInviteCode[];
    pagination: {
      page: number;
      totalPages: number;
      total: number;
      limit: number;
    };
  };
}

export interface TemporaryCodeInfoResponse {
  success: boolean;
  data: TemporaryInviteCode;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage during initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("jwt_token");
    }
  }

  private getHeaders(): HeadersInit {
    // Always get the latest token from localStorage
    this.token = localStorage.getItem("jwt_token");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem("jwt_token", token);
  }

  async register(
    wallet: string,
    signature: string,
    inviteCode?: string
  ): Promise<{ token: string; user: User }> {
    try {
      const payload: { wallet: string; signature: string; inviteCode?: string } =
      {
        wallet,
        signature,
      };

      if (inviteCode) {
        payload.inviteCode = inviteCode;
      }

      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (
          response.status === 400 &&
          error.message === "Wallet already registered"
        ) {
          throw new Error("Wallet already registered");
        }
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      const token = data.token || (data.user && data.user.token);

      if (token) {
        this.setToken(token);
        return {
          token: token,
          user: data.user || data,
        };
      } else {
        throw new Error("Authentication failed: No token received");
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred during registration.");
      }
      throw error;
    }
  }

  async login(
    wallet: string,
    signature: string,
    inviteCode?: string
  ): Promise<{ token: string; user: User; requiresInviteCode?: boolean; walletAddress?: string; requiresBotVerification?: boolean }> {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet, signature, inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresBotVerification) {
          useStore.getState().setRequiresBotVerification(true);
        }
        // Re-throw the error object which may contain flags like requiresInviteCode
        throw data;
      }
      
      this.setToken(data.token);
      return data;
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.requiresBotVerification) {
        useStore.getState().setRequiresBotVerification(true);
      }
      // Re-throw error to be handled by the caller
      throw error;
    }
  }

  async verifyBot(wallet: string, signature: string, hcaptchaToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/users/verify-bot`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ wallet, signature, hcaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Bot verification failed");
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred during bot verification.");
      }
      throw error;
    }
  }

  async getOnboardingProgress(): Promise<OnboardingProgress> {
    // Onboarding is disabled on beta mainnet; return a static, completed-like payload
    return {
      success: true,
      progress: [],
      completedSteps: [],
      totalSteps: 0,
    } as OnboardingProgress;
  }

  async startOnboardingStep(
    stepKey: string
  ): Promise<{ success: boolean; step: any }> {
    // No-op: onboarding disabled
    return { success: true, step: null };
  }

  async completeOnboardingStep(
    stepKey: string,
    evidence: string
  ): Promise<{ success: boolean; step: any; rewards: any[] }> {
    // No-op: onboarding disabled
    return { success: true, step: null, rewards: [] };
  }

  async claimReward(rewardType: "xp" | "nft"): Promise<{
    success: boolean;
    reward: any;
    message: string;
    transactionHash?: string;
  }> {
    // No-op: onboarding disabled
    return { success: true, reward: null, message: "Onboarding disabled" };
  }

  async getUserXPHistory(): Promise<XPHistoryResponse> {
    try {
      const response = await fetch(`${API_URL}/users/xp/history`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch XP history");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching XP history.");
      }
      throw error;
    }
  }

  async getUserDailyMission(season?: string): Promise<DailyMissionResponse> {
    try {
      const response = await fetch(`${API_URL}/users/daily-missions?season=${season}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          try {
            const data = await response.clone().json();
            if (/jwt expired|token expired|TokenExpiredError/i.test(data?.message || '')) {
              localStorage.removeItem('jwt_token');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: data.message } }));
              }
            }
          } catch {}
        }
        throw new Error("Failed to fetch Daily Mission");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching daily missions.");
      }
      throw error;
    }
  }

  getXPHistoryPage = async (
    page: number = 1,
    limit: number = 50,
    timeframe: string = "alltime",
    seasonId?: string
  ): Promise<XPHistoryResponse | null> => {
    try {
      const res = await fetch(
        `${API_URL}/users/xp/history?timeframe=${timeframe}&page=${page}&limit=${limit}&seasonId=${seasonId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!res.ok) {
        console.error(
          `Failed to fetch leaderboard page ${page}:`,
          res.statusText
        );
        return null;
      }

      const data: XPHistoryResponse = await res.json();
      return data;
    } catch (error: any) {
       if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching XP history page.");
      }
      console.error("Error fetching leaderboard:", error);
      return null;
    }
  };

  async getLeaderboard(season?: string): Promise<LeaderboardResponse> {
    try {      
      const response = await fetch(`${API_URL}/leaderboard/global?season=${season}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching the leaderboard.");
      }
      throw error;
    }
  }

  async getLeaderboardPage(
    page: number = 1,
    limit: number = 50,
    season?: string
  ): Promise<LeaderboardResponse> {
    try {
      const response = await fetch(
        `${API_URL}/leaderboard/global?season=${season}&page=${page}&limit=${limit}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard page");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching the leaderboard page.");
      }
      throw error;
    }
  }

  async getTVLLeaderboardPage(
    page: number = 1,
    limit: number = 50
  ): Promise<TVLLeaderboardResponse> {
    try {
      const response = await fetch(
        `${API_URL}/leaderboard/tvl?page=${page}&limit=${limit}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch TVL leaderboard page");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching the TVL leaderboard page.");
      }
      throw error;
    }
  }

  async getUserRank(season?: string): Promise<UserRankResponse> {
    try {
      const response = await fetch(`${API_URL}/leaderboard/user-rank?season=${season}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user rank");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching user rank.");
      }
      throw error;
    }
  }

  async getUserXPLevel(season?: string): Promise<XPLevelResponse> {
    try {
      const response = await fetch(`${API_URL}/users/xp/level?season=${season}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          try {
            const data = await response.clone().json();
            if (/jwt expired|token expired|TokenExpiredError/i.test(data?.message || '')) {
              localStorage.removeItem('jwt_token');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: data.message } }));
              }
            }
          } catch {}
        }
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching user XP and level.");
      }
      throw error;
    }
  }

  async getSeasons(): Promise<{ success: boolean; seasons: any[] }> {
    try {
      const response = await fetch(`${API_URL}/users/seasons`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching seasons.");
      }
      throw error;
    }
  }

  async getUserProfile(wallet: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/users/profile/${wallet}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        // Detect JWT expiry
        if (response.status === 401) {
          try {
            const data = await response.clone().json();
            if (/jwt expired|token expired|TokenExpiredError/i.test(data?.message || '')) {
              // Clear token and notify app
              localStorage.removeItem('jwt_token');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: data.message } }));
              }
            }
          } catch {}
        }
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      if (data.user) {
        return data.user;
      } else {
        throw new Error("Failed to fetch user profile");
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching user profile.");
      }
      throw error;
    }
  }

  async getUserReferrals(
    page: number = 1,
    limit: number = 10
  ): Promise<UserReferralsResponse> {
    try {
      const response = await fetch(
        `${API_URL}/users/referrals?page=${page}&limit=${limit}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          try {
            const data = await response.clone().json();
            if (/jwt expired|token expired|TokenExpiredError/i.test(data?.message || '')) {
              localStorage.removeItem('jwt_token');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: data.message } }));
              }
            }
          } catch {}
        }
        throw new Error("Failed to fetch user referrals");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching user referrals.");
      }
      throw error;
    }
  }

  async getGlobalReferralStats(): Promise<GlobalReferralStatsResponse> {
    try {
      const response = await fetch(`${API_URL}/users/referrals/stats`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch global referral statistics");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching global referral stats.");
      }
      throw error;
    }
  }

  async getAllTags(): Promise<TagsResponse> {
    try {
      const response = await fetch(`${API_URL}/users/tags/all`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching tags.");
      }
      throw error;
    }
  }

  async getUserLiquidity(): Promise<LiquiditySummaryResponse> {
    try {
      const response = await fetch(`${API_URL}/users/liquidity`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch liquidity summary');
      }
      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError('A network error occurred while fetching liquidity summary.');
      }
      throw error;
    }
  }

  async requestFaucetTokens(token: string, chain: string, amount: number, turnstileToken: string): Promise<FaucetTokenResponse> {
    try {
      const response = await fetch(`${API_URL}/faucet/request`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ token, chain, amount, turnstileToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request tokens from faucet");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while requesting faucet tokens.");
      }
      throw error;
    }
  }

  async getFaucetClaimHistory(
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Promise<FaucetClaimHistoryResponse> {
    try {
      let url = `${API_URL}/faucet/history?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch faucet claim history");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching faucet claim history.");
      }
      throw error;
    }
  }

  async checkFaucetEligibility(token: string, chain: string): Promise<FaucetEligibilityResponse> {
    try {
      const response = await fetch(`${API_URL}/faucet/check-eligibility`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ token, chain }),
      });

      if (!response.ok) {
        throw new Error("Failed to check faucet eligibility");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while checking faucet eligibility.");
      }
      throw error;
    }
  }

  async getAvailableFaucetTokens(): Promise<AvailableTokensResponse> {
    try {
      const response = await fetch(`${API_URL}/faucet/available-tokens`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch available faucet tokens");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching available faucet tokens.");
      }
      throw error;
    }
  }

  async confirmAccount(
    wallet: string,
    signature: string,
    inviteCode: string,
    hcaptchaToken: string
  ): Promise<{ token: string; user: User; requiresBotVerification?: boolean }> {
    try {
      const response = await fetch(`${API_URL}/users/confirm-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet, signature, inviteCode, hcaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        // We no longer expect requiresBotVerification in the error case for this endpoint
        throw data; // Throw the full error object
      }

      // If the successful response indicates bot verification is needed
      if (data.requiresBotVerification) {
        useStore.getState().setRequiresBotVerification(true);
      } else if (data.token) {
        // If successful login/confirmation returns a token
        this.setToken(data.token);
      }

      return data;
    } catch (error: any) {
      console.error("Account confirmation failed:", error);
      // No need to check for requiresBotVerification here anymore
      throw error;
    }
  }

  async getCurrentInviteQuota(): Promise<InviteQuotaResponse> {
    try {
      const response = await fetch(`${API_URL}/invite-quota/current`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get current invite quota");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching the current invite quota.");
      }
      throw error;
    }
  }

  async getUserInviteStatus(wallet: string): Promise<UserInviteStatusResponse> {
    try {
      const response = await fetch(`${API_URL}/invite-quota/user-status`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ wallet }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get user invite status");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching user invite status.");
      }
      throw error;
    }
  }

  async getQuotaStatistics(days: number = 7): Promise<QuotaStatisticsResponse> {
    try {
      const response = await fetch(`${API_URL}/invite-quota/statistics?days=${days}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get quota statistics");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching quota statistics.");
      }
      throw error;
    }
  }

  async recalculateQuota(): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await fetch(`${API_URL}/invite-quota/recalculate`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to recalculate quota");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while triggering quota recalculation.");
      }
      throw error;
    }
  }

  async createTemporaryCode(data: CreateTemporaryCodeRequest): Promise<CreateTemporaryCodeResponse> {
    try {
      const response = await fetch(`${API_URL}/temporary-invites`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create temporary invite code");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while creating a temporary code.");
      }
      throw error;
    }
  }

  async listTemporaryCodes(
    page: number = 1,
    limit: number = 20,
    includeInactive: boolean = false
  ): Promise<ListTemporaryCodesResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeInactive: includeInactive.toString(),
      });

      const response = await fetch(`${API_URL}/temporary-invites?${params.toString()}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to list temporary invite codes");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while listing temporary codes.");
      }
      throw error;
    }
  }

  async getTemporaryCodeInfo(code: string): Promise<TemporaryCodeInfoResponse> {
    try {
      const response = await fetch(`${API_URL}/temporary-invites/${code}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get temporary invite code info");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching temporary code info.");
      }
      throw error;
    }
  }

  async getMarketingAnalytics(): Promise<{ success: boolean; data: any; timestamp: string }> {
    try {
      const response = await fetch(`${API_URL}/admin/marketing-analytics`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get marketing analytics");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while fetching marketing analytics.");
      }
      throw error;
    }
  }

  async deactivateTemporaryCode(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/temporary-invites/${code}/deactivate`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to deactivate temporary invite code");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while deactivating a temporary code.");
      }
      throw error;
    }
  }

  async cleanupExpiredCodes(): Promise<{ success: boolean; message: string; data: { deactivatedCount: number } }> {
    try {
      const response = await fetch(`${API_URL}/temporary-invites/cleanup/expired`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cleanup expired codes");
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new NetworkError("A network error occurred while cleaning up expired codes.");
      }
      throw error;
    }
  }



}

// Create and export the API client instance
export const api = new ApiClient();