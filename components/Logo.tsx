
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const UibLogo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const shieldColor = variant === 'light' ? '#ffffff' : '#00263E';
  const contentColor = variant === 'light' ? '#00263E' : '#ffffff';
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Shield Shape */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 40 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-full max-h-full"
      >
        <path d="M0 0H40V30C40 39.9411 31.0457 48 20 48C8.9543 48 0 39.9411 0 30V0Z" fill={shieldColor}/>
        {/* 4 Bars + Wave stylized */}
        <rect x="8" y="8" width="4" height="20" fill={contentColor} fillOpacity="0.9"/>
        <rect x="16" y="8" width="4" height="24" fill={contentColor} fillOpacity="0.9"/>
        <rect x="24" y="8" width="4" height="20" fill={contentColor} fillOpacity="0.9"/>
        <rect x="32" y="8" width="4" height="12" fill={contentColor} fillOpacity="0.9"/>
        <path d="M4 36C12 32 16 42 24 38" stroke={contentColor} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
        {/* Text UIB */}
        <text 
          x="20" 
          y="43" 
          fontFamily="sans-serif" 
          fontSize="7" 
          fontWeight="900" 
          fill={contentColor} 
          textAnchor="middle"
          letterSpacing="-0.5"
        >
          UIB
        </text>
      </svg>
    </div>
  );
};
