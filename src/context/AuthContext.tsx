"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { login as apiLogin, signup as apiSignup, loginWithToken as apiLoginWithToken } from '../services/api';
import { apiCache } from '@/utils/cache';

interface User {
  email: string;
  verified?: boolean;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: { email: string; password: string }) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  signup: (data: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  getCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup' || 
          pathname === '/forgot-password' || pathname === '/reset-password' || 
          pathname === '/verify-email' || pathname === '/verification-required' ||
          pathname === '/pricing' || pathname === '/resend-verification';

      getCurrentUser().then(currentUser => {
        if (!isPublicPage && !currentUser && pathname !== '/login') {
          // Only redirect to /login if not already on /login and not during login attempt
          router.replace('/login');
        } else {
          setLoading(false);
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        }
      });
    }
  }, [router.pathname]);

  const getCurrentUser = async () => {
    // Only run on client-side
    if (typeof window === 'undefined') return null;
    
    try {
      // JWT in localStorage approach per API docs
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return null;
      }

      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userInfo = {
          email: payload.email || payload.sub || '',
          verified: payload.verified ?? payload.is_verified ?? true,
          userId: payload.sub || payload.user_id || payload.id
        };
        console.log('[Auth] Decoded user from JWT:', userInfo);
        setUser(userInfo);
        return userInfo;
      } catch (e) {
        // If token is invalid, remove it
        console.error('[Auth] Invalid token:', e);
        localStorage.removeItem('token');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('[Auth] getCurrentUser error:', error);
      setUser(null);
      return null;
    }
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(data);
      console.log('[Auth] Login response:', res.data);
      
      // Backend returns { access_token, token_type, user: { id, email, is_verified } }
      if (res.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
        
        // Set user from response user object or decode token
        // Derive userId from response user object or from JWT `sub` if backend omits `userId` field
        let tokenUserId: string | undefined;
        try {
          const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
          tokenUserId = payload?.userId || payload?.user_id || payload?.sub || payload?.id;
        } catch (e) {
          tokenUserId = undefined;
        }
        const userInfo = {
          email: res.data.user?.email || data.email,
          verified: res.data.user?.is_verified ?? true,
          userId: res.data.user?.id || tokenUserId
        };
        // Persist userId for any parts of the app that read it directly
        try { if (userInfo.userId) localStorage.setItem('userId', String(userInfo.userId)); } catch (_) {}
        console.log('[Auth] Login successful, user:', userInfo);
        setUser(userInfo);
        try {
          // Ensure immediate SPA redirect after successful login so production builds
          // don't accidentally suppress navigation due to timing/guard logic on the login page.
          router.replace('/dashboard').catch((err) => {
            console.warn('[Auth] router.replace failed after login', err);
          });
        } catch (e) {
          console.warn('[Auth] Failed to invoke router.replace after login', e);
        }
      } else {
        setUser(null);
        setError(res.data?.detail || res.data?.message || 'Login failed');
      }
    } catch (err: any) {
      setUser(null);
      
      // Enhanced error handling
      let errorMsg = 'Login failed';
      
      if (err?.response?.status === 401) {
        errorMsg = 'Invalid email or password.';
      } else if (err?.response?.status === 403) {
        errorMsg = err?.response?.data?.detail || 'Access denied. Please verify your email address.';
      } else if (err?.response?.status === 404) {
        errorMsg = 'Account not found. Please check your email or sign up.';
      } else if (err?.response?.status >= 500) {
        errorMsg = 'Server error. Please try again later.';
      } else {
        errorMsg = err?.response?.data?.detail ||
                   err?.response?.data?.message ||
                   err?.message ||
                   'Login failed. Please try again.';
      }
      
      setError(errorMsg);
      console.error('[Auth] Login error:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLoginWithToken(token);
      
      // Handle JWT token approach
      if (res.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
        
        // Get user info from token or response
        let tokenUserId: string | undefined;
        try {
          const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
          tokenUserId = payload?.userId || payload?.user_id || payload?.sub || payload?.id;
        } catch (e) {
          tokenUserId = undefined;
        }
        const userInfo = {
          email: res.data.user?.email || '',
          verified: res.data.user?.is_verified ?? true,
          userId: res.data.user?.id || tokenUserId
        };
        try { if (userInfo.userId) localStorage.setItem('userId', String(userInfo.userId)); } catch (_) {}
        setUser(userInfo);
      } else {
        setUser(null);
        setError(res.data?.detail || res.data?.message || 'Login failed');
      }
    } catch (err: any) {
      setUser(null);
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        'Login with token failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiSignup(data);
      // Do NOT auto-login after signup; let backend decide next step (e.g., email verification)
      // Do not set user or token here
      if (res.data?.message) {
        setError(null);
        setInfo(res.data.message);
      }
      return res;
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        'Signup failed'
      );
      setInfo(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Remove JWT token from localStorage
    localStorage.removeItem('token');
    
    // Clear API cache on logout to prevent data leakage
    apiCache.clear();
    
    // Clear any other user-specific data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('user') || key.includes('form') || key.includes('cache'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear user state
    setUser(null);
    
    console.log('[Auth] Logout complete');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithToken, signup, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
