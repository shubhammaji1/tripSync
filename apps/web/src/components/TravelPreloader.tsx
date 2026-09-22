'use client';

import React, { useState, useEffect } from 'react';
import { TripSyncLogo } from './TripSyncLogo';
import { Sparkles, Compass } from 'lucide-react';

const FRIENDLY_LOADING_STEPS = [
  { icon: '🎒', text: 'Packing your adventure...' },
  { icon: '🗺️', text: 'Mapping scenic routes & stops...' },
  { icon: '🤝', text: 'Connecting your travel crew...' },
  { icon: '✈️', text: 'All set for takeoff!' },
];

export function TravelPreloader() {
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(25);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only show once per session for lightning-fast subsequent navigations
    const hasLoadedThisSession = sessionStorage.getItem('tripsync_preloader_shown');
    if (hasLoadedThisSession) {
      setLoading(false);
      return;
    }

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < FRIENDLY_LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 320);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 15;
      });
    }, 150);

    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setLoading(false);
        try {
          sessionStorage.setItem('tripsync_preloader_shown', 'true');
        } catch {}
      }, 400);
    }, 1300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      setLoading(false);
      try {
        sessionStorage.setItem('tripsync_preloader_shown', 'true');
      } catch {}
    }, 200);
  };

  if (!loading) return null;

  const currentStep = FRIENDLY_LOADING_STEPS[stepIndex];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white transition-all duration-400 ${
        fadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background soft glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-teal-500/15 rounded-full blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center max-w-xs px-6 text-center space-y-5">
        {/* Floating Brand Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Orbit Ring */}
          <div className="w-24 h-24 rounded-full border border-dashed border-emerald-400/30 animate-[spin_10s_linear_infinite]" />

          {/* Central Logo Container */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-emerald-500/25 border border-emerald-400/80 flex items-center justify-center p-2.5 absolute z-10 transition-transform">
            <TripSyncLogo className="w-full h-full animate-pulse" />
          </div>

          {/* Satellite Orbit Dot */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 absolute -top-1 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white">TripSync</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            Smart Group Travel, Perfectly Synced ✈️
          </p>
        </div>

        {/* Dynamic Friendly Step Badge */}
        <div className="h-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <span>{currentStep.icon}</span>
            <span>{currentStep.text}</span>
          </div>
        </div>

        {/* Sleek Progress Bar */}
        <div className="w-56 space-y-2">
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-200 shadow-xs shadow-emerald-400"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
            <span>Getting ready</span>
            <span className="font-mono text-emerald-400">{Math.min(progress, 100)}%</span>
          </div>
        </div>

        {/* Quick Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold transition-colors pt-2 underline underline-offset-4 cursor-pointer"
        >
          Skip to workspace →
        </button>
      </div>
    </div>
  );
}
