"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { login as apiLogin, signup as apiSignup, loginWithToken as apiLoginWithToken, getUserProfile, fetchWithAuth } from '../services/api';
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
  const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
  // Router for redirects
  const router = useRouter();

  useEffect(() => {
    const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
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

        // Immediately hydrate user from JWT so UI and route guards respond quickly.
        const jwtUser = {
          email: payload.email || undefined,
          verified: payload.verified ?? payload.is_verified ?? undefined,
          userId: payload.sub ? String(payload.sub) : payload.userId ? String(payload.userId) : payload.id ? String(payload.id) : undefined,
          // keep full payload available for consumers if needed
          __jwt_payload: payload,
        } as any;
        setUser(jwtUser);
        try { (window as any).__fh_last_auth = { ts: Date.now(), source: 'hydrate_jwt', user: jwtUser }; } catch (_) {}
        if (isDev) console.log('[Auth] hydrated user from JWT payload:', jwtUser);

        // Mark hydration complete so route guards can run. Backend validation runs asynchronously.
        setAuthReady(true);

        // Run backend validation asynchronously — do NOT block UI/redirect on this.
        (async () => {
          try {
            const profile = await getUserProfile();
            if (profile) {
              const normalized = { ...profile, userId: profile.id ? String(profile.id) : profile.userId ?? profile.user_id ?? profile.sub ?? profile.id };
              setUser(normalized);
              try { (window as any).__fh_last_auth = { ts: Date.now(), source: 'validate_profile', user: normalized }; } catch (_) {}
              if (isDev) console.log('[Auth] validated profile and updated user:', normalized);
            } else {
              // If backend has no profile endpoint or returns null, keep JWT-hydrated user.
              if (isDev) console.log('[Auth] profile validation returned no profile; keeping JWT-hydrated user');
            }
          } catch (e) {
            console.warn('[Auth] Backend validation failed (non-blocking):', e);
          }
        })();
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
    // Also set a client-side cookie so Edge Middleware (which checks cookies)
    // can see the token during server-side navigation. Prefer a session cookie
    // whose expiry matches the JWT `exp` claim if present.
    try {
      if (typeof document !== 'undefined') {
        try {
          const payload = safeParseJwt(token);
          let cookieStr = `token=${token}; path=/;`;
          if (payload && payload.exp) {
            const expires = new Date(payload.exp * 1000).toUTCString();
            cookieStr += ` expires=${expires};`;
          }
          // Note: not setting HttpOnly here because JavaScript must set cookie for middleware visibility
          document.cookie = cookieStr;
        } catch (e) {
          // fallback to simple cookie
          document.cookie = `token=${token}; path=/;`;
        }
      }
    } catch (_) {}

    // Support two backend shapes:
    // A) { access_token, user: { ... } }
    // B) { access_token, id, email, verified, ... }
    let userResp = resData?.user;

    if (!userResp) {
      const possible = {
        email: resData?.email,
        verified: resData?.verified ?? resData?.is_verified,
        userId: resData?.id ?? resData?.userId ?? resData?.sub,
        ...resData,
      };

      const hasUserFields = Boolean(possible.email || possible.userId);
      if (hasUserFields) userResp = possible;
    }

    if (!userResp) {
      // Keep token if present but warn — avoid the bug that cleared token when
      // backend returned user fields at root instead of inside `user`.
      console.warn('[Auth] Login response missing usable user data:', resData);
      // Do not clear token here — keep JWT-hydrated state (other flows may validate)
      setUser(null);
      try { (window as any).__fh_last_auth = { ts: Date.now(), source: 'login_missing_user', raw: resData }; } catch (_) {}
      return;
    }

    const userObj = {
      email: userResp.email ?? undefined,
      verified: userResp.verified ?? userResp.is_verified ?? undefined,
      userId: String(userResp.userId ?? userResp.id ?? userResp.sub),
      ...userResp,
    } as any;

    try { if (userObj.userId) localStorage.setItem('userId', String(userObj.userId)); } catch (_) {}
    setUser(userObj);
    try { (window as any).__fh_last_auth = { ts: Date.now(), source: 'login_response', user: userObj }; } catch (_) {}
    if (isDev) console.log('[Auth] setUser from login response:', userObj);
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      // `api.login` now returns a normalized payload: { access_token, user }
      const payload = await apiLogin(data);
      await setTokenAndUserFromResponse(payload);
    } catch (err: any) {
      const msg = err?.serverData?.detail || err?.serverData?.message || err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Login failed';
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
      // `api.loginWithToken` may return axios response; normalize shape if needed
      const res = await apiLoginWithToken(token);
      const payload = (res && (res as any).data) ? (res as any).data : res;
      await setTokenAndUserFromResponse(payload, token);
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
      if (profile) {
        setUser({ ...profile });
        try { (window as any).__fh_last_auth = { ts: Date.now(), source: 'getCurrentUser', user: profile }; } catch (_) {}
        if (isDev) console.log('[Auth] getCurrentUser setUser:', profile);
      }
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

      // Clear any client-side cookie token used by middleware
      try {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (_) {}

      // Clear any API caches
      try { apiCache.clear(); } catch (_) {}

      // Unregister service worker (best-effort) to avoid cached authenticated assets
      try {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => { reg.unregister().catch(() => {}); })
            .catch(() => {});
        }
      } catch (_) {}

      setUser(null);

      // Redirect to login and replace history so Back doesn't return to protected page
      try {
        if (router && typeof router.replace === 'function') {
          router.replace('/login');
        } else if (typeof window !== 'undefined') {
          window.location.replace('/login');
        }
      } catch (_) {
        try { if (typeof window !== 'undefined') window.location.replace('/login'); } catch (_) {}
      }
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
