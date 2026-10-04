'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TripSyncLogo } from '@/components/TripSyncLogo';
import { MountainLandscape } from '@/components/MountainLandscape';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/sign-up');
    }, 450);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center bg-gradient-to-b from-white via-[#f3faf7] to-[#e4f3ee] text-slate-800 overflow-hidden">
      {/* Sky trajectory flight curve with airplane in top right */}
      <div className="absolute top-6 right-6 w-64 h-32 pointer-events-none opacity-80">
        <svg viewBox="0 0 240 100" fill="none" className="w-full h-full">
          <path
            d="M 20 85 C 90 75, 150 45, 215 15"
            stroke="#10b981"
            strokeWidth="1.75"
            strokeDasharray="5 5"
            strokeOpacity="0.6"
          />
          <g transform="translate(215, 14) rotate(-35) scale(0.85)">
            <path
              d="M12 2L15 9H22L17 14L19 21L12 17L5 21L7 14L2 9H9L12 2Z"
              fill="#10b981"
            />
          </g>
        </svg>
      </div>

      {/* Center Beacon & Redirection Text */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm px-6 text-center space-y-4 pt-8 pb-12">
        {/* Floating Brand Emblem with Dotted Orbit Ring & Orbiting Satellite */}
        <div className="relative flex items-center justify-center my-3">
          {/* Mint Dotted Orbit Ring */}
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-400/50 animate-[spin_10s_linear_infinite]" />

          {/* Central Logo Squircle */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-emerald-500/15 border border-emerald-200/90 flex items-center justify-center p-2.5 absolute z-10">
            <TripSyncLogo className="w-full h-full" />
          </div>

          {/* Satellite Orbit Dot */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1.5 pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Redirecting to Clerk sign-up...
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Just a moment, we&apos;re setting up your travel account.
          </p>
        </div>
      </div>

      {/* Layered soft mint mountain ridges at bottom with airplane */}
      <div className="relative w-full z-0 pointer-events-none mt-auto">
        <MountainLandscape variant="minimal" className="w-full" />
      </div>
    </div>
  );
}
