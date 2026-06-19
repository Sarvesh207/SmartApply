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
  token: localStorage.getItem('sa_token'),
  user: (() => {
    const savedUser = localStorage.getItem('sa_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })(),
  setAuth: (token, user) => {
    localStorage.setItem('sa_token', token);
    localStorage.setItem('sa_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));
