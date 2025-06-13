// store/onboardingStore.ts
import { create } from "zustand";
import { api, User, OnboardingProgress } from "../services/api";

interface OnboardingState {
  step: number;
  xp: number;
  user: User | null;
  onboardingProgress: OnboardingProgress | null;
  isLoading: boolean;
  loadingMessage: string;
  setStep: (step: number) => void;
  addXP: (amount: number) => void;
  setUser: (user: User | null) => void;
  setOnboardingProgress: (progress: OnboardingProgress) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  fetchOnboardingProgress: () => Promise<void>;
  initialize: () => Promise<void>;
  resetStore: () => void;
}

export const useStore = create<OnboardingState>((set, get) => ({
  step: 0,
  xp: 0,
  user: null,
  onboardingProgress: null,
  isLoading: false,
  loadingMessage: "Loading...",

  setStep: (step) => set({ step }),
  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
  setUser: (user) => set({ user }),
  setOnboardingProgress: (progress) => set({ onboardingProgress: progress }),
  setLoading: (isLoading, message = "Loading...") => set({ isLoading, loadingMessage: message }),
  
  resetStore: () => set({
    step: 0,
    xp: 0,
    user: null,
    onboardingProgress: null,
    isLoading: false,
    loadingMessage: "Loading..."
  }),

  fetchOnboardingProgress: async () => {
    const { setLoading } = get();
    try {
      setLoading(true, "Fetching onboarding progress...");
      const progress = await api.getOnboardingProgress();
      set({ onboardingProgress: progress });
    } catch (error) {
      console.error("Failed to fetch onboarding progress:", error);
      throw error; // Re-throw to allow callers to handle
    } finally {
      setLoading(false);
    }
  },

  initialize: async () => {
    if (typeof window === "undefined") return; // Prevent server-side access to localStorage

    const { setLoading } = get();
    const token = localStorage.getItem("jwt_token");
    console.log("token", token);
    
    if (token) {
      try {
        setLoading(true, "Verifying your account...");
        
        // CRITICAL: We must get a successful API response before proceeding to any authenticated step
        // If API fails due to lag/timeout, we should NOT default to onboarding
        const progress = await api.getOnboardingProgress();
        console.log("progress", progress);
        
        // Only proceed if we successfully got progress data
        if (progress && progress.success !== false) {
          set({ onboardingProgress: progress });

          if (
            Array.isArray(progress.completedSteps) &&
            progress.completedSteps?.length >= 3
          ) {
            set({ step: 7 }); // Go to dashboard
          } else if (
            Array.isArray(progress.completedSteps) &&
            progress.completedSteps?.length > 0
          ) {
            const stepMapping: { [key: string]: number } = {
              add_helios_network: 3,
              claim_from_faucet: 4,
              mint_early_bird_nft: 5,
            };
            const lastCompletedStep =
              progress.completedSteps[progress.completedSteps.length - 1];
            const nextStep = stepMapping[lastCompletedStep] + 1;
            set({ step: nextStep });
          } else {
            set({ step: 2 }); // Start onboarding - only if API confirms this
          }
        } else {
          // Invalid progress response - treat as error
          throw new Error("Invalid progress response from server");
        }
        
      } catch (error: any) {
        console.error("Failed to initialize:", error);
        
        // Check for account confirmation errors
        if (error.message?.includes("not confirmed") || 
            error.response?.status === 403 || 
            error.requiresInviteCode) {
          
          console.log("Account exists but needs confirmation");
          
          // Clear token since it's invalid until account is confirmed
          localStorage.removeItem("jwt_token");
          
          // Set step to 0 to show connect wallet screen
          set({ step: 0 });
          
          // Create a custom error with the requiresInviteCode flag
          const confirmationError = new Error("Account not confirmed. Please provide a valid invite code.");
          (confirmationError as any).requiresInviteCode = true;
          
          // Re-throw the error with the confirmation flag
          throw confirmationError;
        }
        
        // For ANY other error (including timeouts, network issues, server errors):
        // DO NOT proceed to onboarding - stay on connect wallet screen
        console.log("API error during initialization - clearing token and staying on connect screen");
        localStorage.removeItem("jwt_token");
        set({ step: 0 });
        
        // Don't throw the error - just stay on connect screen
        // The user can try connecting again
      } finally {
        setLoading(false);
      }
    } else {
      set({ step: 0 }); // No token, go to connect wallet
    }
  },
}));
