'use client';

import React from 'react';
import { TripSyncLogo } from './TripSyncLogo';

interface TripSyncLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  className?: string;
}

export function TripSyncLoader({
  size = 'md',
  text,
  subtext,
  fullScreen = false,
  className = '',
}: TripSyncLoaderProps) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', logo: 'w-5 h-5', ring: 'w-10 h-10', text: 'text-xs' },
    md: { container: 'w-12 h-12', logo: 'w-7 h-7', ring: 'w-16 h-16', text: 'text-sm' },
    lg: { container: 'w-16 h-16', logo: 'w-9 h-9', ring: 'w-20 h-20', text: 'text-base' },
    xl: { container: 'w-20 h-20', logo: 'w-12 h-12', ring: 'w-28 h-28', text: 'text-lg' },
  };

  const config = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3.5 text-center select-none ${className}`}>
      {/* Brand Icon Beacon with Orbiting Sync Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer Rotating Emerald Ring */}
        <div
          className={`${config.ring} rounded-full border-2 border-dashed border-emerald-500/40 animate-[spin_6s_linear_infinite] absolute`}
        />

        {/* Core Brand Logo with Soft Pulse */}
        <div
          className={`${config.container} rounded-2xl bg-white border border-emerald-400/80 shadow-lg shadow-emerald-500/25 flex items-center justify-center p-2 relative z-10 transition-transform ring-2 ring-emerald-500/20`}
        >
          <div className={`${config.logo} animate-pulse`}>
            <TripSyncLogo className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Optional Loading Status Labels */}
      {(text || subtext) && (
        <div className="space-y-1">
          {text && (
            <p className={`font-black tracking-tight text-slate-900 dark:text-white ${config.text}`}>
              {text}
            </p>
          )}
          {subtext && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
