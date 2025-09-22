"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, loginWithToken as apiLoginWithToken, isUsingHttpOnlyCookies } from '../services/api';

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

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = () => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Determine if we should use the proxy based on environment
    const isProduction = window.location.hostname !== 'localhost';
    const shouldUseProxy = isProduction;
    
    if (useHttpOnlyCookies) {
      // When using HTTP-only cookies, we need to make an API call to get the user info
      if (shouldUseProxy) {
        // Use proxy in production
        fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/me`,
            method: 'GET',
            data: {}
          })
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not authenticated');
        })
        .then(data => {
          if (data.email) {
            setUser({
              email: data.email,
              verified: data.verified,
              userId: data.id
            });
          } else {
            setUser(null);
          }
        })
        .catch(() => {
          setUser(null);
        });
      } else {
        // Direct API call in development
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/me`, {
          credentials: 'include'
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not authenticated');
        })
        .then(data => {
          setUser({
            email: data.email,
            verified: data.verified,
            userId: data.id
          });
        })
        .catch(() => {
          setUser(null);
        });
      }
    } else {
      // JWT in localStorage approach
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ 
            email: payload.email || '',
            verified: payload.verified === undefined ? true : payload.verified, // Default to true for backward compatibility
            userId: payload.sub || payload.id // sub is standard JWT field for subject/user ID
          });
        } catch (e) {
          // If token is invalid, remove it
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(data);
      
      if (useHttpOnlyCookies) {
        // With HTTP-only cookies, we don't need to handle the token
        // The cookie is automatically set by the server
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
          
          // Decode the token to get user info including verification status
          try {
            const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
            setUser({
              email: data.email,
              verified: payload.verified === undefined ? true : payload.verified,
              userId: payload.sub || payload.id
            });
          } catch (e) {
            // If token can't be decoded, set basic user info
            setUser({ email: data.email });
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
        'Login failed'
      );
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
    
    // Clear user state regardless of auth method
    setUser(null);
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
