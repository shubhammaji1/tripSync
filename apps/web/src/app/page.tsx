'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Calendar,
  Wallet,
  CheckSquare,
  ShieldAlert,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Split,
  ChevronRight,
  Smartphone,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-brand-300/30 via-ocean-300/30 to-purple-300/20 blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-300/60 text-brand-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>The Open Source Operating System for Group Travel</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-[1.15]">
          Plan together.{' '}
          <span className="bg-gradient-to-r from-brand-600 to-ocean-600 bg-clip-text text-transparent">
            Travel smarter.
          </span>{' '}
          Stay connected.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          No more juggling WhatsApp chats, messy spreadsheets, lost UPI screenshots, and missing tickets.
          TripSync brings your entire group trip into one synchronized workspace.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/trips/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
          >
            <span>Explore Darjeeling Demo Trip</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard?create=true"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-sm transition-all hover:border-slate-400"
          >
            <span>Create New Trip</span>
          </Link>
        </div>

        {/* Live Trip Preview Card */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl p-4 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-2xl">
                🏔️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">Darjeeling Himalayan Adventure</h2>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                    Active Plan
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Darjeeling, India • Sep 10 - 14, 2026 (4 Days)
                </p>
              </div>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {['Rahul', 'Shubham', 'Priya', 'Amit', 'Sneha', 'Arjun'].map((name, i) => (
                  <div
                    key={name}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700"
                    title={name}
                  >
                    {name[0]}
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-500 pl-1">6 travelers</span>
            </div>
          </div>

          {/* Feature Grid inside preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs mb-1">
                <Calendar className="w-4 h-4" /> Itinerary
              </div>
              <p className="text-sm font-bold text-slate-900">4 Days • 12 Activities</p>
              <p className="text-xs text-slate-500 mt-1">Tiger Hill sunrise at 4:30 AM</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-ocean-700 font-semibold text-xs mb-1">
                <Wallet className="w-4 h-4" /> Expenses & Splits
              </div>
              <p className="text-sm font-bold text-slate-900">₹11,600 logged</p>
              <p className="text-xs text-slate-500 mt-1">Optimal debt solver active</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-semibold text-xs mb-1">
                <CheckSquare className="w-4 h-4" /> Responsibilities
              </div>
              <p className="text-sm font-bold text-slate-900">4 Tasks Assigned</p>
              <p className="text-xs text-slate-500 mt-1">Cab, First aid & Tickets</p>
            </div>

            <div className="p-4 rounded-xl bg-red-50/70 border border-red-100">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-xs mb-1">
                <ShieldAlert className="w-4 h-4" /> Emergency Ready
              </div>
              <p className="text-sm font-bold text-slate-900">Sadar Hospital & Police</p>
              <p className="text-xs text-slate-500 mt-1">Offline emergency pack ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Highlights Section */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything Your Travel Group Needs
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Designed from real group travel pain points — from sunrise wakeups to splitting the dinner bill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Collaborative Itinerary</h3>
              <p className="text-sm text-slate-600 mt-2">
                Plan day-by-day activities, assign responsible leads, organize timings, and reorder events in real-time.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center mb-4">
                <Split className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Debt Minimization Engine</h3>
              <p className="text-sm text-slate-600 mt-2">
                Our greedy min-cash-flow algorithm transforms messy multi-payer bills into the fewest possible direct transfers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Offline Emergency Mode</h3>
              <p className="text-sm text-slate-600 mt-2">
                Instant access to local hospitals, emergency contacts, hotel addresses, and group member phones even without cell service.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
