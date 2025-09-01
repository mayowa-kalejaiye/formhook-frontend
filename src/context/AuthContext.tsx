"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, isUsingHttpOnlyCookies } from '../services/api';

// Check if we're using HTTP-only cookies
const useHttpOnlyCookies = isUsingHttpOnlyCookies();

interface User {
  email: string;
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: { email: string; password: string }) => Promise<void>;
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
    if (useHttpOnlyCookies) {
      // When using HTTP-only cookies, we need to make an API call to get the user info
      // This would be a separate endpoint like /auth/me that returns user data based on the cookie
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
          verified: data.verified
        });
      })
      .catch(() => {
        setUser(null);
      });
    } else {
      // JWT in localStorage approach
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ 
            email: payload.email || '',
            verified: payload.verified === undefined ? true : payload.verified // Default to true for backward compatibility
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
              verified: payload.verified === undefined ? true : payload.verified
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
    if (useHttpOnlyCookies) {
      // With HTTP-only cookies, we need to call a logout endpoint to clear the cookie
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com'}/auth/logout`, { 
          method: 'POST', 
          credentials: 'include' 
        });
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
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, getCurrentUser }}>
      {/* Optionally, you could provide info via context if needed */}
      {children}
      {/* Info state: {info} */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
