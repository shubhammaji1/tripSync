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
  FileText,
  MessageSquare,
  Zap,
  Navigation,
  Plane,
  Globe2,
  TrendingUp,
  Receipt,
  QrCode,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Luggage,
} from 'lucide-react';
import { TripSyncLogo } from '@/components/TripSyncLogo';

export default function LandingPage() {
  const { isSignedIn } = useUser();

  // Dynamic Animated Rotating Text
  const rotatingWords = [
    { text: 'Synced Itineraries.', color: 'from-emerald-500 to-teal-500' },
    { text: 'Fair Bill Splits.', color: 'from-teal-500 to-cyan-500' },
    { text: 'Offline Mountain SOS.', color: 'from-red-500 to-amber-500' },
    { text: 'Zero Chaos.', color: 'from-emerald-600 to-sky-600' },
    { text: 'One Shared Crew.', color: 'from-purple-500 to-pink-500' },
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  // Interactive Live Showcase Active Tab
  const [activeTab, setActiveTab] = useState<'itinerary' | 'split' | 'sos' | 'vault' | 'chat'>('itinerary');

  // Active testimonial index
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFadeState('in');
      }, 250);
    }, 3200);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  const testimonials = [
    {
      quote: "TripSync saved our 8-person Ladakh road trip. When we lost cellular signal on Khardung La pass, the offline emergency hub and medical notes were right there on everyone's phone.",
      author: 'Aarav Sharma',
      trip: 'Ladakh Bike Expedition',
      crew: '8 Travelers',
      avatar: '🏔️',
    },
    {
      quote: 'The Min-Cash Flow algorithm is sheer magic. Instead of calculating 30 separate Splitwise transfers after our Bali vacation, it boiled everything down into just 2 UPI payments.',
      author: 'Sneha & Rohan',
      trip: 'Bali Friends Getaway',
      crew: '6 Travelers',
      avatar: '🌴',
    },
    {
      quote: 'No more asking "what time are we leaving tomorrow?" in WhatsApp. The live schedule with Google Maps pins kept our entire college reunion crew perfectly synchronized.',
      author: 'Vikram Joshi',
      trip: 'Goa Coastal Reunion',
      crew: '12 Travelers',
      avatar: '🏖️',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-50 selection:bg-emerald-500 selection:text-white min-h-screen">
      {/* Background Radial Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-tr from-emerald-400/20 via-teal-300/15 to-sky-400/10 blur-[150px] pointer-events-none -z-10" />

      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-20 pb-12 sm:pb-20 text-center">
        {/* Live Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-emerald-300/80 text-emerald-800 text-[11px] sm:text-xs font-black uppercase tracking-wider mb-5 sm:mb-8 shadow-xs hover:shadow-sm transition-all">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>The Collaborative Group Travel Co-Pilot</span>
        </div>

        {/* Dynamic High-Impact Headline */}
        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.12] sm:leading-[1.1]">
          Travel Together.{' '}
          <span className="block sm:inline">
            <span
              className={`inline-block transition-all duration-300 transform bg-gradient-to-r ${rotatingWords[wordIndex].color} bg-clip-text text-transparent ${
                fadeState === 'in'
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-2 scale-95'
              }`}
            >
              {rotatingWords[wordIndex].text}
            </span>
          </span>
        </h1>

        {/* Value Prop Subtitle */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Say goodbye to chaotic WhatsApp chats, lost UPI screenshots, and missing tickets.
          TripSync unites your crew in <strong>one real-time, offline-ready workspace</strong>.
        </p>

        {/* Dynamic Action Buttons */}
        <div className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-slate-900/20 active:scale-95 transition-all hover:scale-[1.02]"
            >
              <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              <span>Go to My Trips</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-600/30 active:scale-95 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/dashboard?create=true"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300/90 shadow-xs hover:border-slate-400 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Plan New Group Trip</span>
          </Link>
        </div>

        {/* Micro Social Proof */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-slate-700 ml-1">4.9/5</span>
            <span>from 12,000+ travelers</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Free Setup • No App Store download required</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. INTERACTIVE LIVE FEATURE SHOWCASE CONTAINER */}
        {/* ========================================================= */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto rounded-3xl bg-slate-900 text-white p-4 sm:p-8 shadow-2xl border border-slate-800 text-left relative overflow-hidden">
          {/* Subtle Background Radial Aura */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Bar with Expedition Details & Crew */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Expedition Demo
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Try clicking the tabs below</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                <span>Darjeeling & Sikkim Expedition</span>
                <span className="text-sm sm:text-base">🏔️</span>
              </h3>
            </div>

            {/* Crew Avatars */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex -space-x-2">
                {[
                  { name: 'S', bg: 'from-emerald-500 to-teal-600' },
                  { name: 'P', bg: 'from-blue-500 to-indigo-600' },
                  { name: 'R', bg: 'from-purple-500 to-pink-600' },
                  { name: 'A', bg: 'from-amber-500 to-orange-600' },
                ].map((member, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr ${member.bg} text-white text-xs font-black flex items-center justify-center ring-2 ring-slate-900 shadow-xs`}
                  >
                    {member.name}
                  </div>
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-slate-400 font-semibold pl-1">4 Co-Travelers</span>
            </div>
          </div>

          {/* Interactive Showcase Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-4 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'itinerary', label: 'Smart Schedule', icon: Calendar, badge: 'Day 2' },
              { id: 'split', label: 'Min-Cash Split', icon: Split, badge: 'UPI Ready' },
              { id: 'sos', label: 'Offline Sentinel', icon: ShieldAlert, badge: '100% Offline' },
              { id: 'vault', label: 'Travel Vault', icon: FileText, badge: 'Passports & Passes' },
              { id: 'chat', label: 'Crew Chat & Feed', icon: MessageSquare, badge: 'Live' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700/80 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display Area */}
          <div className="pt-4">
            {/* 1. ITINERARY TAB */}
            {activeTab === 'itinerary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 04:30 AM • Stop 1
                    </span>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                      🌅 Sunrise
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Tiger Hill Kanchenjunga View</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Private cab pickup from hotel. Golden sunrise over Mount Everest and Kanchenjunga.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
                    <span>Lead: <strong>Priya</strong></span>
                    <span className="text-emerald-400 font-bold">₹1,800 cab</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 09:30 AM • Stop 2
                    </span>
                    <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                      ☕ Brunch
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Glenary&apos;s Bakery & Cafe</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Iconic heritage breakfast. Darjeeling first-flush tea, fresh pastries, and colonial terrace seating.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
                    <span>Lead: <strong>Shubham</strong></span>
                    <span className="text-emerald-400 font-bold">₹2,400 bill</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 02:00 PM • Stop 3
                    </span>
                    <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
                      🚂 Heritage
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Himalayan Toy Train Joyride</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    UNESCO heritage steam locomotive loop passing Batasia War Memorial and high-altitude alpine tea gardens.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
                    <span>Lead: <strong>Rahul</strong></span>
                    <span className="text-emerald-400 font-bold">4 tickets synced</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SPLIT TAB */}
            {activeTab === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Greedy Flow Engine
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      -75% Transfers
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white">Smart Debt Simplifier</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Instead of 12 confusing back-and-forth payments, TripSync optimizes all shared restaurant, cab, and hotel expenses into the absolute minimum transfers.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 md:col-span-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Optimal Settlement Plan:</span>
                    <span className="text-emerald-400">Total Group Spend: ₹18,600</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-[10px]">P</span>
                        <span className="font-bold text-white">Priya</span>
                        <span className="text-slate-400">➔ pays ➔</span>
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-[10px]">S</span>
                        <span className="font-bold text-white">Shubham</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">₹1,450</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">1-Tap UPI</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-[10px]">R</span>
                        <span className="font-bold text-white">Rahul</span>
                        <span className="text-slate-400">➔ pays ➔</span>
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-[10px]">A</span>
                        <span className="font-bold text-white">Ananya</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">₹2,100</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">1-Tap UPI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SOS TAB */}
            {activeTab === 'sos' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-red-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Emergency SOS Hub
                    </span>
                    <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
                      112 DIAL
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Darjeeling District Hospital</h4>
                  <p className="text-xs text-slate-300">
                    Emergency casualty: +91 354 225 2222. Offline turn-by-turn map coordinates cached.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5" /> Police & Tourist Safety
                    </span>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                      24x7 Ready
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Mall Road Tourist Police Station</h4>
                  <p className="text-xs text-slate-300">
                    Direct line: +91 354 225 2200. Hotel Elgin front desk contact stored in vault.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Offline Medical Card
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      Blood & Allergy
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Traveler Medical Records</h4>
                  <p className="text-xs text-slate-300">
                    Blood groups, altitude sickness meds, and emergency contacts accessible offline.
                  </p>
                </div>
              </div>
            )}

            {/* 4. VAULT TAB */}
            {activeTab === 'vault' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5" /> Boarding Passes
                    </span>
                    <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">
                      6E-2432
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">IndiGo CCU ➔ IXB Flights</h4>
                  <p className="text-xs text-slate-300">4 PDF passes encrypted & shared with co-passengers.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Luggage className="w-3.5 h-3.5" /> Stay Vouchers
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      Confirmed
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">The Elgin Heritage Resort</h4>
                  <p className="text-xs text-slate-300">3 nights deluxe suites • Booking ID: #ELG-99824.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Protected Passes
                    </span>
                    <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                      Sikkim Permit
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Nathula Pass Protected Area Permit</h4>
                  <p className="text-xs text-slate-300">Government approved visitor passes for all 4 members.</p>
                </div>
              </div>
            )}

            {/* 5. CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Shubham (Organizer)
                    </span>
                    <span className="text-[10px] text-slate-400">08:14 AM</span>
                  </div>
                  <p className="text-xs text-white">
                    &quot;Cabs are outside! Everyone carry light woolens for the high pass.&quot;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Priya
                    </span>
                    <span className="text-[10px] text-slate-400">08:16 AM</span>
                  </div>
                  <p className="text-xs text-white">
                    &quot;Uploaded breakfast receipts to the bill splitter. ₹1,200 total.&quot;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> TripSync Bot
                    </span>
                    <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">Bot</span>
                  </div>
                  <p className="text-xs text-white">
                    &quot;Next stop: Tiger Hill observatory in 25 mins. Weather: 14°C Clear.&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. "HOW TRIPSYNC WORKS" 3-STEP JOURNEY */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple & Effortless</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How TripSync Works in 3 Quick Steps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            Set up your group adventure in under two minutes with zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20">
              1
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span>Create & Invite Crew</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Set destination dates and generate a 1-click universal invite link for WhatsApp or Slack. Set roles (Lead, Co-Organizer, Traveler, Guest).
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-teal-500/20">
              2
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span>Co-Plan Daily Schedules</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Add stops, meals, reservations, and activities together. See live map routes, arrival estimates, and lead companions in real time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-cyan-600/20">
              3
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span>Split Bills & Stay Safe</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Log shared expenses with receipt photos. Our Min-Cash engine simplifies balances so everyone settles with a single 1-tap UPI transfer.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. MODERN BENTO FEATURE SHOWCASE MATRIX */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-black uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Engineered for Real-World Travel</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Everything Your Travel Crew Needs Under One Roof
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Bento Item 1: Min-Cash Flow */}
          <div className="md:col-span-2 bg-gradient-to-br from-white to-emerald-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Split className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Greedy Min-Cash Debt Settlement</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Traditional split apps leave groups with dozens of messy payments. TripSync runs algorithmic graph reduction to ensure the minimum possible peer-to-peer transfers.
              </p>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Before: 16 transfers</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <span>TripSync: Only 2 transfers!</span>
              </div>
            </div>
          </div>

          {/* Bento Item 2: Offline Mountain Sentinel */}
          <div className="bg-gradient-to-br from-white to-red-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">100% Offline Sentinel</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Hiking without cell coverage? Local police stations, hospitals, co-traveler contact cards, and medical summaries remain 100% available offline on your device.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-100/80 text-red-800 text-xs font-bold self-start">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>Works at 14,000+ ft altitude</span>
            </div>
          </div>

          {/* Bento Item 3: Multi-Currency */}
          <div className="bg-gradient-to-br from-white to-sky-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Multi-Currency Conversions</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Traveling internationally? Log USD, EUR, THB, JPY, or AED. TripSync auto-converts expenses in real time to your home currency for instant split clarity.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {['₹ INR', '$ USD', '€ EUR', '£ GBP', '฿ THB', '¥ JPY', 'AED'].map((cur) => (
                <span key={cur} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                  {cur}
                </span>
              ))}
            </div>
          </div>

          {/* Bento Item 4: Role-Based Access Control */}
          <div className="md:col-span-2 bg-gradient-to-br from-white to-purple-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Role-Based Team Governance</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Keep organizers in full control while enabling fellow travelers to contribute activities, log expenses, and invite family members with safe read-only viewer mode.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                👑 Owner (Trip Lead)
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                🛡️ Admin (Co-Organizer)
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                🎒 Member (Active Traveler)
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                👁️ Viewer (Read-Only Guest)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TRAVELER STORIES & SOCIAL PROOF */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Loved by Travel Crews Worldwide</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Real Stories from Real Expeditions
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &quot;{item.quote}&quot;
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{item.author}</h4>
                  <p className="text-xs text-emerald-600 font-semibold">{item.trip}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg">
                  {item.avatar}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. HIGH CONVERTING BOTTOM CALL-TO-ACTION SECTION */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8 sm:p-14 shadow-2xl border-2 border-emerald-500/30 overflow-hidden text-center sm:text-left">
          {/* Glows */}
          <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready for Takeoff?</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Plan Your Next Group Adventure in 60 Seconds
              </h2>

              <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-normal">
                Join thousands of travelers who organize stress-free roadtrips, vacations, treks, and reunions with TripSync.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/dashboard?create=true"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Create Group Trip Now</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
