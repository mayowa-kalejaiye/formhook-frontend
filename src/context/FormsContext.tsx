"use client";
import React, { createContext, useContext, useEffect } from 'react';
import useSWR from 'swr';
import { getForms } from '../services/api';
import { useAuth } from './AuthContext';

interface Form {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface FormsContextType {
  forms: Form[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

// Get user ID from token for cache key
const getUserIdFromToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.id || payload.email;
  } catch (e) {
    console.error('[FormsContext] Failed to decode token:', e);
    return null;
  }
};

// Enhanced fetcher with logging for debugging excessive API calls
const fetcher = async (key: string) => {
  const res = await getForms();
  
  // Handle different response formats
  if (res && res.data && Array.isArray(res.data)) {
    return res.data;
  } else if (res && Array.isArray(res)) {
    return res;
  }
  
  return [];
};

export const FormsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
    // Create user-specific cache key to prevent data leakage between users
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = user?.userId || storedUserId || user?.email || getUserIdFromToken();
  const cacheKey = userId ? `forms-${userId}` : null;
  
  const { data, error, isLoading, mutate } = useSWR(
    cacheKey, 
    fetcher, 
    { 
      revalidateOnFocus: false,
      // Clear cache when user changes
      dedupingInterval: 0
    }
  );
  
  // Clear cache when user logs out or changes
  useEffect(() => {
    if (!user && data) {
      mutate(undefined, false);
    }
  }, [user, data, mutate]);
  
  return (
    <FormsContext.Provider value={{
      forms: data || [],
      isLoading,
      error: error ? (error.message || 'Failed to load forms') : null,
      mutate
    }}>
      {children}
    </FormsContext.Provider>
  );
};

export const useForms = () => {
  const ctx = useContext(FormsContext);
  if (!ctx) throw new Error('useForms must be used within FormsProvider');
  return ctx;
};
