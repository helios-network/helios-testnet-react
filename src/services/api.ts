import { ethers } from "ethers";

const API_URL = "https://testnet-api.helioschain.network/api";

export interface User {
  wallet: string;
  xp: number;
  completedSteps: string[];
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
  completedSteps: number;
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
    signature: string
  ): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ wallet, signature }),
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
      throw new Error("Registration failed");
    }

    const data = await response.json();
    console.log("register jwt token", data.token);
    this.setToken(data.token);
    return data;
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
    console.log("login jwt token", data.token);
    this.setToken(data.token);
    return data;
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
}

export const api = new ApiClient();
