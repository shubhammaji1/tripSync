'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import { TripSyncLogo } from './TripSyncLogo';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-[1440px] mx-auto min-h-16 px-3 sm:px-6 lg:px-8 py-2 sm:py-0 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3 sm:gap-6">
          <Link href="/" className="min-w-0 flex items-center gap-2 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl bg-slate-900/5 hover:bg-slate-900/10 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TripSyncLogo className="w-full h-full" />
            </div>
            <div className="min-w-0 flex flex-col leading-none">
              <span className="truncate text-2xl sm:text-4xl font-black tracking-[-0.06em] text-slate-900">TripSync</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-600">Travel OS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Trips
            </Link>
          </nav>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/dashboard?create=true"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Trip</span>
          </Link>

          {mounted && isLoaded ? (
            !isSignedIn ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-all"
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
