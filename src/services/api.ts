import { ethers } from "ethers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface User {
  wallet: string;
  xp: number;
  completedSteps: string[];
  referralCode?: string;
  tags?: string[];
  discordUsername?: string;
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
    console.log("Register Result", response);

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

    // Get token either from data.token or from data.user.token
    const token = data.token || (data.user && data.user.token);

    if (token) {
      console.log("register jwt token", token);
      this.setToken(token);

      // Create a standardized response structure
      return {
        token: token,
        user: data.user || data,
      };
    } else {
      console.error("No token received from registration response");
      throw new Error("Authentication failed: No token received");
    }
  }

  async login(
    wallet: string,
    signature: string
  ): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ wallet, signature }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    // Get token either from data.token or from data.user.token
    const token = data.token || (data.user && data.user.token);

    if (token) {
      console.log("login jwt token", token);
      this.setToken(token);

      // Create a standardized response structure
      return {
        token: token,
        user: data.user || data,
      };
    } else {
      console.error("No token received from login response");
      throw new Error("Authentication failed: No token received");
    }
  }

  async getOnboardingProgress(): Promise<OnboardingProgress> {
    const response = await fetch(`${API_URL}/users/onboarding/progress`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch onboarding progress");
    }

    return response.json();
  }

  async startOnboardingStep(
    stepKey: string
  ): Promise<{ success: boolean; step: any }> {
    const response = await fetch(`${API_URL}/users/onboarding/start`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ stepKey }),
    });

    if (!response.ok) {
      throw new Error("Failed to start onboarding step");
    }

    return response.json();
  }

  async completeOnboardingStep(
    stepKey: string,
    evidence: string
  ): Promise<{ success: boolean; step: any; rewards: any[] }> {
    const response = await fetch(`${API_URL}/users/onboarding/complete`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ stepKey, evidence }),
    });

    if (!response.ok) {
      throw new Error("Failed to complete onboarding step");
    }

    return response.json();
  }

  async claimReward(rewardType: "xp" | "nft"): Promise<{
    success: boolean;
    reward: any;
    message: string;
    transactionHash?: string;
  }> {
    const response = await fetch(`${API_URL}/users/onboarding/claim-reward`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ rewardType }),
    });

    if (!response.ok) {
      throw new Error("Failed to claim reward");
    }

    return response.json();
  }

  async getUserXPHistory(): Promise<XPHistoryResponse> {
    const response = await fetch(`${API_URL}/users/xp/history`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch XP history");
    }

    return response.json();
  }

  async getUserDailyMission(): Promise<DailyMissionResponse> {
    const response = await fetch(`${API_URL}/users/daily-missions`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Daily Mission");
    }

    return response.json();
  }

  getXPHistoryPage = async (
    page: number = 1,
    limit: number = 50,
    timeframe: string = "alltime"
  ): Promise<XPHistoryResponse | null> => {
    try {
      const res = await fetch(
        `${API_URL}/users/xp/history?timeframe=${timeframe}&page=${page}&limit=${limit}`,
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
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return null;
    }
  };

  async getLeaderboard(): Promise<LeaderboardResponse> {
    const response = await fetch(`${API_URL}/leaderboard/global`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Daily Mission");
    }

    return response.json();
  }

  async getUserRank(): Promise<UserRankResponse> {
    const response = await fetch(`${API_URL}/leaderboard/user-rank`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Daily Mission");
    }

    return response.json();
  }

  async getUserXPLevel(): Promise<XPLevelResponse> {
    const response = await fetch(`${API_URL}/users/xp/level`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch XP level");
    }

    return response.json();
  }

  async getUserProfile(wallet: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/profile/${wallet}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await response.json();
    if (data.user) {
      return data.user;
    } else {
      throw new Error("Failed to fetch user profile");
    }
  }

  async getUserReferrals(
    page: number = 1,
    limit: number = 10
  ): Promise<UserReferralsResponse> {
    const response = await fetch(
      `${API_URL}/users/referrals?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user referrals");
    }

    return response.json();
  }

  async getGlobalReferralStats(): Promise<GlobalReferralStatsResponse> {
    const response = await fetch(`${API_URL}/users/referrals/stats`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch global referral statistics");
    }

    return response.json();
  }

  async getAllTags(): Promise<TagsResponse> {
    const response = await fetch(`${API_URL}/users/tags/all`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tags");
    }

    return response.json();
  }

  async requestFaucetTokens(token: string, chain: string, amount: number): Promise<FaucetTokenResponse> {
    const response = await fetch(`${API_URL}/faucet/request`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ token, chain, amount }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to request tokens from faucet");
    }

    return response.json();
  }

  async getFaucetClaimHistory(
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Promise<FaucetClaimHistoryResponse> {
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
  }

  async checkFaucetEligibility(token: string, chain: string): Promise<FaucetEligibilityResponse> {
    const response = await fetch(`${API_URL}/faucet/check-eligibility`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ token, chain }),
    });

    if (!response.ok) {
      throw new Error("Failed to check faucet eligibility");
    }

    return response.json();
  }

  async getAvailableFaucetTokens(): Promise<AvailableTokensResponse> {
    const response = await fetch(`${API_URL}/faucet/available-tokens`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available faucet tokens");
    }

    return response.json();
  }
}

export const api = new ApiClient();
