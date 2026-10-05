'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TripSyncLogo } from '@/components/TripSyncLogo';
import { MountainLandscape } from '@/components/MountainLandscape';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/sign-in');
    }, 450);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center bg-gradient-to-b from-white via-[#f3faf7] to-[#e4f3ee] text-slate-800 overflow-hidden select-none">
      {/* Center Beacon & Redirection Text */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm px-6 text-center space-y-4 pt-10 pb-8">
        {/* Floating Brand Emblem with Dotted Orbit Ring & Orbiting Satellite */}
        <div className="relative flex items-center justify-center my-2">
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

        {/* Cleanly Wrapped Heading & Subtitle */}
        <div className="space-y-2 pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            <span className="block">Redirecting to</span>
            <span className="block whitespace-nowrap">Clerk sign-in...</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Just a moment, we&apos;re getting you in securely.
          </p>
        </div>
      </div>

      {/* Layered soft mint mountain ridges at bottom with graceful airplane flight curve */}
      <div className="relative w-full z-0 pointer-events-none mt-auto">
        <MountainLandscape variant="minimal" className="w-full" />
      </div>
    </div>
  );
}