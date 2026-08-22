import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type OnboardingStep = 'profile' | 'interests';

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  isHydrated: boolean;
  onboardingStep: OnboardingStep | null;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setOnboardingStep: (step: OnboardingStep | null) => void;
  finishInitialization: () => void;
  finishHydration: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isInitialized: false,
      isHydrated: false,
      onboardingStep: null,
      setAuthenticated: (isAuthenticated) =>
        set((state) => ({
          isAuthenticated,
          onboardingStep: isAuthenticated ? state.onboardingStep : null,
        })),
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      finishInitialization: () => set({ isInitialized: true }),
      finishHydration: () => set({ isHydrated: true }),
      reset: () => set({ isAuthenticated: false, onboardingStep: null }),
    }),
    {
      name: 'hangsha-auth-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ onboardingStep: state.onboardingStep }),
      onRehydrateStorage: (state) => () => state.finishHydration(),
    },
  ),
);
