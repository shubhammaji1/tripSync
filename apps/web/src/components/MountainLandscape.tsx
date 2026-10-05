'use client';

import React from 'react';

interface MountainLandscapeProps {
  variant?: 'full' | 'minimal';
  className?: string;
}

export function MountainLandscape({ variant = 'full', className = '' }: MountainLandscapeProps) {
  if (variant === 'minimal') {
    return (
      <div className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}>
        {/* Sky trajectory flight curve with small airplane flying across mountain ridges */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 sm:pb-12 pointer-events-none">
          <svg
            className="w-full h-32 sm:h-40 max-w-lg mx-auto"
            viewBox="0 0 500 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 30 100 C 150 85, 260 45, 420 22"
              stroke="#10b981"
              strokeWidth="1.75"
              strokeDasharray="5 5"
              strokeOpacity="0.55"
            />
            {/* Real Airplane silhouette */}
            <g transform="translate(420, 20) rotate(-22) scale(0.9)">
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="#10b981"
              />
            </g>
          </svg>
        </div>

        {/* Soft Minimal Mint Layered Mountain Ridges */}
        <svg
          viewBox="0 0 1200 360"
          className="w-full h-auto block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="minRidgeBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d5eee5" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#c2e6da" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="minRidgeMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b4ded0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#9fd4c3" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="minRidgeFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87c7b3" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6fb9a3" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Distant soft ridge */}
          <path
            d="M0 240 Q 180 140, 360 210 T 720 180 T 1080 150 Q 1150 170, 1200 200 L 1200 360 L 0 360 Z"
            fill="url(#minRidgeBack)"
          />

          {/* Mid Ridge */}
          <path
            d="M0 270 Q 220 180, 480 250 T 960 210 Q 1100 240, 1200 260 L 1200 360 L 0 360 Z"
            fill="url(#minRidgeMid)"
          />

          {/* Front Foreground Ridge */}
          <path
            d="M0 300 Q 160 250, 380 290 T 840 260 Q 1050 280, 1200 310 L 1200 360 L 0 360 Z"
            fill="url(#minRidgeFront)"
          />
        </svg>
      </div>
    );
  }

  // Full variant: Scenic alpine mountain, lake, and pine trees (matching Image 4 Screen 1)
  return (
    <div className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Sky trajectory flight curve with airplane in top right */}
      <div className="absolute top-0 right-0 w-80 h-40 pointer-events-none">
        <svg
          viewBox="0 0 320 160"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 20 140 C 100 120, 180 80, 280 25"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeOpacity="0.5"
          />
          {/* Stylized Airplane */}
          <g transform="translate(280, 24) rotate(-32) scale(0.9)">
            <path
              d="M12 2L14.5 8H21L16.5 12.5L18.5 19L12 15L5.5 19L7.5 12.5L3 8H9.5L12 2Z"
              fill="#10b981"
              stroke="#059669"
              strokeWidth="0.5"
            />
          </g>
        </svg>
      </div>

      {/* Main Vector Scenic Mountain + Lake + Pine Forest Artwork */}
      <svg
        viewBox="0 0 1200 640"
        className="w-full h-auto block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          {/* Distant High Snow Peaks Gradient */}
          <linearGradient id="snowPeakBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#cae3ec" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8baec0" stopOpacity="0.7" />
          </linearGradient>

          {/* Midground Mountain Ridges */}
          <linearGradient id="midMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5a8b81" />
            <stop offset="100%" stopColor="#2c5a52" />
          </linearGradient>

          <linearGradient id="midMountain2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#43776d" />
            <stop offset="100%" stopColor="#1e463f" />
          </linearGradient>

          {/* Pine Forest Ridge Gradient */}
          <linearGradient id="pineRidge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c473f" />
            <stop offset="100%" stopColor="#0c2722" />
          </linearGradient>

          {/* Lake Water Surface */}
          <linearGradient id="lakeWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2d5e56" />
            <stop offset="35%" stopColor="#1c443e" />
            <stop offset="100%" stopColor="#09201b" />
          </linearGradient>

          {/* Water Reflection Shimmer */}
          <linearGradient id="waterShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#7ce0c3" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* 1. Distant Snow Peaks */}
        <path
          d="M120 340 L 260 160 L 330 240 L 480 120 L 590 260 L 720 110 L 860 250 L 980 150 L 1100 340 Z"
          fill="url(#snowPeakBack)"
        />
        {/* Snow accents on peaks */}
        <polygon points="480,120 440,175 480,165 520,175" fill="#ffffff" opacity="0.9" />
        <polygon points="720,110 680,165 720,155 760,170" fill="#ffffff" opacity="0.9" />
        <polygon points="980,150 945,195 980,185 1015,195" fill="#ffffff" opacity="0.9" />

        {/* 2. Midground Mountain Ridges */}
        <path
          d="M0 380 Q 200 240, 420 310 T 820 280 Q 1020 220, 1200 360 L 1200 520 L 0 520 Z"
          fill="url(#midMountain)"
        />
        <path
          d="M0 420 Q 260 300, 520 370 T 980 340 Q 1120 300, 1200 390 L 1200 520 L 0 520 Z"
          fill="url(#midMountain2)"
        />

        {/* 3. Mountain Lake Water Body */}
        <path d="M0 450 L 1200 450 L 1200 640 L 0 640 Z" fill="url(#lakeWater)" />

        {/* Water Reflection highlights */}
        <ellipse cx="600" cy="480" rx="360" ry="12" fill="url(#waterShimmer)" />
        <ellipse cx="600" cy="510" rx="280" ry="8" fill="url(#waterShimmer)" />
        <ellipse cx="600" cy="540" rx="200" ry="6" fill="url(#waterShimmer)" />

        {/* 4. Left Side Dense Pine Forest */}
        <g fill="url(#pineRidge)">
          {/* Tier 1 - background pines */}
          <polygon points="60,370 45,430 75,430" />
          <polygon points="100,350 82,430 118,430" />
          <polygon points="140,365 125,435 155,435" />
          <polygon points="180,380 165,445 195,445" />

          {/* Tier 2 - mid pines */}
          <polygon points="35,390 15,470 55,470" />
          <polygon points="80,375 58,470 102,470" />
          <polygon points="130,395 110,480 150,480" />
          <polygon points="175,410 155,490 195,490" />
          <polygon points="220,430 200,500 240,500" />

          {/* Tier 3 - foreground bold pine silhouettes */}
          <polygon points="20,420 -5,530 45,530" />
          <polygon points="65,400 38,530 92,530" />
          <polygon points="115,425 90,540 140,540" />
          <polygon points="160,450 138,550 182,550" />
          <polygon points="210,470 190,560 230,560" />
          <polygon points="260,490 242,570 278,570" />

          {/* Left shoreline base */}
          <path d="M0 480 Q 150 490, 300 560 L 300 640 L 0 640 Z" />
        </g>

        {/* 5. Right Side Pine Forest */}
        <g fill="url(#pineRidge)">
          {/* Tier 1 - background pines */}
          <polygon points="1140,370 1125,430 1155,430" />
          <polygon points="1100,350 1082,430 1118,430" />
          <polygon points="1060,365 1045,435 1075,435" />
          <polygon points="1020,380 1005,445 1035,445" />

          {/* Tier 2 - mid pines */}
          <polygon points="1165,390 1145,470 1185,470" />
          <polygon points="1120,375 1098,470 1142,470" />
          <polygon points="1070,395 1050,480 1090,480" />
          <polygon points="1025,410 1005,490 1045,490" />
          <polygon points="980,430 960,500 1000,500" />

          {/* Tier 3 - foreground bold pine silhouettes */}
          <polygon points="1180,420 1155,530 1205,530" />
          <polygon points="1135,400 1108,530 1162,530" />
          <polygon points="1085,425 1060,540 1110,540" />
          <polygon points="1040,450 1018,550 1062,550" />
          <polygon points="990,470 970,560 1010,560" />
          <polygon points="940,490 922,570 958,570" />

          {/* Right shoreline base */}
          <path d="M1200 480 Q 1050 490, 900 560 L 900 640 L 1200 640 Z" />
        </g>
      </svg>
    </div>
  );
}
