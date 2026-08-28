'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Mountain, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

export function MountainOfflineSentinel() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // 1. Initial Online check
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // 2. Register Service Worker for offline PWA caching
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for service worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[TripSync SW] Registration skipped or failed:', err);
        });
    }

    // 3. Network connection change listeners
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      triggerOfflineQueueSync();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // 4. Initial check for pending offline queue
    checkPendingQueue();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const checkPendingQueue = () => {
    try {
      const queue = JSON.parse(localStorage.getItem('tripsync_offline_queue') || '[]');
      setPendingSyncCount(queue.length);
    } catch {
      setPendingSyncCount(0);
    }
  };

  const triggerOfflineQueueSync = () => {
    try {
      const queue = JSON.parse(localStorage.getItem('tripsync_offline_queue') || '[]');
      if (queue.length > 0) {
        setSyncStatus('syncing');
        // Simulate flushing queue to backend/broadcast
        setTimeout(() => {
          localStorage.removeItem('tripsync_offline_queue');
          setPendingSyncCount(0);
          setSyncStatus('synced');
          setTimeout(() => {
            setShowBanner(false);
            setSyncStatus('idle');
          }, 3500);
        }, 1200);
      } else {
        setSyncStatus('synced');
        setTimeout(() => {
          setShowBanner(false);
          setSyncStatus('idle');
        }, 3000);
      }
    } catch {
      setShowBanner(false);
    }
  };

  if (!showBanner && isOnline && pendingSyncCount === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg animate-in slide-in-from-top-4 duration-300 pointer-events-none">
      {!isOnline ? (
        // Offline / Mountain Mode Active Banner
        <div className="pointer-events-auto p-3 sm:px-4 sm:py-3 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Mountain className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Mountain Offline Mode</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Itineraries, expenses & emergency SOS numbers cached locally.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
            <WifiOff className="w-3 h-3" />
            <span>No Signal</span>
          </div>
        </div>
      ) : syncStatus === 'syncing' ? (
        // Syncing offline queued items
        <div className="pointer-events-auto p-3 sm:px-4 sm:py-3 rounded-2xl bg-slate-900/95 border-2 border-teal-500/80 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-white">Network Restored</span>
              <p className="text-[11px] text-slate-300">
                Syncing {pendingSyncCount} offline changes with your travel crew...
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Successfully reconnected & synced
        <div className="pointer-events-auto p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/80 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-black text-white">
              Online & Synchronized with Crew
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
