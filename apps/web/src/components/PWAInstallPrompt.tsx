'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { TripSyncLogo } from './TripSyncLogo';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Minimized to round logo by default or after closing
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already in standalone PWA mode
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true);

    if (isStandalone) {
      return; // Already running in installed app
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIosDevice) {
      setIsIOS(true);
      setIsSupported(true);
      return;
    }

    // Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsSupported(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    setIsSupported(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsExpanded(false);
        setIsMinimized(true);
      }
      setDeferredPrompt(null);
    } else {
      setIsExpanded(true);
    }
  };

  const handleCloseToIcon = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded(false);
    setIsMinimized(true);
  };

  if (!mounted || !isSupported) return null;

  return (
    <>
      {/* 1. Minimized Round App Logo Floating Button (Always present at bottom right) */}
      {isMinimized && !isExpanded && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 flex items-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            title="Install TripSync App • Offline Ready"
            aria-label="Install TripSync App"
            className="group relative flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-950/95 hover:bg-slate-900 border-2 border-emerald-500/60 shadow-xl hover:shadow-emerald-500/30 text-white backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Logo Badge */}
            <div className="w-9 h-9 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center p-1.5 shadow-inner shrink-0 group-hover:rotate-6 transition-transform">
              <TripSyncLogo className="w-full h-full" />
            </div>

            {/* Label */}
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-black text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                <span>Install App</span>
                <Download className="w-3 h-3 text-emerald-400" />
              </span>
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                Offline Ready
              </span>
            </div>

            {/* Green Pulse Dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
          </button>
        </div>
      )}

      {/* 2. Expanded Install Dialog Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border-2 border-emerald-500/50 text-white p-5 rounded-3xl shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 p-2 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-inner">
                  <TripSyncLogo className="w-full h-full" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white">Install TripSync</h4>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">
                    Fast offline access on your device
                  </p>
                </div>
              </div>

              {/* Close to Minimized Logo */}
              <button
                type="button"
                onClick={() => handleCloseToIcon()}
                title="Close"
                aria-label="Close"
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-2.5">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> icon in Safari</span>
                  <Share className="w-3.5 h-3.5 text-sky-400 inline ml-1" />
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down & select</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 ml-1">
                    <PlusSquare className="w-3.5 h-3.5 inline" />
                    Add to Home Screen
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{deferredPrompt ? 'Install App to Phone' : 'Install to Home Screen'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Works offline without internet during travel.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
