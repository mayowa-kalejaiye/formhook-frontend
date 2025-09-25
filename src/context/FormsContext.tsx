"use client";
import React, { createContext, useContext } from 'react';
import useSWR from 'swr';
import { getForms } from '../services/api';

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


// Enhanced fetcher with logging for debugging excessive API calls
const fetcher = async () => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[FormsContext] Fetching forms from API at', new Date().toISOString(), new Error().stack?.split('\n')[2]?.trim());
  }
  const res = await getForms();
  console.log('[FormsContext] getForms response:', res);
  
  // Handle different response formats
  if (res && res.data && Array.isArray(res.data)) {
    return res.data;
  } else if (res && Array.isArray(res)) {
    return res;
  }
  
  console.warn('[FormsContext] Unexpected getForms response format:', res);
  return [];
};

export const FormsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error, isLoading, mutate } = useSWR('forms', fetcher, { revalidateOnFocus: false });
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
