import React from 'react';
import Link from 'next/link';
import { ShieldAlert, HeartPulse, PhoneCall, MapPin, ArrowLeft, CheckCircle2, AlertTriangle, Share2 } from 'lucide-react';

export const metadata = {
  title: 'Traveler Safety & Emergency Standards — TripSync',
  description: 'How TripSync equips group travelers with offline emergency directories and fast SOS response protocols.',
};

export default function SafetyGuidelinesPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Mission Critical</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Traveler Safety & Emergency Standards
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Group expeditions are unforgettable adventures, but unexpected situations happen. TripSync is engineered with safety-first protocols so no traveler is ever left stranded or without help.
          </p>
        </div>

        {/* Quick SOS Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-white">1-Tap SOS Dialing</h3>
            <p className="text-xs text-red-200/80">Direct connection to 112, 100 Police, 108 Ambulance, and Fire Dept.</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-white">Medical & Hospitals</h3>
            <p className="text-xs text-emerald-200/80">Pre-saved local trauma centers, doctor clinics, and policy numbers.</p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-white">Offline Directory</h3>
            <p className="text-xs text-sky-200/80">All emergency numbers remain accessible offline without cellular data.</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-white">WhatsApp SOS Broadcast</h3>
            <p className="text-xs text-purple-200/80">1-click WhatsApp emergency message sharing itinerary & coordinates.</p>
          </div>
        </div>

        {/* Safety Guidelines */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-8">
          <h2 className="text-xl font-bold text-white">Core Safety Guidelines for Trip Organizers</h2>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">1. Register Member Phone Numbers Before Departure</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Always prompt travelers to add their active phone numbers in the Emergency Directory tab prior to boarding trains or flights.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">2. Populate Accommodation & Driver Details</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Add the hotel reception desk, tour guide, and dedicated taxi driver contact to the Emergency Hub under the 'Stay & Desk' category.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">3. Print or Screenshot the Offline Directory</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the 'Print / Save PDF' button in the Emergency Hub to keep a hard copy in luggage in remote mountainous or offshore zones.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Hotline Notice */}
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-800/40 flex items-start gap-4 text-xs text-red-200">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            In any life-threatening situation, immediately dial your local national emergency services (e.g. <strong>112</strong> across Europe & India, <strong>911</strong> in the USA/Canada, <strong>999</strong> in the UK).
          </p>
        </div>
      </div>
    </div>
  );
}
