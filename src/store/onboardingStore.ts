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
        setLoading(true, "Initializing your account...");
        
        // First try to check if the token is for a valid account that's confirmed
        try {
          const progress = await api.getOnboardingProgress();
          console.log("progress", progress);
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
            set({ step: 2 }); // Start onboarding
          }
        } catch (progressError: any) {
          console.error("Failed to get progress:", progressError);
          
          // Check if this is because the account is not confirmed
          if (progressError.message?.includes("not confirmed") || 
              progressError.response?.status === 403 || 
              progressError.requiresInviteCode) {
            
            // Account exists but requires confirmation
            console.log("Account exists but needs confirmation");
            
            // Create a custom error with the requiresInviteCode flag
            const confirmationError = new Error("Account not confirmed. Please provide a valid invite code.");
            (confirmationError as any).requiresInviteCode = true;
            
            // Clear token since it's invalid until account is confirmed
            localStorage.removeItem("jwt_token");
            
            // Reset to step 0 to show the connect wallet screen where user can confirm account
            set({ step: 0 });
            
            // Re-throw with confirmation flag
            throw confirmationError;
          }
          
          // For other errors, just reset and let the user try again
          localStorage.removeItem("jwt_token");
          set({ step: 0 });
          throw progressError; // Re-throw to be caught by the outer catch
        }
      } catch (error: any) {
        console.error("Failed to initialize:", error);
        
        // Check for account confirmation errors
        if (error.message?.includes("not confirmed") || 
            error.response?.status === 403 || 
            error.requiresInviteCode) {
          
          // Create a custom error with the requiresInviteCode flag
          const confirmationError = new Error("Account not confirmed. Please provide a valid invite code.");
          (confirmationError as any).requiresInviteCode = true;
          
          // Clear token since it's invalid
          localStorage.removeItem("jwt_token");
          
          // Set step to 0 to show connect wallet screen
          set({ step: 0 });
          
          // Re-throw the error with the confirmation flag
          throw confirmationError;
        }
        
        // For other errors, reset to connect wallet
        set({ step: 0 });
      } finally {
        setLoading(false);
      }
    } else {
      set({ step: 0 }); // No token, go to connect wallet
    }
  },
}));
