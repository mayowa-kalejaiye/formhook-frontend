"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { login as apiLogin, signup as apiSignup, loginWithToken as apiLoginWithToken, isUsingHttpOnlyCookies } from '../services/api';
import { apiCache } from '@/utils/cache';

// Check if we're using HTTP-only cookies
const useHttpOnlyCookies = isUsingHttpOnlyCookies();

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
                          pathname === '/pricing';

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
    
    // Determine if we should use the proxy based on environment
    const isProduction = window.location.hostname !== 'localhost';
    const shouldUseProxy = isProduction;
    
    try {
      if (useHttpOnlyCookies) {
        // When using HTTP-only cookies, we need to make an API call to get the user info
        const response = await fetch(shouldUseProxy ? '/api/proxy' : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/me`, {
          method: shouldUseProxy ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          ...(shouldUseProxy ? {
            body: JSON.stringify({
              url: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/me`,
              method: 'GET',
              data: {}
            })
          } : {
            credentials: 'include'
          })
        });

        if (!response.ok) {
          setUser(null);
          return null;
        }

        const data = await response.json();

        if (data.email) {
          const userInfo = {
            email: data.email,
            verified: data.verified ?? true,
            userId: data.id || data.user_id
          };
          setUser(userInfo);
          return userInfo;
        } else {
          setUser(null);
          return null;
        }
      } else {
        // JWT in localStorage approach
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          return null;
        }

        try {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userInfo = {
            email: payload.email || '',
            verified: payload.verified ?? true,
            userId: payload.sub || payload.id
          };
          setUser(userInfo);
          return userInfo;
        } catch (e) {
          // If token is invalid, remove it
          localStorage.removeItem('token');
          setUser(null);
          return null;
        }
      }
    } catch (error) {
      setUser(null);
      return null;
    }
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(data);
      
      if (useHttpOnlyCookies) {
        // With HTTP-only cookies, we check if login was successful
        
        // Check for success or access_token as some endpoints might return either
        const isSuccess = res.data?.success || res.data?.access_token;
        
        if (isSuccess) {
          // Force a fetch of current user info
          await getCurrentUser();
          // If we got here without throwing, we're logged in
          const userInfo = {
            email: data.email,
            verified: res.data?.verified ?? true,
            userId: res.data?.user_id || res.data?.id
          };
          setUser(userInfo);
        } else {
          setUser(null);
          setError(res.data?.detail || res.data?.message || 'Login failed');
        }
      } else {
        // Handle JWT token approach
        if (res.data?.access_token) {
          localStorage.setItem('token', res.data.access_token);
          
          // Decode the token to get user info including verification status
          try {
            const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
            const userInfo = {
              email: data.email,
              verified: payload.verified === undefined ? true : payload.verified,
              userId: payload.sub || payload.id
            };
            setUser(userInfo);
            return;
          } catch (e) {
            // Token decode failed
          }
        }
        setUser(null);
        setError(res.data?.detail || res.data?.message || 'Login failed');
      }
    } catch (err: any) {
      setUser(null);
      
      // Enhanced error handling for better user feedback
      let errorMsg = 'Login failed';
      
      if (err?.response?.status === 401) {
        // Unauthorized - wrong credentials
        errorMsg = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err?.response?.status === 403) {
        // Forbidden - might be unverified email
        errorMsg = err?.response?.data?.detail || 
                   err?.response?.data?.message || 
                   'Access denied. Please verify your email address.';
      } else if (err?.response?.status === 404) {
        // Not found - user doesn't exist
        errorMsg = 'Account not found. Please check your email or sign up.';
      } else if (err?.response?.status >= 500) {
        // Server error
        errorMsg = 'Server error. Please try again later.';
      } else {
        // Other errors - try to get message from response
        errorMsg = err?.response?.data?.detail ||
                   err?.response?.data?.message ||
                   (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                   err?.message ||
                   'Login failed. Please try again.';
      }
      
      setError(errorMsg);
      console.error('[Auth] Login error:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
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
      
      if (useHttpOnlyCookies) {
        // With HTTP-only cookies, we don't need to handle the token
        if (res.data?.success) {
          // Fetch user info to update the context
          getCurrentUser();
        } else {
          setUser(null);
          setError(res.data?.detail || res.data?.message || 'Login failed');
        }
      } else {
        // Handle JWT token approach
        if (res.data?.access_token) {
          localStorage.setItem('token', res.data.access_token);
          
          // Get user info from token
          try {
            const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
            setUser({
              email: payload.email || '',
              verified: payload.verified === undefined ? true : payload.verified,
              userId: payload.sub || payload.id
            });
          } catch (e) {
            // If token can't be decoded, fetch user info
            getCurrentUser();
          }
        } else {
          setUser(null);
          setError(res.data?.detail || res.data?.message || 'Login failed');
        }
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
    
    // Determine if we should use the proxy based on environment
    const isProduction = window.location.hostname !== 'localhost';
    const shouldUseProxy = isProduction;

    if (useHttpOnlyCookies) {
      // With HTTP-only cookies, we need to call a logout endpoint to clear the cookie
      try {
        if (shouldUseProxy) {
          // Use proxy in production
          await fetch('/api/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/logout`,
              method: 'POST',
              data: {}
            })
          });
        } else {
          // Direct API call in development
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/logout`, { 
            method: 'POST', 
            credentials: 'include' 
          });
        }
      } catch (e) {
        // Ignore errors
      }
    } else {
      // With JWT, remove token from localStorage
      localStorage.removeItem('token');
    }
    
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
    
    // Clear SWR cache to prevent stale data
    if (typeof window !== 'undefined' && (window as any).swrCache) {
      (window as any).swrCache.clear();
    }
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
