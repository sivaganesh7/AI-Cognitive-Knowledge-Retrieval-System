'use client';

import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="sb-theme-toggle fixed right-4 bottom-4 z-[120] inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all"
      style={{
        background: 'var(--color-surface-2)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
