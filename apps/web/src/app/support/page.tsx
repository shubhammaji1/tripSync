import React from 'react';
import Link from 'next/link';
import { HelpCircle, Mail, MessageSquare, Compass, ArrowLeft, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Support & Help Center — TripSync',
  description: 'Frequently asked questions, troubleshooting guides, and organizer support for TripSync.',
};

export default function SupportCenterPage() {
  const faqs = [
    {
      q: 'How does the Universal Group Invite Link work?',
      a: 'As the trip creator or organizer, you can generate a single universal invite link from the Members tab. When you post this link in your WhatsApp or Telegram group, anyone who clicks it joins your trip workspace immediately with the assigned role (Member or Viewer).',
    },
    {
      q: 'How does the optimal debt settlement calculation work?',
      a: 'TripSync uses a Greedy Min-Cash-Flow algorithm. Instead of everyone making multiple back-and-forth payments to each other for every meal or taxi ride, our engine calculates net balances and provides the absolute minimum number of direct peer-to-peer transfers to settle all group debts.',
    },
    {
      q: 'Can Viewers edit the itinerary or delete expenses?',
      a: 'No. TripSync implements role-based access control (RBAC). Users with the Viewer role have read-only access to view the day-by-day plan, expense totals, and emergency directory, but cannot add, edit, or delete trip data.',
    },
    {
      q: 'Is TripSync available on mobile?',
      a: 'Yes! TripSync is designed mobile-first. When accessing the platform from iOS Safari or Android Chrome, you get a native-feeling experience with a sticky bottom thumb dock, fast quick-action buttons (+), 1-tap Google Maps directions, and direct emergency speed dialing.',
    },
    {
      q: 'How do I add custom emergency contacts for my trip?',
      a: 'Navigate to the Emergency Mode tab inside any trip workspace. Organizers can add hospital phone numbers, accommodation desk lines, tourist police contacts, or use the "Auto-Populate Starter Contacts" button to quickly seed verified local numbers.',
    },
  ];

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center & Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Support & Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Everything you need to know about planning trips, managing group budgets, and collaborating with your travel crew on TripSync.
          </p>
        </div>

        {/* Contact Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Email Support</h3>
              <p className="text-xs text-slate-400 mt-0.5">Need help with an active expedition or account settings?</p>
            </div>
            <a
              href="mailto:support@tripsync.app"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 hover:text-brand-300"
            >
              <span>support@tripsync.app</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Feature Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">Have an idea for currency conversions or flight trackers?</p>
            </div>
            <a
              href="mailto:feedback@tripsync.app"
              className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              <span>Submit Feedback</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4 border-t border-slate-800 pt-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 transition-all open:border-slate-700 open:bg-slate-900/90"
              >
                <summary className="font-bold text-sm sm:text-base text-slate-200 cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{faq.q}</span>
                  <span className="text-brand-400 font-mono text-base group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
