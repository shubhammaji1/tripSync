import React from 'react';
import Link from 'next/link';
import { TripSyncLogo } from '@/components/TripSyncLogo';
import { Heart, Globe, Shield, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-10 pb-20 md:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand & Mission (Spans full width on mobile, 2 cols on lg) */}
          <div className="col-span-2 lg:col-span-2 space-y-3 sm:space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 p-0.5 flex items-center justify-center">
                <TripSyncLogo size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  TripSync
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              The collaborative platform for group travel. Share itineraries, calculate expense balances, and keep your crew informed.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Shared travel workspace</span>
              </div>

              <span className="text-[10px] text-slate-500 font-medium">
                Plan • Coordinate • Travel
              </span>
            </div>
          </div>

          {/* Column 1: Platform & Features */}
          <div className="space-y-2.5 sm:space-y-3">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
              Features
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Itinerary Planner
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Smart Splitter
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Emergency SOS
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                  Universal Invites
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Safety & Support */}
          <div className="space-y-2.5 sm:space-y-3">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
              Help & Safety
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Safety Guide
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="mailto:support@tripsync.app" className="text-slate-400 hover:text-white transition-colors truncate block">
                  Contact Email
                </a>
              </li>
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Offline Printouts
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="col-span-2 sm:col-span-1 space-y-2.5 sm:space-y-3">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
              Trust & Privacy
            </h3>
            <ul className="space-y-2 text-xs grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0">
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Zero Ad-Tracking
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Data Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p className="flex items-center gap-1 text-center sm:text-left">
            <span>© {new Date().getFullYear()} TripSync Technologies Inc. Made with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
            <span>for group travelers.</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Global Cloud</span>
            </span>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-200 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-200 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/safety" className="hover:text-slate-200 transition-colors">
              Safety
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:text-slate-200 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
