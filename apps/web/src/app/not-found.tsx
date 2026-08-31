'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, Home, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  const [speed, setSpeed] = useState('6s');
  const [isHonking, setIsHonking] = useState(false);

  const handleCarClick = () => {
    setIsHonking(true);
    setSpeed((prev) => (prev === '6s' ? '3s' : '6s'));
    setTimeout(() => setIsHonking(false), 1400);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center bg-white text-slate-900 py-8 sm:py-12 relative overflow-hidden select-none">
      
      {/* 1. Giant Isometric Watermark "404" in background */}
      <div
        style={{
          position: 'absolute',
          left: '3%',
          top: '50%',
          transform: 'translateY(-50%) rotate(-8deg)',
          fontSize: 'clamp(140px, 22vw, 320px)',
          fontWeight: 900,
          color: 'rgba(241, 245, 249, 0.95)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        404
      </div>

      {/* 2. Side-by-Side 2-Column Grid Layout */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Typography & Navigation matching reference */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-5">
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
              Ooops...
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 tracking-tight pt-1">
              Sorry, we can&apos;t find that page
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md pt-1 leading-relaxed">
              Looks like your expedition got caught driving in circles around the roundabout. Let&apos;s get you back on the right track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            {/* Pill button matching the reference design */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.back();
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-100/90 hover:bg-pink-200 text-pink-700 font-bold text-xs sm:text-sm border border-pink-200 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-pink-600 animate-spin duration-3000" />
              <span>Back</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/15 transition-all active:scale-95 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Trip Dashboard</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Home</span>
            </Link>
          </div>

          {/* Interactive Hint */}
          <p className="text-xs text-slate-400 font-medium pt-1">
            💡 <em>Tip: Click the car on the right to honk!</em>
          </p>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 3D Isometric Tree & Orbiting Car Scene */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center relative w-full h-[320px] sm:h-[380px] md:h-[440px]">
          <div
            onClick={handleCarClick}
            className="relative w-full h-full max-w-[460px] max-h-[460px] flex items-center justify-center cursor-pointer"
            title="Click the car to honk!"
          >
            {/* Interactive Honk Speech Bubble */}
            {isHonking && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in-75 duration-150 pointer-events-none">
                <span className="px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg border border-amber-300">
                  📢 BEEP BEEP! 🚗💨
                </span>
              </div>
            )}

            <svg
              viewBox="0 0 500 500"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Tree Cast Shadow Gradient */}
                <radialGradient id="treeShadow" cx="40%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0" />
                </radialGradient>

                {/* Ground Ambient Shadow */}
                <radialGradient id="groundShadowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#334155" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#334155" stopOpacity="0" />
                </radialGradient>

                {/* Road Surface Gradient */}
                <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>

                {/* Center Grass Island Gradient */}
                <linearGradient id="grassGrad" x1="20%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>

                {/* Tree Foliage Gradients */}
                <linearGradient id="treeTop" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="60%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="treeMid" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#065f46" />
                </linearGradient>

                <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#92400e" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
              </defs>

              {/* 1. Large Ambient Ground Cast Shadow */}
              <ellipse cx="280" cy="290" rx="170" ry="90" fill="url(#groundShadowGrad)" />

              {/* 2. Roundabout Outer Curb & Asphalt Road */}
              <g>
                {/* Outer Concrete Curb */}
                <ellipse cx="250" cy="275" rx="165" ry="92" fill="#cbd5e1" />
                <ellipse cx="250" cy="271" rx="162" ry="90" fill="#f8fafc" />
                
                {/* Asphalt Circular Road Surface */}
                <ellipse cx="250" cy="270" rx="148" ry="82" fill="url(#roadGrad)" stroke="#cbd5e1" strokeWidth="2" />
                
                {/* Inner Island Curb */}
                <ellipse cx="250" cy="270" rx="96" ry="54" fill="#cbd5e1" />
                <ellipse cx="250" cy="267" rx="93" ry="52" fill="#e2e8f0" />
              </g>

              {/* 3. Center Grass Island */}
              <g>
                <ellipse cx="250" cy="265" rx="86" ry="48" fill="url(#grassGrad)" />

                {/* Tree Extended Cast Shadow onto the road and grass (slanted to right) */}
                <ellipse cx="320" cy="265" rx="55" ry="28" fill="url(#treeShadow)" transform="rotate(15 320 265)" />

                {/* Decorative Stones & Low Poly Bushes on the Island */}
                {/* Left Bushes */}
                <ellipse cx="205" cy="270" rx="15" ry="11" fill="#047857" />
                <ellipse cx="203" cy="268" rx="13" ry="9" fill="#10b981" />

                {/* Right Bushes */}
                <ellipse cx="285" cy="280" rx="13" ry="9" fill="#047857" />
                <ellipse cx="284" cy="278" rx="11" ry="7" fill="#34d399" />

                {/* White / Gray Rock (matching reference image) */}
                <path d="M 268 254 L 278 244 L 286 256 L 274 262 Z" fill="#ffffff" />
                <path d="M 278 244 L 286 256 L 283 251 Z" fill="#cbd5e1" />
                
                {/* Small Pebbles */}
                <path d="M 235 280 L 244 274 L 250 283 L 239 286 Z" fill="#94a3b8" />
                <path d="M 244 274 L 250 283 L 247 280 Z" fill="#64748b" />

                {/* Autumn blossom dots */}
                <circle cx="220" cy="275" r="2.5" fill="#f59e0b" />
                <circle cx="226" cy="281" r="2" fill="#ef4444" />
                <circle cx="268" cy="283" r="2" fill="#f59e0b" />
                <circle cx="260" cy="287" r="2.5" fill="#ec4899" />
              </g>

              {/* 4. The 3D Low-Poly Tree (Trunk + Foliage) */}
              <g>
                {/* Tree Trunk */}
                <path
                  d="M 244 260 Q 241 200 248 155 L 256 155 Q 252 200 252 260 Z"
                  fill="url(#trunkGrad)"
                />
                
                {/* Branch split */}
                <path
                  d="M 246 195 Q 235 180 230 172 L 235 170 Q 243 180 248 190 Z"
                  fill="#78350f"
                />

                {/* Layer 1: Left Bushy Foliage */}
                <ellipse cx="226" cy="175" rx="30" ry="26" fill="url(#treeMid)" />
                <ellipse cx="223" cy="170" rx="22" ry="18" fill="#10b981" fillOpacity="0.4" />
                
                {/* Layer 2: Main Upper Lush Canopy */}
                <ellipse cx="252" cy="130" rx="44" ry="50" fill="url(#treeTop)" />
                <ellipse cx="248" cy="120" rx="36" ry="40" fill="#34d399" fillOpacity="0.45" />
                
                {/* Layer 3: Top Highlight Shading Bulb */}
                <ellipse cx="258" cy="110" rx="28" ry="30" fill="url(#treeTop)" />
                <ellipse cx="254" cy="102" rx="20" ry="20" fill="#6ee7b7" fillOpacity="0.55" />
              </g>

              {/* 5. The Animated Car driving smoothly around the tree */}
              <g>
                {/* SVG Native Continuous Elliptical Orbit Motion */}
                <animateMotion
                  dur={speed}
                  repeatCount="indefinite"
                  rotate="auto"
                  path="M 250 200 A 126 66 0 1 1 249.9 200 Z"
                />

                {/* 3D Isometric Car Graphic */}
                <g transform="scale(0.95)">
                  {/* Car Cast Shadow */}
                  <ellipse cx="0" cy="10" rx="34" ry="15" fill="#0f172a" fillOpacity="0.32" />

                  {/* Main Chassis Base */}
                  <path
                    d="M -30 2 L 18 2 L 32 8 L 28 14 L -26 14 L -32 8 Z"
                    fill="#cbd5e1"
                  />
                  <path
                    d="M -30 0 L 18 0 L 32 6 L -24 6 Z"
                    fill="#f8fafc"
                  />

                  {/* Car Body Sides (White Pearl) */}
                  <path
                    d="M -28 6 L 16 6 L 30 11 L 24 13 L -24 13 L -30 10 Z"
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />

                  {/* Blue Tinted Windows Cabin */}
                  <path
                    d="M -18 -10 L 4 -10 L 18 4 L -24 4 Z"
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth="1"
                  />

                  {/* Roof Top (Pure White) */}
                  <polygon
                    points="-16,-12 6,-12 4,-10 -18,-10"
                    fill="#ffffff"
                  />

                  {/* Front Windshield Tint Highlight */}
                  <polygon
                    points="4,-10 6,-12 20,4 18,4"
                    fill="#bae6fd"
                  />

                  {/* Side Window Pillars */}
                  <line x1="-8" y1="-10" x2="-8" y2="4" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="2" y1="-10" x2="6" y2="4" stroke="#0f172a" strokeWidth="1.5" />

                  {/* Wheels (Dark Rubber Tires + Silver Hubcaps) */}
                  <circle cx="-18" cy="11" r="5.5" fill="#1e293b" />
                  <circle cx="-18" cy="11" r="2.5" fill="#94a3b8" />

                  <circle cx="16" cy="11" r="5.5" fill="#1e293b" />
                  <circle cx="16" cy="11" r="2.5" fill="#94a3b8" />

                  {/* Headlights (Warm Amber) */}
                  <polygon points="30,7 33,8 31,11 28,10" fill="#f59e0b" />
                  
                  {/* Taillights (Red) */}
                  <polygon points="-30,5 -32,6 -31,9 -29,8" fill="#ef4444" />
                </g>
              </g>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
