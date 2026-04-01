import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  hasCompletedOnboarding: boolean;
  setUser: (user: User | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hasCompletedOnboarding: false,
  setUser: (user) => set({ user }),
  setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  reset: () => set({ user: null, hasCompletedOnboarding: false }),
}));
