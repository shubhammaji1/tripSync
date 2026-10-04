'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Plus, Compass, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { TripSyncLogo } from './TripSyncLogo';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xs transition-all">
      <div className="max-w-[1440px] mx-auto min-h-16 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="min-w-0 flex items-center gap-3 sm:gap-6">
          <Link href="/" className="min-w-0 flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-500/20 transition-all">
              <TripSyncLogo className="w-full h-full" />
            </div>
            <div className="min-w-0 flex flex-col leading-none">
              <span className="truncate text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                TripSync
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
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

        {/* Right Desktop: Plan Trip CTA & User Auth */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard?create=true"
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs hover:shadow active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plan Trip</span>
          </Link>

          {mounted && isLoaded ? (
            !isSignedIn ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            ) : (
              <div className="pl-2 border-l border-slate-200">
                <UserButton />
              </div>
            )
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
          )}
        </div>

        {/* Right Mobile: Hamburger Toggle ☰ */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && isLoaded && isSignedIn && (
            <div className="mr-1">
              <UserButton />
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>My Trips</span>
          </Link>

          <Link
            href="/dashboard?create=true"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-extrabold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Trip</span>
          </Link>

          {mounted && isLoaded && !isSignedIn && (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sign Up</span>
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
