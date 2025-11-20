"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Function to get initial theme without causing hydration issues
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'light';
  } catch {
    return 'light';
  }
};

// Function to apply theme immediately to prevent flashing
const applyThemeImmediately = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else if (theme === 'system') {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    // If there's no stored user preference, default to light and persist it.
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('theme');
        if (!stored) {
          setThemeState('light');
          try { localStorage.setItem('theme', 'light'); } catch {}
          applyThemeImmediately('light');
          return;
        }
      } catch {
        // ignore
      }
    }

    // Apply theme immediately on mount to prevent flashing
    applyThemeImmediately(theme);
  }, []);

  const setTheme = (t: Theme) => {
    if (typeof window === 'undefined') return;
    
    setThemeState(t);
    try {
      localStorage.setItem('theme', t);
    } catch {
      // Handle localStorage errors silently
    }
    applyThemeImmediately(t);
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
