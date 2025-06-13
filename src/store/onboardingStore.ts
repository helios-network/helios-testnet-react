// store/onboardingStore.ts
import { create } from "zustand";
import { api, User, OnboardingProgress } from "../services/api";

interface OnboardingState {
  step: number;
  xp: number;
  user: User | null;
  onboardingProgress: OnboardingProgress | null;
  setStep: (step: number) => void;
  addXP: (amount: number) => void;
  setUser: (user: User | null) => void;
  setOnboardingProgress: (progress: OnboardingProgress) => void;
  fetchOnboardingProgress: () => Promise<void>;
  initialize: () => Promise<void>;
  resetStore: () => void;
}

export const useStore = create<OnboardingState>((set, get) => ({
  step: 0,
  xp: 0,
  user: null,
  onboardingProgress: null,

  setStep: (step) => set({ step }),
  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
  setUser: (user) => set({ user }),
  setOnboardingProgress: (progress) => set({ onboardingProgress: progress }),
  
  resetStore: () => set({
    step: 0,
    xp: 0,
    user: null,
    onboardingProgress: null
  }),

  fetchOnboardingProgress: async () => {
    try {
      const progress = await api.getOnboardingProgress();
      set({ onboardingProgress: progress });
    } catch (error) {
      console.error("Failed to fetch onboarding progress:", error);
    }
  },

  initialize: async () => {
    if (typeof window === "undefined") return; // Prevent server-side access to localStorage

    const token = localStorage.getItem("jwt_token");
    console.log("token", token);
    if (token) {
      try {
        // First try to check if the token is for a valid account that's confirmed
        try {
          const progress = await api.getOnboardingProgress();
          console.log("progress", progress);
          set({ onboardingProgress: progress });

          if (Array.isArray(progress.completedSteps)) {
            if (progress.completedSteps.length >= 3) {
              set({ step: 7 }); // Go to dashboard
            } else if (progress.completedSteps.length > 0) {
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
          } else {
            throw new Error(
              "Invalid onboarding progress data: completedSteps is not an array."
            );
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
      }
    } else {
      set({ step: 0 }); // No token, go to connect wallet
    }
  },
}));
