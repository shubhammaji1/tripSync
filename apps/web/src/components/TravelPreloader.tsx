'use client';

import React, { useState, useEffect } from 'react';
import { TripSyncLogo } from './TripSyncLogo';
import { MountainLandscape } from './MountainLandscape';
import { ChevronRight } from 'lucide-react';

const FRIENDLY_LOADING_STEPS = [
  { icon: '🧳', text: 'Packing your adventure...' },
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
    // Only show once per session for instant subsequent navigations
    const hasLoadedThisSession = sessionStorage.getItem('tripsync_preloader_shown');
    if (hasLoadedThisSession) {
      setLoading(false);
      return;
    }

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < FRIENDLY_LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 12;
      });
    }, 180);

    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setLoading(false);
        try {
          sessionStorage.setItem('tripsync_preloader_shown', 'true');
        } catch {}
      }, 400);
    }, 1600);

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
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-gradient-to-b from-[#eaf6f2] via-[#f4faf7] to-[#e2f3ee] text-slate-800 transition-all duration-400 overflow-hidden ${
        fadingOut ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top subtle flight trajectory arc in sky */}
      <div className="absolute top-4 right-4 w-60 h-28 pointer-events-none opacity-80">
        <svg viewBox="0 0 240 100" fill="none" className="w-full h-full">
          <path
            d="M 10 90 C 80 80, 140 50, 210 15"
            stroke="#10b981"
            strokeWidth="1.75"
            strokeDasharray="5 5"
            strokeOpacity="0.6"
          />
          <g transform="translate(210, 14) rotate(-35) scale(0.85)">
            <path
              d="M12 2L15 9H22L17 14L19 21L12 17L5 21L7 14L2 9H9L12 2Z"
              fill="#10b981"
            />
          </g>
        </svg>
      </div>

      {/* Main Center Content Box */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm px-6 text-center space-y-4 pt-12">
        {/* Floating Brand Emblem with Dotted Orbit Ring & Orbiting Satellite */}
        <div className="relative flex items-center justify-center my-2">
          {/* Mint Dotted Orbit Ring */}
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-400/50 animate-[spin_10s_linear_infinite]" />

          {/* Central Logo Squircle */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-emerald-500/15 border border-emerald-200/90 flex items-center justify-center p-2.5 absolute z-10 transition-transform">
            <TripSyncLogo className="w-full h-full" />
          </div>

          {/* Satellite Orbit Dot */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-0.5">
          <h1 className="text-3xl font-black tracking-tight text-[#064e43]">
            TripSync
          </h1>
          <p className="text-xs font-bold text-[#0f5147] tracking-tight">
            Smart Group Travel, Perfectly Synced ✈️
          </p>
        </div>

        {/* Dynamic Friendly Step Pill Button */}
        <div className="pt-2">
          <div className="inline-flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-white/95 border border-emerald-200/80 shadow-xs text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <span className="flex items-center gap-2">
              <span className="text-sm">{currentStep.icon}</span>
              <span>{currentStep.text}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-60 max-w-full space-y-1.5 pt-1">
          <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-200 shadow-xs"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold px-0.5">
            <span>Getting ready</span>
            <span className="font-mono font-bold text-emerald-800">{Math.min(progress, 100)}%</span>
          </div>
        </div>

        {/* Quick Skip to Workspace */}
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-slate-700 hover:text-slate-900 font-semibold transition-colors underline underline-offset-4 cursor-pointer pt-3"
        >
          Skip to workspace →
        </button>
      </div>

      {/* Scenic Nature & Mountain Lake Landscape at bottom */}
      <div className="relative w-full z-0 pointer-events-none mt-auto">
        <MountainLandscape variant="full" className="w-full" />
      </div>
    </div>
  );
}
