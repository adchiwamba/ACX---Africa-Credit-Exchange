import React from 'react';
import { cn } from '../lib/utils';

interface GuavaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'full';
  withHoverGlow?: boolean;
}

export default function GuavaLogo({
  className,
  size = 'md',
  variant = 'full',
  withHoverGlow = true
}: GuavaLogoProps) {
  
  // Custom size classes for responsive scaling
  const sizeClasses = {
    sm: variant === 'full' ? 'h-8 w-[80px]' : 'w-8 h-8',
    md: variant === 'full' ? 'h-12 w-[120px]' : 'w-12 h-12',
    lg: variant === 'full' ? 'h-16 w-[160px]' : 'w-16 h-16',
    xl: variant === 'full' ? 'h-24 w-[240px]' : 'w-24 h-24',
    '2xl': variant === 'full' ? 'h-32 w-[320px]' : 'w-32 h-32'
  };

  const viewBox = variant === 'full' ? "0 0 125 50" : "0 0 50 50";

  return (
    <div className={cn(
      "relative flex items-center justify-center select-none active:scale-[0.98] transition-transform duration-200",
      sizeClasses[size],
      className
    )}>
      {/* Light Hover Aura */}
      {withHoverGlow && (
        <div className="absolute inset-[-6px] bg-gradient-to-tr from-[#F39233]/5 to-[#22C55E]/5 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      <svg
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        {/* ================= G Logo Mark ================= */}
        {/* Main Head Circle */}
        <circle 
          cx="20" 
          cy="22" 
          r="9.5" 
          stroke="#F39233" 
          strokeWidth="3.2" 
          strokeLinecap="round"
          fill="none"
        />
        
        {/* g Tail / Stem matching uploaded image perfectly */}
        <path 
          d="M 29.5,22 L 29.5,35.5 C 29.5,41.5 25,45 18,45 C 13,45 10.5,41.5 10.5,37" 
          stroke="#F39233" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
          fill="none"
        />

        {/* Dynamic Accent Dot above right of the circle */}
        <circle 
          cx="26" 
          cy="7" 
          r="3.5" 
          fill="#22C55E" 
        />

        {/* ================= GUAVA Typography ================= */}
        {variant === 'full' && (
          <text
            x="48"
            y="30"
            fill="#22C55E"
            fontSize="20"
            fontWeight="700"
            letterSpacing="0.08em"
            fontFamily='"Inter", "Outfit", system-ui, -apple-system, sans-serif'
            className="select-none font-bold"
            style={{ fontWeight: 700 }}
          >
            GUAVA
          </text>
        )}
      </svg>
    </div>
  );
}
