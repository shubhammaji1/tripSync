import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, Server, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — TripSync',
  description: 'How TripSync protects traveler privacy, itinerary data, and expense records.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Traveler Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            At TripSync, we believe collaborative travel planning should never come at the cost of your personal privacy. We collect only what is strictly necessary to power your group journeys.
          </p>
          <p className="text-xs text-slate-500">
            Last Updated: August 28, 2026 • Effective Date: August 28, 2026
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">Zero Ad-Tracking</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never sell your destination plans, itinerary schedules, or expense data to advertising brokers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">End-to-Rest Encryption</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your member phone numbers and private group settlement math are encrypted using AES-256 standards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">Your Data, Your Export</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export your complete itinerary and expense ledger as clean CSV or PDF anytime with one click.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              1. Information We Collect
            </h2>
            <p>
              When you use TripSync, we collect account details (name, email address, profile avatar via Clerk authentication), trip metadata (destinations, dates, itinerary schedules, and activity stops), shared financial logs (expense amounts, currencies, split distributions), and optional emergency phone contacts for your travel companions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              2. How Your Data Is Used
            </h2>
            <p>
              We process your data strictly to enable group collaboration: synchronizing real-time itinerary updates, computing optimal debt settlement graphs (minimizing the number of cash transfers between travelers), displaying 1-tap emergency safety directories, and emailing invitation links to co-travelers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              3. Emergency Safety Directory Visibility
            </h2>
            <p>
              Emergency contact numbers, local hospital contacts, and hotel desk numbers added to a trip workspace are visible exclusively to authorized travelers holding a valid membership token or invite link for that specific trip. They are never published to public search indexes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              4. Data Deletion & Retention
            </h2>
            <p>
              Trip owners retain full rights to delete any trip workspace. Deleting a trip permanently removes all associated activities, settlement records, tasks, and invite tokens from our production database clusters.
            </p>
          </section>
        </div>

        {/* Contact info */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">Have privacy questions or data requests?</h3>
            <p className="text-slate-400 mt-0.5">Our Data Protection Officer responds to all inquiries within 24 hours.</p>
          </div>
          <a
            href="mailto:privacy@tripsync.app"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-center shrink-0 transition-colors"
          >
            Contact Privacy Team
          </a>
        </div>
      </div>
    </div>
  );
}
