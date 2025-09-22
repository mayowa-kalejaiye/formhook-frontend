"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // On mount, check localStorage or system
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      setThemeState('system');
      applyTheme('system');
    }
  }, []);

  const setTheme = (t: Theme) => {
    if (typeof window === 'undefined') return;
    
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  };

  const applyTheme = (t: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
