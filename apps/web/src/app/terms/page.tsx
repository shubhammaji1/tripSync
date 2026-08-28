import React from 'react';
import Link from 'next/link';
import { FileText, Scale, Shield, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — TripSync',
  description: 'Terms of Service, acceptable use policy, and community guidelines for TripSync.',
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Please review these terms before planning expeditions on TripSync. By accessing our platform, you agree to collaborative conduct and respectful travel coordination.
          </p>
          <p className="text-xs text-slate-500">
            Last Updated: August 28, 2026 • Effective Date: August 28, 2026
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">Group Accountability</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organizers and travelers agree to post accurate expense amounts and respect agreed itinerary schedules.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">Non-Commercial Safety</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              TripSync provides coordination tools and emergency directories, not certified travel insurance or transport booking.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">Fair Settlement Engine</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our automated Min-Cash-Flow algorithm provides optimal debt calculations for reference among group members.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              1. Account Creation & Security
            </h2>
            <p>
              You must provide accurate information when authenticating via Clerk. You are responsible for safeguarding your credentials and the invite links generated for your trips.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              2. Role-Based Permissions (RBAC)
            </h2>
            <p>
              Trip owners determine member roles (Admin, Member, Viewer). Viewers have read-only permissions and may not modify shared itineraries or delete expense ledgers. Admins have co-organizer privileges.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              3. Shared Expenses & Offline Disputes
            </h2>
            <p>
              TripSync computes debt settlements based on the numbers input by group members. We do not hold escrow funds or process banking payouts directly. All actual settlements are executed peer-to-peer between travelers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              4. Emergency Directory Disclaimer
            </h2>
            <p>
              The Emergency SOS feature enables quick-dialing to public emergency helplines (112, 100, 108) and custom contacts. TripSync is not an emergency dispatch agency and cannot be held liable for third-party emergency response times.
            </p>
          </section>
        </div>

        {/* Contact info */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">Need clarification on these terms?</h3>
            <p className="text-slate-400 mt-0.5">Reach out to our legal and operations team anytime.</p>
          </div>
          <a
            href="mailto:legal@tripsync.app"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center shrink-0 transition-colors"
          >
            Contact Legal Team
          </a>
        </div>
      </div>
    </div>
  );
}
