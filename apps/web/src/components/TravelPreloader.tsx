'use client';

import React, { useState, useEffect } from 'react';
import { TripSyncLogo } from './TripSyncLogo';

const LOADING_STEPS = [
  'Calibrating GPS coordinates...',
  'Connecting travel crew...',
  'Syncing itineraries & split balances...',
  'Ready for takeoff!',
];

export function TravelPreloader() {
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only show once per session to keep fast navigation snappy
    const hasLoadedThisSession = sessionStorage.getItem('tripsync_preloader_shown');
    if (hasLoadedThisSession) {
      setLoading(false);
      return;
    }

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 10;
      });
    }, 200);

    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setLoading(false);
        try {
          sessionStorage.setItem('tripsync_preloader_shown', 'true');
        } catch {}
      }, 500);
    }, 1800);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-500 ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle Background Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/15 rounded-full blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Animated Compass & Logo Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Outer Rotating Compass Ring */}
          <div className="w-28 h-28 rounded-full border-2 border-dashed border-emerald-500/30 animate-[spin_8s_linear_infinite]" />

          {/* Inner Counter-Rotating Precision Ring */}
          <div className="absolute w-20 h-20 rounded-full border border-emerald-400/20 animate-[spin_5s_linear_infinite_reverse]" />

          {/* Pulsing Core Beacon */}
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-emerald-500/60 shadow-xl shadow-emerald-500/20 flex items-center justify-center p-2.5 absolute">
            <TripSyncLogo className="w-full h-full animate-bounce" />
          </div>

          {/* Orbiting Satellite Waypoint */}
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400 absolute -top-1 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Branding & Status Heading */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">TripSync</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
              Travel OS
            </span>
          </div>

          {/* Animated Status Step Text */}
          <p className="text-xs font-semibold text-slate-300 h-5 transition-all duration-300">
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>

        {/* Glowing Progress Bar */}
        <div className="w-64 space-y-2">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-brand-500 rounded-full transition-all duration-300 shadow-sm shadow-emerald-400"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
            <span>Synchronizing workspace</span>
            <span className="font-mono text-emerald-400">{Math.min(progress, 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
