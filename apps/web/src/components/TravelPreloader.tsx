'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { TripSyncLogo } from './TripSyncLogo';
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
    }, 450);

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
    }, 1800);

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
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center overflow-hidden transition-all duration-400 select-none ${
        fadingOut ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: '#469de4' }}
    >
      {/* ========================================================================= */}
      {/* 1. SCENIC NATURE ALPINE LAKE BACKGROUND IMAGE FOR ALL SCREEN SIZES        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Responsive Background: Full bleed on mobile & desktop */}
        {}
        <img
          src="/images/background.png"
          alt="TripSync scenic alpine travel scenery"
          className="w-full h-full object-cover object-bottom sm:object-[center_60%] lg:object-center transition-all duration-300"
        />

        {/* Subtle top sky tone gradient for seamless blending across ultra-wide monitors */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#3d95e1]/40 to-transparent pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP / CENTER LOADER CONTENT                                            */}
      {/* Mobile: Floats cleanly over the upper sky area                           */}
      {/* Desktop/Tablet: Elegant frosted glass card for guaranteed readability    */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-start sm:justify-center pt-14 sm:pt-0 px-4">
        <div className="flex flex-col items-center max-w-sm sm:max-w-md w-full px-5 py-4 sm:p-8 sm:bg-white/85 sm:backdrop-blur-xl sm:rounded-3xl sm:shadow-2xl sm:border sm:border-white/60 text-center space-y-3.5 transition-all">
          {/* Floating Brand Emblem with Dotted Orbit Ring & Orbiting Satellite */}
          <div className="relative flex items-center justify-center my-1">
            {/* Mint Dotted Orbit Ring */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-emerald-400/70 animate-[spin_10s_linear_infinite]" />

            {/* Central Logo Squircle */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xl shadow-emerald-500/20 border border-emerald-200/90 flex items-center justify-center p-2.5 absolute z-10">
              <TripSyncLogo className="w-full h-full" />
            </div>

            {/* Satellite Orbit Dot */}
            <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
            </div>
          </div>

          {/* Brand Name & Tagline */}
          <div className="space-y-0.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#044e45] drop-shadow-xs sm:drop-shadow-none">
              TripSync
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#0f5147] tracking-tight">
              Smart Group Travel, Perfectly Synced ✈️
            </p>
          </div>

          {/* Dynamic Friendly Step Pill Button */}
          <div className="pt-1.5 w-full flex justify-center">
            <div className="inline-flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-white/95 sm:bg-white border border-emerald-200/80 shadow-sm text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95 duration-200 max-w-xs w-full">
              <span className="flex items-center gap-2 truncate">
                <span className="text-sm shrink-0">{currentStep.icon}</span>
                <span className="truncate">{currentStep.text}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          </div>

          {/* Sleek Progress Bar */}
          <div className="w-60 sm:w-72 max-w-full space-y-1.5 pt-1">
            <div className="h-1.5 w-full bg-white/60 sm:bg-slate-200/90 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-200 shadow-xs"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-semibold px-0.5 text-slate-700 sm:text-slate-500">
              <span>Getting ready</span>
              <span className="font-mono font-bold text-emerald-800">{Math.min(progress, 100)}%</span>
            </div>
          </div>

          {/* Skip link on desktop (embedded neatly in the card) */}
          <div className="hidden sm:block pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors underline underline-offset-4 cursor-pointer"
            >
              Skip to workspace →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM SKIP BUTTON (Over lake/rocks with frosted glass pill)     */}
      {/* ========================================================================= */}
      <div className="relative z-10 sm:hidden pb-10 flex justify-center w-full">
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-1.5 rounded-full bg-slate-950/40 hover:bg-slate-950/60 backdrop-blur-md text-white text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1 border border-white/20"
        >
          <span>Skip to workspace</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
