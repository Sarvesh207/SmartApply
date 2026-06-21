import { create } from 'zustand';
import { UserProfile } from '@smartapply/shared';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  setAuth: (token, user) => {
    set({ token, user });
  },
  logout: () => {
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));
