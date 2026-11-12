import React from 'react';

interface ModernSalonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  inverted?: boolean;
}

export const ModernSalonLogo: React.FC<ModernSalonLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
  inverted = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-9 h-9 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20'
  };

  const titleSizes = {
    sm: 'text-xs sm:text-sm tracking-wider',
    md: 'text-xs sm:text-base lg:text-lg tracking-wider font-extrabold',
    lg: 'text-lg sm:text-2xl lg:text-3xl tracking-widest font-extrabold',
    xl: 'text-2xl sm:text-3xl lg:text-4xl tracking-widest font-extrabold'
  };

  const taglineSizes = {
    sm: 'text-[7px] sm:text-[8px] tracking-widest',
    md: 'text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.18em]',
    lg: 'text-[10px] sm:text-xs tracking-[0.2em]',
    xl: 'text-xs sm:text-sm tracking-[0.25em]'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group ${className}`}>
      {/* High-Resolution Vector Emblem with Gold & Red Luxury Accents */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center filter drop-shadow-md`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="redBlade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Outer Stylized Circular Frame with Golden Arch Accent */}
          <circle cx="60" cy="60" r="55" stroke="url(#goldRing)" strokeWidth="3" opacity="0.9" />
          <circle cx="60" cy="60" r="49" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

          {/* Base Platform Arc */}
          <path
            d="M 14 88 C 28 88 32 80 40 80 L 80 80 C 88 80 92 88 106 88"
            stroke="url(#goldRing)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Left Silhouette: Stylized Men Profile */}
          <path
            d="M 38 72 C 38 60 42 50 47 42 C 45 42 42 41 40 38 C 42 36 45 35 44 32 C 41 33 39 31 38 28 C 41 27 45 28 47 25 C 49 21 53 20 56 22 C 55 27 50 32 50 38 C 50 44 48 50 48 56 C 45 58 40 65 38 72 Z"
            fill="#e2e8f0"
            className="dark:fill-slate-100"
          />

          {/* Right Silhouette: Stylized Women Profile */}
          <path
            d="M 82 72 C 82 58 78 48 73 40 C 76 38 80 34 81 28 C 78 29 76 31 74 34 C 72 26 66 22 61 24 C 65 29 68 35 68 44 C 68 52 72 62 76 72 Z"
            fill="#fef08a"
            className="dark:fill-amber-200"
          />

          {/* Center Red & Chrome Shears (Barber Scissors) Intersecting */}
          <g transform="translate(60, 56) rotate(-15) translate(-60, -56)">
            {/* Shear Blade 1 - Vivid Red Accent */}
            <path
              d="M 60 18 L 56 62 L 60 65 L 64 62 Z"
              fill="url(#redBlade)"
            />
            {/* Shear Blade 2 - Silver Chrome */}
            <path
              d="M 60 18 L 64 62 L 60 65 L 56 62 Z"
              fill="#cbd5e1"
            />
            {/* Scissor Pivot Gold Pin */}
            <circle cx="60" cy="58" r="3.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            
            {/* Red Loop Handle Left */}
            <path
              d="M 56 64 C 52 74 44 80 44 86 C 44 92 50 96 56 94 C 60 92 60 84 57 74"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Gold/Silver Loop Handle Right */}
            <path
              d="M 64 64 C 68 74 76 80 76 86 C 76 92 70 96 64 94 C 60 92 60 84 63 74"
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </svg>
      </div>

      {/* Brand Typography & Tagline */}
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-serif uppercase font-extrabold text-amber-600 dark:text-amber-400 drop-shadow-sm ${titleSizes[size]}`}>
            MODERN UNISEX SALON
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 shrink-0" />
        </div>

        {/* Crisp Slogan Underline & Text */}
        {showTagline && (
          <div className="hidden sm:block mt-0.5 space-y-0.5">
            <div className="h-[1.5px] w-full bg-gradient-to-r from-red-500 via-amber-500 to-amber-400 rounded-full" />
            <p className={`font-mono font-bold uppercase text-slate-700 dark:text-zinc-300 ${taglineSizes[size]}`}>
              WE'LL STYLE, YOU'LL SMILE • MOHOL
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
