import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuthenticated: (isAuthenticated: boolean) => void;
  finishInitialization: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isInitialized: false,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  finishInitialization: () => set({ isInitialized: true }),
  reset: () => set({ isAuthenticated: false }),
}));
