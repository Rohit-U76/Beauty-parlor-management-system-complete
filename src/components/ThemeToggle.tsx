import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useSalon();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl transition-all duration-300 cursor-pointer select-none group focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-purple-50 hover:bg-purple-100 dark:bg-[#18181c] dark:hover:bg-[#202026] border border-purple-200/80 dark:border-zinc-800 text-purple-900 dark:text-zinc-200 hover:border-purple-400 dark:hover:border-amber-400/40 shadow-sm active:scale-95 ${className}`}
      aria-label={isDark ? "Switch to White & Lavender Light Mode" : "Switch to Obsidian Dark Mode"}
      title={isDark ? "Switch to Royal White & Lavender Theme" : "Switch to Obsidian Gold Dark Theme"}
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-purple-700 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>

      <span className="text-xs font-bold tracking-tight">
        {showLabel ? (isDark ? 'Royal Light Mode' : 'Obsidian Dark Mode') : (isDark ? 'Light' : 'Dark')}
      </span>
    </button>
  );
};

