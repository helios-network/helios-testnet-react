// store/onboardingStore.ts
import { create } from "zustand";
import { api, User, OnboardingProgress } from "../services/api";

interface OnboardingState {
  step: number;
  xp: number;
  user: User | null;
  isUserLoading: boolean;
  onboardingProgress: OnboardingProgress | null;
  requiresBotVerification: boolean;
  setStep: (step: number) => void;
  addXP: (amount: number) => void;
  setUser: (user: User | null) => void;
  setOnboardingProgress: (progress: OnboardingProgress) => void;
  setRequiresBotVerification: (requires: boolean) => void;
  fetchUser: () => Promise<void>;
  fetchOnboardingProgress: () => Promise<void>;
  initialize: (user?: User | null) => Promise<void>;
  resetStore: () => void;
  logout: () => void;
}

export const useStore = create<OnboardingState>((set, get) => ({
  step: 0,
  xp: 0,
  user: null,
  isUserLoading: true,
  onboardingProgress: null,
  requiresBotVerification: false,

  setStep: (step) => set({ step }),
  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
  setUser: (user) => set({ user }),
  setOnboardingProgress: (progress) => set({ onboardingProgress: progress }),
  setRequiresBotVerification: (requires) => set({ requiresBotVerification: requires }),
  
  fetchUser: async () => {
    const { user } = get();
    if (!user?.wallet) return; // Only fetch if we have a wallet address
    set({ isUserLoading: true });
    try {
      const updatedUser = await api.getUserProfile(user.wallet);
      console.log("User data from API in fetchUser:", updatedUser);
      set({ user: updatedUser });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // Don't clear user data on error, might be a temporary issue
    } finally {
      set({ isUserLoading: false });
    }
  },

  resetStore: () => set({
    step: 0,
    xp: 0,
    user: null,
    isUserLoading: false,
    onboardingProgress: null,
    requiresBotVerification: false,
  }),
  
  logout: () => {
    localStorage.removeItem("jwt_token");
    set({
      step: 0,
      user: null,
      onboardingProgress: null,
      requiresBotVerification: false,
    });
  },

  fetchOnboardingProgress: async () => {
    try {
      const progress = await api.getOnboardingProgress();
      set({ onboardingProgress: progress });
    } catch (error) {
      console.error("Failed to fetch onboarding progress:", error);
    }
  },

  initialize: async (user?: User | null) => {
    if (typeof window === "undefined") return; // Prevent server-side access to localStorage

    const token = localStorage.getItem("jwt_token");
    console.log("token", token);
    if (token) {
      try {
        set({ isUserLoading: true });
        // First try to check if the token is for a valid account that's confirmed
        try {
          if (user) {
            // If user object is passed, use it directly
            set({ user });
          } else {
            // Otherwise, decode wallet from token to fetch user profile immediately
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            if (decodedToken.wallet) {
              // Set a temporary user object to satisfy dependencies, then fetch full profile
              set({ user: { wallet: decodedToken.wallet } as User });
              await get().fetchUser();
            }
          }

          const progress = await api.getOnboardingProgress();
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

          if (progressError.response?.data?.requiresBotVerification) {
            console.log("Account requires bot verification");
            set({ requiresBotVerification: true });
            // Don't throw an error, let the UI handle the verification step
            return;
          }
          
          // For other errors, just reset and let the user try again
          localStorage.removeItem("jwt_token");
          set({ step: 0 });
          throw progressError; // Re-throw to be caught by the outer catch
        }
      } catch (error: any) {
        console.error("Failed to initialize:", error);
        set({ isUserLoading: false });
        
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

        if (error.response?.data?.requiresBotVerification) {
          console.log("Account requires bot verification");
          set({ requiresBotVerification: true });
          return;
        }
        
        // For other errors, reset to connect wallet
        set({ step: 0 });
      }
    } else {
      set({ step: 0 }); // No token, go to connect wallet
    }
  },
}));
