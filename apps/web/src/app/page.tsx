'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Split,
  Plus,
  Shield,
  CheckCircle2,
  Users,
  WifiOff,
  Coins,
  ChevronRight,
  Star,
  Quote,
  X,
  Luggage,
  Calendar,
  Layers,
} from 'lucide-react';
import { TripSyncLogo } from '@/components/TripSyncLogo';

export default function LandingPage() {
  const router = useRouter();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [activeFeatureDay, setActiveFeatureDay] = useState(1);

  // Dynamic Rotating Headline Animation for "Plan together."
  const rotatingWords = [
    'Plan together.',
    'Travel smarter.',
    'Split bills fairly.',
    'Explore together.',
    'Stay safe offline.',
    'Sync in real-time.',
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFadeState('in');
      }, 250);
    }, 2800);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    const cleanCode = inviteCode.trim().toUpperCase();
    router.push(`/dashboard?join=${cleanCode}`);
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 selection:bg-emerald-500 selection:text-white min-h-screen">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] bg-gradient-to-tr from-emerald-400/20 via-teal-300/15 to-sky-400/10 blur-[140px] pointer-events-none -z-10" />

      {/* ========================================================= */}
      {/* 1. HERO SECTION                                          */}
      {/* ========================================================= */}
      <section className="pt-8 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Live Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold shadow-xs mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-3 duration-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>The modern platform for group travel</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] sm:leading-[1.1] mb-5 sm:mb-6">
          <span
            className={`block sm:inline transition-all duration-300 transform ${
              fadeState === 'in'
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95'
            }`}
          >
            {rotatingWords[wordIndex]}
          </span>{' '}
          <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
            Travel without the chaos.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          Your itinerary, expenses, bookings and crew — together.
        </p>

        {/* Hero Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-12 sm:mb-16">
          <Link
            href="/dashboard?create=true"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
          >
            <span>Create a Trip</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setJoinModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-extrabold text-base shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Join a Trip</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* LIVE TRIP PREVIEW CARD                                   */}
        {/* Mobile: Compact card | Desktop: Expands to full cockpit   */}
        {/* ========================================================= */}
        <div className="relative mx-auto max-w-2xl text-left">
          {/* Card Accent Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-xl pointer-events-none" />

          <div className="relative bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-5 sm:p-7 overflow-hidden">
            {/* Live Indicator Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-black text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE TRIP</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Synced in real-time</span>
              </div>
            </div>

            {/* Trip Title & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Darjeeling + Sikkim
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Eastern Himalayas • 5 Days</span>
                </div>
              </div>

              {/* Crew Avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                    AS
                  </div>
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                    SR
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                    VJ
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                    +1
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600">4 travelers</span>
              </div>
            </div>

            {/* Itinerary Timeline */}
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="shrink-0 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                  09:30
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      Tiger Hill Sunrise
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Kanchenjunga summit view • Shared Jeep booked
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 shadow-xs">
                <div className="shrink-0 px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold">
                  12:00
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      Glenary&apos;s Bakery & Cafe
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                      Up Next
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium truncate mt-0.5">
                    Lunch stop • Sneha logging bill split (₹3,200)
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="shrink-0 px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-mono font-bold">
                  14:00
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      Toy Train Joyride
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Darjeeling Himalayan Railway • 4 tickets confirmed
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Expanded Footer Banner: Active Bill Split + Mountain Mode */}
            <div className="hidden sm:grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Split className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="font-bold text-slate-800">Glenary&apos;s Bill Split</p>
                  <p className="text-slate-500 truncate">Sneha paid • You owe ₹800</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Shield className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="truncate">
                  <p className="font-bold text-slate-800">Mountain Offline Mode</p>
                  <p className="text-slate-500 truncate">Saved locally on all phones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. WHY TRIPSYNC / EVERYTHING YOUR CREW NEEDS              */}
      {/* Mobile: Scannable vertical list | Desktop: 3 Pillar Cards */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600 mb-2">
            Why TripSync
          </p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Everything your crew needs
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
            No more jumping across WhatsApp, notes apps, and spreadsheets.
          </p>
        </div>

        {/* Mobile View: Clean High-Value Pillar List */}
        <div className="md:hidden space-y-3">
          {[
            {
              emoji: '🗺️',
              title: 'Shared itinerary',
              desc: 'Real-time collaborative scheduling everyone can see & edit together.',
            },
            {
              emoji: '💸',
              title: 'Simple expense splits',
              desc: 'Add expenses in any currency, settle up with minimum transfers via UPI or cash.',
            },
            {
              emoji: '📡',
              title: 'Offline-ready',
              desc: 'Full itinerary, maps, and cached docs work without cellular signal in remote mountains.',
            },
            {
              emoji: '💱',
              title: 'Multi-currency',
              desc: 'Automatic FX rates so no one overpays on international and border trips.',
            },
            {
              emoji: '👥',
              title: 'Crew controls',
              desc: 'Granular permissions for trip organizers, editors, and read-only viewers.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs"
            >
              <span className="text-2xl select-none shrink-0">{item.emoji}</span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: 3 Expanded Pillar Cards */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {/* Pillar 1: Plan */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Plan Together</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Build a dynamic, day-by-day shared schedule. Pin hotels, flights, and activities with exact time slots so everyone knows what’s next.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Drag & drop day builder</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Map routes & navigation links</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Shared voting on itinerary ideas</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Split */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
              <Split className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Split Fairly</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Log group expenses in any currency. Our cash-flow minimization engine boils 30 tangled debts down into 2 direct UPI or cash transfers.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Multi-currency auto conversion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Custom unequal & percentage splits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Direct UPI settlement links</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Sync */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Sync Anywhere</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Mountain mode caches your entire itinerary, emergency contacts, and document vault locally. Fully operational even without cell service.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Offline local storage caching</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Role-based organizer controls</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Offline medical & emergency SOS</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. FEATURES & UI PREVIEWS                                 */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600 mb-2">
            Features
          </p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Designed for how groups actually travel
          </h2>
        </div>

        {/* Feature 1: Large Shared Itinerary UI Preview */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Interactive Preview
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Shared Itinerary Cockpit
              </h3>
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 max-w-fit">
              {[
                { day: 1, label: 'Day 1: Darjeeling' },
                { day: 2, label: 'Day 2: Mirik' },
                { day: 3, label: 'Day 3: Gangtok' },
              ].map((tab) => (
                <button
                  key={tab.day}
                  type="button"
                  onClick={() => setActiveFeatureDay(tab.day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFeatureDay === tab.day
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Day Activities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeFeatureDay === 1 && (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      05:00 AM
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Sightseeing</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Tiger Hill Sunrise</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Panoramic sunrise view over Mount Kanchenjunga.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-md">
                      12:30 PM
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">Food & Drink</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Glenary&apos;s Bakery</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Pastries, Darjeeling organic tea, and group lunch.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                      04:00 PM
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Heritage</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Himalayan Mountaineering</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Institute & Everest expedition museum gallery.
                  </p>
                </div>
              </>
            )}

            {activeFeatureDay === 2 && (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      09:00 AM
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Drive</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Drive to Mirik Lake</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Scenic mountain road via tea gardens and viewpoints.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-md">
                      01:00 PM
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">Adventure</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Sumendu Lake Boating</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Pedal boats & pine tree trail horseback walk.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                      05:30 PM
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Sunset</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Tingling View Point</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Sunset view over the lush rolling tea valleys.
                  </p>
                </div>
              </>
            )}

            {activeFeatureDay === 3 && (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      08:30 AM
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Transit</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Gangtok Transfer</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Teesta river route to Sikkim state capital.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-md">
                      02:00 PM
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">Culture</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Rumtek Monastery</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Dharma Chakra Centre & historic Buddhist monastery.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                      07:00 PM
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Evening</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">MG Marg Stroll</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Pedestrian zone, cafes, and momos tasting.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Supporting Feature Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Offline Ready */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Mountain Offline Mode</h4>
                <p className="text-xs text-slate-500 font-semibold">Zero signal? No problem.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              High passes and remote trails often have zero cellular bars. TripSync automatically caches your complete itinerary, boarding passes, emergency numbers, and hotel contacts offline.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Offline Packet Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>100% Synced Locally</span>
              </span>
            </div>
          </div>

          {/* Card 2: Multi-Currency & Debt Minimization */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Multi-Currency & Smart Splits</h4>
                <p className="text-xs text-slate-500 font-semibold">Min-cash-flow algorithm</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Log expenses in USD, EUR, or INR. When the trip ends, TripSync cancels out circular debts so each traveler makes the absolute minimum number of payments.
            </p>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">12 messy debts simplified to:</span>
              <span className="font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-full shadow-xs">
                2 UPI payments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW IT WORKS                                           */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600 mb-2">
            Simple Workflow
          </p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How it works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
            From group chat spark to smooth mountain sunrise in 3 steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 01 */}
          <div className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-4xl font-black text-slate-200 select-none block mb-3">
              01
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Create</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Name your trip, set your start and end dates, and choose your primary currency in under 30 seconds.
            </p>
          </div>

          {/* Step 02 */}
          <div className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-4xl font-black text-emerald-300 select-none block mb-3">
              02
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Plan</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Share a simple 6-digit invite link with your crew. Add must-do spots, assign checklist tasks, and pin stays.
            </p>
          </div>

          {/* Step 03 */}
          <div className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-4xl font-black text-teal-300 select-none block mb-3">
              03
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Travel</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Follow the live schedule, log expenses on the fly, and enjoy your adventure without communication breakdowns.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. STORIES & HERO QUOTE                                   */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-slate-200/80">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
          <Quote className="w-6 h-6" />
        </div>

        {/* Featured Big Quote */}
        <blockquote className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto mb-6">
          &ldquo;Everyone knows what&apos;s happening next.&rdquo;
        </blockquote>

        <p className="text-sm sm:text-base text-slate-500 font-semibold mb-10 sm:mb-14">
          Trusted by over 12,000+ friend groups, trekking crews, and families worldwide.
        </p>

        {/* Testimonial Cards Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-1 text-amber-400 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-3">
              &ldquo;Saved our 8-person Ladakh road trip. Zero cellular signal on Khardung La pass, but our offline schedule and emergency numbers stayed right there.&rdquo;
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900">Aarav Sharma</span>
              <span className="text-slate-500 font-semibold">Ladakh Bike Expedition</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-1 text-amber-400 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-3">
              &ldquo;No more awkward WhatsApp calculations after a group dinner. The bill splitter simplified everything into 2 swift UPI payments.&rdquo;
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900">Sneha & Rohan</span>
              <span className="text-slate-500 font-semibold">Bali Friends Getaway</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FINAL CTA                                              */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
            Plan together. Travel without the chaos.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium max-w-md mx-auto mb-8">
            Create your itinerary, invite your friends with a link, and stay in sync every step of the way.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-sm mx-auto">
            <Link
              href="/dashboard?create=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <span>Create a Trip</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
            >
              Join a Trip
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* JOIN TRIP MODAL DIALOG                                    */}
      {/* ========================================================= */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-left relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-black text-slate-900">Join an Existing Trip</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter the 6-character trip code or invite link shared by your trip organizer.
            </p>

            <form onSubmit={handleJoinTrip} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. SIKKIM or TRP921"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Join Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
