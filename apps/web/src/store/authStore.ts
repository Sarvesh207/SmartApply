import { create } from 'zustand';
import { UserProfile } from '@smartapply/shared';

export const SMARTAPPLY_AUTH_SESSION_KEY = 'sa_auth_session';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

function getStoredSession(): Pick<AuthState, 'token' | 'user'> {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  try {
    const rawSession = localStorage.getItem(SMARTAPPLY_AUTH_SESSION_KEY);
    if (!rawSession) {
      return { token: null, user: null };
    }

    const session = JSON.parse(rawSession);
    return {
      token: session.token || null,
      user: session.user || null,
    };
  } catch {
    localStorage.removeItem(SMARTAPPLY_AUTH_SESSION_KEY);
    return { token: null, user: null };
  }
}

const storedSession = getStoredSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: storedSession.token,
  user: storedSession.user,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SMARTAPPLY_AUTH_SESSION_KEY, JSON.stringify({ token, user }));
      window.dispatchEvent(new CustomEvent('smartapply:auth-session-updated'));
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SMARTAPPLY_AUTH_SESSION_KEY);
      window.dispatchEvent(new CustomEvent('smartapply:auth-session-updated'));
    }
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));
