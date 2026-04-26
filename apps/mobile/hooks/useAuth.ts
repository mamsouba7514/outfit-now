import type { UserProfile, LoginRequest, SignupRequest } from '@outfit-now/shared-types';
import { useEffect } from 'react';
import { create } from 'zustand';

import { identifyUser, resetAnalytics, track } from '../lib/analytics';
import { getAccessToken } from '../lib/api';
import { getMe, login, logout, signup } from '../lib/auth';
import { unregisterPushToken } from '../lib/notifications';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (data) => {
    const user = await login(data);
    identifyUser(user.id, { email: user.email, tier: user.tier });
    set({ user, isAuthenticated: true });
  },

  signup: async (data) => {
    const user = await signup(data);
    identifyUser(user.id, { email: user.email, tier: user.tier });
    track.signupCompleted('email');
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await unregisterPushToken().catch(() => {}); // best-effort
    await logout();
    resetAnalytics();
    set({ user: null, isAuthenticated: false });
  },

  refresh: async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await getMe();
      identifyUser(user.id, { email: user.email, tier: user.tier });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    void store.refresh();
  }, []);

  return store;
}
