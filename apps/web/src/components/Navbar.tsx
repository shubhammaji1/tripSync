'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Plus,
  ShieldAlert,
  Users,
  ChevronDown,
  LogOut,
  User,
  Sparkles,
  Shield,
  Eye,
  Check,
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '@/lib/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activePersona, currentRole, isAuthenticated, logout, switchPersona } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const isDemoSession = Boolean(activePersona && isAuthenticated);

  const handleLogout = () => {
    logout();
    setShowPersonaMenu(false);
    router.push('/login');
    router.refresh();
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30';
      case 'ADMIN':
        return 'bg-sky-100 text-sky-900 border-sky-300 ring-1 ring-sky-400/30';
      case 'MEMBER':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/30';
      case 'VIEWER':
        return 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400/30';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-emerald-500 flex items-center justify-center text-white shadow-md group-hover:scale-[1.02] transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-4xl font-black tracking-[-0.06em] text-slate-900">TripSync</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-600">Travel OS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Trips
            </Link>
            {isDemoSession && (
              <Link
                href="/trips/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname.includes('/trips/')
                    ? 'bg-brand-50 text-brand-700 border border-brand-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Darjeeling Trip (Live Demo)
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={isDemoSession ? '/trips/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa?tab=emergency' : '/dashboard'}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Emergency Mode</span>
          </Link>

          <Link
            href="/dashboard?create=true"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Trip</span>
          </Link>

          {/* Auth State Control */}
          {isAuthenticated && user ? (
            <div className="relative pl-2 border-l border-slate-200">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                aria-expanded={showPersonaMenu}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 p-1 rounded-xl transition-colors text-left hover:bg-slate-100"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user.fullName || 'User'}
                  className="w-8 h-8 rounded-full ring-2 ring-brand-500/30 object-cover"
                />
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user.fullName || user.email.split('@')[0]}
                  </p>
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded border ${getRoleBadgeStyle(
                      currentRole
                    )}`}
                  >
                    {currentRole}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profile</p>
                    <p className="text-xs font-bold text-slate-900">{user.fullName || user.email}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                      <span className="text-[11px] font-semibold text-slate-600">Current role</span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded border ${getRoleBadgeStyle(currentRole)}`}>
                        {currentRole}
                      </span>
                    </div>
                  </div>

                  {isDemoSession && <div className="px-4 py-2">
                    <p className="text-[10px] uppercase font-bold text-brand-600 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Switch RBAC Role Simulator
                    </p>
                    <div className="space-y-1.5 mt-2">
                      {DEMO_PERSONAS.map((p) => {
                        const isCurrent = user.id === p.id || activePersona?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              switchPersona(p.id);
                              setShowPersonaMenu(false);
                            }}
                            className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                              isCurrent
                                ? 'bg-brand-50 border border-brand-200 text-brand-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img src={p.avatarUrl || ''} alt={p.fullName} className="w-6 h-6 rounded-full object-cover" />
                              <div>
                                <p className="text-xs font-semibold leading-tight">{p.fullName}</p>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                                    p.role
                                  )}`}
                                >
                                  {p.role}
                                </span>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 text-brand-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>}

                  <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
