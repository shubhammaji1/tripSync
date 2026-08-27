'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
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
  Shield,
  Plane,
  Plus,
} from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-brand-300/25 via-ocean-300/25 to-purple-300/20 blur-[130px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>The Next-Gen Operating System for Group Travel</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1] sm:leading-[1.12]">
          Plan together.{' '}
          <span className="bg-gradient-to-r from-brand-600 via-teal-600 to-ocean-600 bg-clip-text text-transparent">
            Travel smarter.
          </span>{' '}
          Stay in sync.
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          No more chaotic WhatsApp groups, messy spreadsheets, lost UPI payment screenshots, or missing itineraries.
          TripSync unites your entire travel crew into one collaborative workspace.
        </p>

        {/* Dynamic CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4 text-brand-400" />
              <span>Go to My Trips Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/dashboard?create=true"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition-all hover:border-slate-400"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Plan a New Group Trip</span>
          </Link>
        </div>

        {/* Feature Preview Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Card 1 */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Collaborative Itineraries</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Design daily schedules together with activity leads, arrival times, and real-time syncing across all traveler devices.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Split className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Min-Cash Debt Settlement</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Log group expenses in any currency and let our algorithm compute the minimum number of UPI transfers needed to settle up.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Offline Emergency Hub</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Instant access to local hospitals, emergency contacts, hotel addresses, and group member phone numbers even without cell service.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Walkthrough Banner */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5" />
                <span>Seamless Team Roles</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Designed for Owners, Admins, Travelers, and Viewers
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Generate 1-click universal shareable invite links, assign roles with granular permissions, and manage your group travel effortlessly.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg transition-all"
              >
                Launch Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
