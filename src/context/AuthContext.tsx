"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, loginWithToken as apiLoginWithToken, getUserProfile } from '../services/api';

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
        if (!token) {
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

        try {
          const profile = await getUserProfile();
          if (profile) {
            const normalized = { ...profile, userId: profile.id ? String(profile.id) : profile.userId ?? profile.user_id ?? profile.sub ?? profile.id };
            setUser(normalized);
          } else {
            setUser({ email: payload.email, verified: payload.is_verified ?? payload.verified, userId: String(payload.userId ?? payload.user_id ?? payload.sub ?? payload.id) });
          }
        } catch (e) {
          setUser({ email: payload.email, verified: payload.is_verified ?? payload.verified, userId: String(payload.userId ?? payload.user_id ?? payload.sub ?? payload.id) });
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
    if (!token) throw new Error('No token available');
    try { localStorage.setItem('token', token); } catch (_) {}
    const payload = safeParseJwt(token);
    try {
      const profile = await getUserProfile();
      if (profile) {
        const normalized = { ...profile, userId: profile.id ? String(profile.id) : profile.userId ?? profile.user_id ?? profile.sub ?? profile.id };
        setUser(normalized);
        try { if (normalized.userId) localStorage.setItem('userId', String(normalized.userId)); } catch (_) {}
        return;
      }
    } catch (_) {}

    const userObj = {
      email: resData?.user?.email || payload?.email || undefined,
      verified: resData?.user?.is_verified ?? payload?.is_verified ?? payload?.verified ?? undefined,
      userId: resData?.user?.id ? String(resData.user.id) : payload ? String(payload?.userId ?? payload?.user_id ?? payload?.sub ?? payload?.id) : undefined,
    };
    try { if (userObj.userId) localStorage.setItem('userId', String(userObj.userId)); } catch (_) {}
    setUser(userObj);
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
      try { localStorage.setItem('token', token); } catch (_) {}
      const payload = safeParseJwt(token);
      setUser({ email: payload?.email, verified: payload?.is_verified ?? payload?.verified, userId: payload?.userId ?? payload?.user_id ?? payload?.sub ?? payload?.id });
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
    try { if (typeof window !== 'undefined') localStorage.removeItem('token'); } catch (_) {}
    setUser(null);
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
