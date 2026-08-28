'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Plus, Compass, Sparkles, ShieldAlert, LifeBuoy } from 'lucide-react';
import { TripSyncLogo } from './TripSyncLogo';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs transition-all">
      <div className="max-w-[1440px] mx-auto min-h-16 px-3 sm:px-6 lg:px-8 py-2 sm:py-0 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Navigation */}
        <div className="min-w-0 flex items-center gap-3 sm:gap-6">
          <Link href="/" className="min-w-0 flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-500/20 transition-all">
              <TripSyncLogo className="w-full h-full" />
            </div>
            <div className="min-w-0 flex flex-col leading-none">
              <span className="truncate text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                TripSync
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
            <Link
              href="/dashboard"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                pathname === '/dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>My Trips</span>
            </Link>
          </nav>
        </div>

        {/* Right: Plan Trip CTA & User Auth */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          {/* Clean Plan Trip CTA (Single + icon) */}
          <Link
            href="/dashboard?create=true"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Plan Trip</span>
          </Link>

          {mounted && isLoaded ? (
            !isSignedIn ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            ) : (
              <div className="pl-1 sm:pl-2 border-l border-slate-200">
                <UserButton />
              </div>
            )
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse hidden sm:block" />
          )}
        </div>
      </div>
    </header>
  );
}
