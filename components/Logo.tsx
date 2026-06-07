
import React from 'react';

export const Logo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="paint0_linear_logo" x1="60" y1="100" x2="140" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {/* Bottom Loop - utilizes currentColor to adapt automatically of light/dark backgrounds */}
    <path 
      d="M60 140C60 117.909 77.9086 100 100 100H140V140C140 151.046 131.046 160 120 160H80C68.9543 160 60 151.046 60 140Z" 
      className="fill-slate-800 dark:fill-white transition-colors duration-300"
    />
    {/* Top Loop - vibrant premium brand identity green */}
    <path 
      d="M140 60C140 82.0914 122.091 100 100 100H60V60C60 48.9543 68.9543 40 80 40H120C131.046 40 140 48.9543 140 60Z" 
      fill="#22c55e"
    />
    {/* Middle Transition Overlay */}
    <rect 
      x="60" 
      y="90" 
      width="80" 
      height="20" 
      fill="url(#paint0_linear_logo)"
      className="mix-blend-multiply dark:mix-blend-normal opacity-90"
    />
  </svg>
);

