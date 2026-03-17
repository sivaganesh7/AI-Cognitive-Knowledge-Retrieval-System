'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'sb-theme';

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = saved === 'light' || saved === 'dark' ? saved : 'dark';

    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const setThemeMode = (nextTheme) => {
    const value = nextTheme === 'light' ? 'light' : 'dark';
    setTheme(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value);
    }
    applyTheme(value);
  };

  const toggleTheme = () => setThemeMode(theme === 'dark' ? 'light' : 'dark');

  const value = useMemo(() => ({
    theme,
    mounted,
    isDark: theme === 'dark',
    setThemeMode,
    toggleTheme,
  }), [theme, mounted]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
