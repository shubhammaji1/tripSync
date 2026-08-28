import React from 'react';
import Link from 'next/link';
import { TripSyncLogo } from '@/components/TripSyncLogo';
import { Heart, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-12 pb-24 md:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission (Spans 2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <TripSyncLogo size={34} />
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  TripSync
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              The collaborative platform for modern group travel. Plan itineraries together, eliminate awkward bill splits with automated settlements, and keep everyone safe in real time.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational</span>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                v2.4.0 • Enterprise Cloud
              </span>
            </div>
          </div>

          {/* Column 1: Platform & Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Platform Features
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Itinerary Planner
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Smart Expense Splitter
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Emergency SOS Hub
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                  Role-Based Permissions (RBAC)
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                  Universal Group Invites
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Safety & Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Safety & Help
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Traveler Safety Guide
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <a href="mailto:support@tripsync.app" className="text-slate-400 hover:text-white transition-colors">
                  support@tripsync.app
                </a>
              </li>
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Offline Emergency Printouts
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                  Feature Requests & Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Trust & Privacy
            </h3>
            <ul className="space-y-2.5 text-xs">
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
                  Zero Ad-Tracking Pledge
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Data Security & Encryption
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Community Conduct Rules
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} TripSync Technologies Inc. Built with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
            <span>for travelers worldwide.</span>
          </p>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Global Travel Cloud (EN)</span>
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
