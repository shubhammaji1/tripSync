import React from 'react';

interface TripSyncLogoProps {
  className?: string;
  size?: number;
}

export function TripSyncLogo({ className = 'w-9 h-9', size }: TripSyncLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
    >
      <defs>
        {/* Gradient for Top Trail (Fades from transparent to Vibrant Green) */}
        <linearGradient id="tsFadeGreen" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
        </linearGradient>

        {/* Gradient for Bottom Trail (Fades from transparent to Teal/Cyan) */}
        <linearGradient id="tsFadeTeal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
        </linearGradient>

        {/* Gradient for Central Map Pin (Dark Navy matching dashboard text) */}
        <linearGradient id="tsPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Subtle Drop Shadow */}
        <filter id="tsShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Central Pulsing Radar (Sync Indicator in Vibrant Green) */}
      <g>
        <circle cx="50" cy="46" r="10" fill="#10B981" opacity="0">
          <animate attributeName="r" values="10; 28" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5; 0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="46" r="10" fill="#10B981" opacity="0">
          <animate attributeName="r" values="10; 28" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5; 0" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Central Minimalist Map Pin */}
      <g filter="url(#tsShadow)">
        {/* Base Shape */}
        <path
          d="M50 30 C41 30 34 37 34 46 C34 58 50 70 50 70 C50 70 66 58 66 46 C66 37 59 30 50 30 Z"
          fill="url(#tsPinGrad)"
        />
        {/* Inner Cutout */}
        <circle cx="50" cy="46" r="6" fill="#FFFFFF" />
      </g>

      {/* Orbiting Paper Airplanes (The Sync Process) */}
      <g>
        {/* Continuous Smooth Rotation */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="6s"
          repeatCount="indefinite"
        />

        {/* Left Trail (Behind Green Plane) */}
        <path
          d="M 50 85 A 35 35 0 0 1 50 15"
          fill="none"
          stroke="url(#tsFadeGreen)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />

        {/* Right Trail (Behind Teal Plane) */}
        <path
          d="M 50 15 A 35 35 0 0 1 50 85"
          fill="none"
          stroke="url(#tsFadeTeal)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />

        {/* Top Plane (Vibrant Green Route) */}
        <g transform="translate(50, 15)">
          <path d="M -10 -7 L 12 0 L -6 0 Z" fill="#34D399" />
          <path d="M -10 7 L 12 0 L -6 0 Z" fill="#10B981" />
        </g>

        {/* Bottom Plane (Teal / Cyan Route) */}
        <g transform="translate(50, 85) rotate(180)">
          <path d="M -10 -7 L 12 0 L -6 0 Z" fill="#67E8F9" />
          <path d="M -10 7 L 12 0 L -6 0 Z" fill="#06B6D4" />
        </g>
      </g>
    </svg>
  );
}
