import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onChange: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!isDarkMode)}
      className="relative flex items-center bg-slate-200/60 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-800 p-1 rounded-full transition-colors duration-300 w-16 h-8 focus:outline-none ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-inner group"
      aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Sliding Pill Indicator */}
      <motion.div
        className="absolute w-6 h-6 rounded-full bg-[#8B5CF6] shadow-md flex items-center justify-center"
        animate={{
          x: isDarkMode ? 32 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 28,
        }}
        style={{
          boxShadow: isDarkMode 
            ? '0 0 12px 2px rgba(139, 92, 246, 0.45)' 
            : '0 0 10px 2px rgba(139, 92, 246, 0.25)',
        }}
      />

      {/* Sun Icon */}
      <div className="z-10 flex items-center justify-center w-6 h-6 transition-colors duration-200">
        <Sun
          size={14}
          className={`transition-all duration-300 ${
            !isDarkMode 
              ? 'text-white scale-110 font-bold' 
              : 'text-slate-400 group-hover:text-slate-200 scale-90'
          }`}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Moon Icon */}
      <div className="z-10 flex items-center justify-center w-6 h-6 transition-colors duration-200">
        <Moon
          size={14}
          className={`transition-all duration-300 ${
            isDarkMode 
              ? 'text-white scale-110' 
              : 'text-slate-500 group-hover:text-slate-700 scale-90'
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
