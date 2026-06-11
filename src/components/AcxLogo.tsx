import React from 'react';
import { cn } from '../lib/utils';

interface AcxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withHoverGlow?: boolean;
  variant?: 'icon' | 'full';
}

export default function AcxLogo({ 
  className, 
  size = 'md', 
  withHoverGlow = true,
  variant = 'icon'
}: AcxLogoProps) {
  
  // Custom size classes adjusted for both variants
  const sizeClasses = {
    sm: variant === 'full' ? 'w-32 h-auto' : 'w-10 h-10',      // Navbar sizing
    md: variant === 'full' ? 'w-40 h-auto' : 'w-14 h-14',      // Base block sizing
    lg: variant === 'full' ? 'w-56 h-auto' : 'w-20 h-20',      // Sub-header focus
    xl: variant === 'full' ? 'w-72 h-auto' : 'w-28 h-28',      // Hero primary
    '2xl': variant === 'full' ? 'w-[320px] h-auto' : 'w-45 h-45' // Large display callout
  };

  // SVG viewBox dynamics based on visual layout
  const viewBox = variant === 'full' ? "0 0 200 240" : "0 0 200 200";

  return (
    <div className={cn(
      "relative flex items-center justify-center select-none active:scale-[0.98] transition-transform duration-200", 
      sizeClasses[size],
      className
    )}>
      {/* Dynamic Background Hover Aura */}
      {withHoverGlow && (
        <div className="absolute inset-[-6px] bg-gradient-to-tr from-[#F58220]/10 to-[#388E3C]/10 rounded-full blur-lg opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      <svg 
        viewBox={viewBox} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 filter drop-shadow-[0_2px_12px_rgba(56,142,60,0.12)]"
      >
        <defs>
          {/* Main Tonal Gradient - Africa Landmass */}
          <linearGradient id="africa-land-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#43A047" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>

          {/* Ledger Connector Ring Gradient */}
          <linearGradient id="glow-edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5D6A7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E8F5E9" stopOpacity="0.1" />
          </linearGradient>

          {/* Africa-Shaped Clip Boundary for Network Overlays */}
          <clipPath id="africa-contour">
            <path d="M104,45 C116,43 128,45 134,50 C142,55 150,65 150,75 C150,85 140,110 134,120 C128,130 122,145 114,158 C112,162 109,162 106,158 C100,148 98,136 98,124 C98,115 92,112 84,110 C72,108 62,104 52,94 C42,84 42,72 44,60 C46,48 56,40 69,37 C79,35 92,48 104,45 Z" />
          </clipPath>
        </defs>

        {/* ==================== 1. EMBLEM ICON SECTION ==================== */}
        <g transform="translate(0, 0)">
          {/* Outer Boundary Left Circular Arc (Vibrant Brand Green) */}
          <path 
            d="M 104,17 A 78,78 0 0,0 104,173" 
            stroke="#388E3C" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
          />

          {/* Outer Boundary Right Circular Arc (Warm Brand Orange) */}
          <path 
            d="M 112,18 A 78,78 0 0,1 138,154" 
            stroke="#F58220" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
          />

          {/* Africa Main Green Contoured Landmass */}
          <path 
            d="M104,45 C116,43 128,45 134,50 C142,55 150,65 150,75 C150,85 140,110 134,120 C128,130 122,145 114,158 C112,162 109,162 106,158 C100,148 98,136 98,124 C98,115 92,112 84,110 C72,108 62,104 52,94 C42,84 42,72 44,60 C46,48 56,40 69,37 C79,35 92,48 104,45 Z" 
            fill="url(#africa-land-grad)"
          />

          {/* Madagascar Landmass Accent */}
          <path 
            d="M139,123 C142,121 146,126 144,131 C142,136 139,142 137,145 C135,147 134,145 135,141 C136,135 138,127 139,123 Z" 
            fill="#388E3C" 
          />

          {/* Clipped Ledger Node Lattice Network Overlay inside Africa */}
          <g clipPath="url(#africa-contour)">
            {/* Grid Mesh Back-resonance Lines */}
            <line x1="60" y1="65" x2="95" y2="60" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="95" y1="60" x2="120" y2="65" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="95" y1="60" x2="110" y2="50" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="120" y1="65" x2="125" y2="75" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="120" y1="65" x2="113" y2="95" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="113" y1="95" x2="105" y2="130" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="95" y1="60" x2="105" y2="130" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1="60" y1="65" x2="84" y2="110" stroke="#81C784" strokeWidth="0.6" strokeOpacity="0.5" />

            {/* Glowing Ledger Micro-Nodes */}
            <circle cx="60" cy="65" r="1.6" fill="#C8E6C9" />
            <circle cx="95" cy="60" r="1.6" fill="#C8E6C9" />
            <circle cx="120" cy="65" r="1.6" fill="#C8E6C9" />
            <circle cx="113" cy="95" r="1.6" fill="#C8E6C9" />
            <circle cx="105" cy="130" r="1.6" fill="#C8E6C9" />
            <circle cx="125" cy="75" r="1.6" fill="#C8E6C9" />
            <circle cx="110" cy="50" r="1.6" fill="#C8E6C9" />
          </g>

          {/* West-Coast Diamond Framework Emblem */}
          <g transform="translate(42, 85) rotate(45)">
            <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="#388E3C" strokeWidth="2.5" rx="1.5" />
            <rect x="-4" y="-4" width="8" height="8" fill="#F58220" />
          </g>
          {/* Double Orange Guard Dots next to Diamond */}
          <circle cx="58" cy="80" r="2.5" fill="#F58220" />
          <circle cx="58" cy="91" r="2.5" fill="#F58220" />

          {/* Orange Ascending Capital Flow Arrow (Sweeping Up-Right) */}
          <path 
            d="M 75,98 C 88,80 110,65 138,58" 
            fill="none" 
            stroke="#F58220" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          {/* Arrowhead (Orange) */}
          <path d="M 128,52 L 142,57 L 138,71 Z" fill="#F58220" />

          {/* Green Descending Asset Integration Arrow (Sweeping Down-Left) */}
          <path 
            d="M 140,73 C 125,85 105,95 83,100" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
          />
          <path 
            d="M 140,73 C 125,85 105,95 83,100" 
            fill="none" 
            stroke="#388E3C" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />
          {/* Arrowhead (Green + White boundary) */}
          <path d="M 91,107 L 78,99 L 91,91 Z" fill="#388E3C" stroke="#FFFFFF" strokeWidth="1" />
        </g>

        {/* ==================== 2. TYPOGRAPHY TEXT SECTION ==================== */}
        {variant === 'full' && (
          <g>
            {/* Vector Outlined brand text "AFRICA" mimicking modern custom font */}
            {/* 'A' 1 (first) */}
            <path d="M 34,202 L 46,182 L 58,202" stroke="#388E3C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polygon points="42,198 50,198 46,192" fill="#F58220" />

            {/* 'F' */}
            <path d="M 64,202 L 64,182 L 78,182 M 64,191 L 74,191" stroke="#388E3C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* 'R' */}
            <path d="M 84,202 L 84,182 L 95,182 C 100,182 104,185 104,190 C 104,195 100,197 95,197 L 84,197 M 93,197 L 104,202" stroke="#388E3C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* 'I' */}
            <path d="M 110,182 L 110,202" stroke="#388E3C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* 'C' */}
            <path d="M 134,185 C 130,182 120,182 120,192 C 120,202 130,202 134,199" stroke="#388E3C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* 'A' 2 (second) */}
            <path d="M 142,202 L 154,182 L 166,202" stroke="#388E3C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polygon points="150,198 158,198 154,192" fill="#F58220" />

            {/* Sub-Brand Text: "CREDIT EXCHANGE" in Serif typography */}
            <text 
              x="100" 
              y="218" 
              textAnchor="middle" 
              fill="#F58220" 
              fontSize="7" 
              fontWeight="600" 
              letterSpacing="0.45em" 
              fontFamily="Playfair Display, Georgia, serif"
            >
              CREDIT EXCHANGE
            </text>

            {/* Ornamental Bottom Divider Line Map Node Accent */}
            <rect x="97" y="227" width="6" height="6" fill="#388E3C" transform="rotate(45 100 230)" />
            <circle cx="88" cy="230" r="2" fill="#388E3C" />
            <circle cx="112" cy="230" r="2" fill="#388E3C" />
            <line x1="34" y1="230" x2="78" y2="230" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" />
            <line x1="122" y1="230" x2="166" y2="230" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}


