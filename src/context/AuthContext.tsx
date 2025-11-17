"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, loginWithToken as apiLoginWithToken, getUserProfile, fetchWithAuth, isUsingHttpOnlyCookies } from '../services/api';
import { apiCache } from '@/utils/cache';

type User = {
  email?: string;
  verified?: boolean;
  userId?: string;
  [k: string]: any;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean; // operation in progress
  error: string | null;
  authReady: boolean; // hydration complete
  isAuthenticated: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  signup: (data: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<void> | void;
  getCurrentUser: () => Promise<void>;
  decodeToken: (token: string) => any | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function safeParseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      try {
          const token = localStorage.getItem('token');
          // If no token is present but the app is configured to use http-only cookies,
          // attempt to validate the session via the backend (cookie-based session may exist).
          if (!token) {
            if (isUsingHttpOnlyCookies()) {
              try {
                const profile = await getUserProfile();
                if (profile) {
                  const normalized = { ...profile, userId: profile.id ? String(profile.id) : profile.userId ?? profile.user_id ?? profile.sub ?? profile.id };
                  setUser(normalized);
                } else {
                  setUser(null);
                }
              } catch (e) {
                setUser(null);
              }
              setAuthReady(true);
              return;
            }

            setUser(null);
            setAuthReady(true);
            return;
          }
          const payload = safeParseJwt(token);
          if (!payload) {
            try { localStorage.removeItem('token'); } catch (_) {}
            setUser(null);
            setAuthReady(true);
            return;
          }

          // Validate token with backend. Only set `user` when server confirms the token.
          try {
            const profile = await getUserProfile();
            if (profile) {
              const normalized = { ...profile, userId: profile.id ? String(profile.id) : profile.userId ?? profile.user_id ?? profile.sub ?? profile.id };
              setUser(normalized);
            } else {
              // Backend did not validate token: remove it and remain unauthenticated
              try { localStorage.removeItem('token'); } catch (_) {}
              setUser(null);
            }
          } catch (e) {
            // On error validating token, remove token and remain unauthenticated
            try { localStorage.removeItem('token'); } catch (_) {}
            setUser(null);
          }
        setAuthReady(true);
      } catch (e) {
        try { localStorage.removeItem('token'); } catch (_) {}
        setUser(null);
        setAuthReady(true);
      }
    })();
  }, []);

  const decodeToken = (token: string) => safeParseJwt(token);

  const setTokenAndUserFromResponse = async (resData: any, providedToken?: string) => {
    const token = resData?.access_token || resData?.token || providedToken || null;
    const cookieMode = isUsingHttpOnlyCookies();

    // If a token exists and cookie mode is not in use, persist it locally.
    if (token && !cookieMode) {
      try { localStorage.setItem('token', token); } catch (_) {}
    }

    // Prefer authoritative profile from the backend when possible (works for both cookie and token flows)
    try {
      const profile = await getUserProfile();
      if (profile) {
        const normalized = { ...profile, userId: profile.id ? String(profile.id) : profile.userId ?? profile.user_id ?? profile.sub ?? profile.id };
        setUser(normalized);
        try { if (normalized.userId) localStorage.setItem('userId', String(normalized.userId)); } catch (_) {}
        return;
      }
    } catch (_) {
      // continue to fallback below
    }

    // If backend didn't provide a profile but server returned user in the login response, use that.
    if (resData?.user) {
      const userObj = {
        email: resData.user.email || undefined,
        verified: resData.user.is_verified ?? undefined,
        userId: resData.user.id ? String(resData.user.id) : undefined,
      };
      try { if (userObj.userId) localStorage.setItem('userId', String(userObj.userId)); } catch (_) {}
      setUser(userObj);
      return;
    }

    // No profile and no user info: if using cookie mode, give up but don't throw; ensure local token (if any) cleaned when not cookieMode.
    if (!cookieMode) {
      try { localStorage.removeItem('token'); } catch (_) {}
    }
    setUser(null);
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(data);
      await setTokenAndUserFromResponse(res?.data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLoginWithToken(token);
      await setTokenAndUserFromResponse(res?.data, token);
    } catch (err: any) {
      // If backend rejects token, ensure we don't accept raw JWT payloads as authenticated.
      try { localStorage.removeItem('token'); } catch (_) {}
      setUser(null);
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Token login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiSignup(data);
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Signup failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) setUser({ ...profile });
    } catch (e) {}
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt to tell the backend to invalidate this token/session if endpoint exists.
      try {
        const res = await fetchWithAuth('/auth/logout', { method: 'POST' });
        // Accept any non-fatal response; backend may return 404 if not implemented.
        if (res && (res as any).ok === false) {
          // ignore non-ok responses
        }
      } catch (e) {
        // ignore network errors during logout call
      }

      // Clear client-side stored auth
      try { localStorage.removeItem('token'); } catch (_) {}
      try { localStorage.removeItem('userId'); } catch (_) {}

      // Clear any API caches
      try { apiCache.clear(); } catch (_) {}

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    authReady,
    isAuthenticated: !!user,
    login,
    loginWithToken,
    signup,
    logout,
    getCurrentUser,
    decodeToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
