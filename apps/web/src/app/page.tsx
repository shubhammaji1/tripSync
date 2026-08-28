'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Compass,
  Calendar,
  Wallet,
  CheckSquare,
  ShieldAlert,
  Users,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Split,
  Plus,
  Shield,
  PhoneCall,
  Check,
  CheckCircle2,
  Lock,
  Eye,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn } = useUser();

  // Dynamic Animated Rotating Text for "Travel smarter."
  const rotatingWords = [
    'Travel smarter.',
    'Split bills fairly.',
    'Explore together.',
    'Stay safe offline.',
    'Never lose track.',
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFadeState('in');
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-50 selection:bg-emerald-500 selection:text-white">
      {/* Background Radial Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-tr from-emerald-400/20 via-teal-300/20 to-sky-400/15 blur-[140px] pointer-events-none -z-10" />

      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 text-center">
        {/* Live Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-300/80 text-emerald-800 text-xs font-black uppercase tracking-wider mb-6 shadow-sm hover:scale-105 transition-transform cursor-default">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>The Next-Gen Operating System for Group Travel</span>
        </div>

        {/* Dynamic Animated Headline */}
        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15] sm:leading-[1.12]">
          Plan together.{' '}
          <span
            className={`inline-block transition-all duration-300 transform bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent ${
              fadeState === 'in'
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95'
            }`}
          >
            {rotatingWords[wordIndex]}
          </span>{' '}
          <span className="block sm:inline">Stay in sync.</span>
        </h1>

        <p className="mt-6 sm:mt-8 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
          No more chaotic WhatsApp group chats, broken spreadsheets, lost UPI payment screenshots, or missing itinerary notes.
          TripSync brings your entire crew into <strong>one real-time collaborative workspace</strong>.
        </p>

        {/* Dynamic Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
              <span>Go to My Trips Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/dashboard?create=true"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300/90 shadow-sm transition-all hover:border-slate-400 active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Plan a New Group Trip</span>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* 2. INTERACTIVE LIVE PRODUCT PREVIEW SHOWCASE */}
        {/* ========================================================= */}
        <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-slate-800 text-left relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  👑 Active Expedition
                </span>
                <span className="text-xs text-slate-400">Live Workspace Preview</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                <span>Darjeeling & Sikkim Expedition</span>
                <span className="text-base font-normal text-slate-400">🏔️</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['S', 'P', 'R', 'A'].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black flex items-center justify-center ring-2 ring-slate-900"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-semibold pl-1">4 Travelers Synced</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            {/* Live Day Plan */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Day 2 • 04:30 AM
                </span>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">Sunrise</span>
              </div>
              <h4 className="font-bold text-sm text-white">Tiger Hill Peak Sunrise</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Wakeup call at 3:30 AM. Kanchenjunga observatory viewpoint.
              </p>
            </div>

            {/* Live Smart Split Settlement */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5" /> Min-Cash Flow
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Settled</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Rahul ➔ Shubham</span>
                <span className="font-extrabold text-white text-sm">₹1,200</span>
              </div>
              <p className="text-[10px] text-slate-400">1 direct transfer settled 4 group bills.</p>
            </div>

            {/* Live Emergency Hub */}
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Offline Safety
                </span>
                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">112 SOS</span>
              </div>
              <h4 className="font-bold text-sm text-white">Darjeeling District Hospital</h4>
              <p className="text-[11px] text-slate-400">1-tap calling & offline directions ready.</p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Card 1 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Collaborative Itineraries</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Design daily schedules together with activity leads, arrival times, and turn-by-turn Google Maps navigation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Split className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Min-Cash Debt Settlement</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Log shared group expenses in any currency and let our Greedy Min-Cash-Flow engine minimize peer-to-peer transfers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Offline Emergency Hub</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Instant 1-tap direct dialing to local police, ambulances, hotels, and co-travelers even without cellular internet.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SECTION ABOVE FOOTER (High Contrast & Elevated Separation) */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border-2 border-emerald-500/30 overflow-hidden">
          {/* Background Decorative Circles */}
          <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Role-Based Group OS</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Designed for Owners, Admins, Travelers, and Viewers
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Generate 1-click universal shareable invite links for WhatsApp & Slack. Assign granular permissions so organizers stay in control while friends & family view the live journey without accidental edits.
              </p>

              {/* Role Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                  👑 Owner (Lead)
                </span>
                <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">
                  🛡️ Admin (Co-Organizer)
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  🎒 Member (Active Traveler)
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
                  👁️ Viewer (Guest)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
