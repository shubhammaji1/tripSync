'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_PERSONAS } from '@/lib/auth-context';
import { Compass, Sparkles, ArrowRight, Shield, UserCheck, Eye, KeyRound, Mail, Lock, ChevronDown } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchPersona } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaLogin = async (personaId: string) => {
    switchPersona(personaId);
    router.push('/trips/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-300/30 to-ocean-300/30 blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Standard Login Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-ocean-500 flex items-center justify-center text-white shadow-md">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Welcome Back</h1>
                <p className="text-xs text-slate-500">Sign in to your TripSync travel workspace</p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@tripsync.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-[11px] text-brand-600 hover:text-brand-700 font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    defaultValue="password123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  defaultChecked
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="remember" className="text-slate-600 text-[11px]">
                  Keep me signed in on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: 1-Click Role & Persona Access */}
        <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant RBAC Demo Access</span>
            </div>

            <h2 className="text-xl font-bold text-white">Experience TripSync Roles</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Click any traveler profile below to instantly simulate the application with their exact RBAC role permissions:
            </p>

            <button
              type="button"
              onClick={() => setShowHowItWorks((visible) => !visible)}
              aria-expanded={showHowItWorks}
              className="mb-4 flex w-full items-center justify-between rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2.5 text-left text-xs font-bold text-brand-200 transition-colors hover:bg-brand-500/20"
            >
              <span>How it works</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
            </button>

            {showHowItWorks && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-[11px] leading-relaxed text-slate-300">
                Select a traveler to open the demo trip with that role's permissions. Owners and admins can manage the trip, members can add shared updates, and viewers have read-only access. Use the email form above for a personal account.
              </div>
            )}

            <div className="space-y-2.5">
              {DEMO_PERSONAS.map((p) => {
                const isOwner = p.role === 'OWNER';
                const isAdmin = p.role === 'ADMIN';
                const isMember = p.role === 'MEMBER';
                const isViewer = p.role === 'VIEWER';

                return (
                  <button
                    key={p.id}
                    onClick={() => handlePersonaLogin(p.id)}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-400/40 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatarUrl || ''}
                        alt={p.fullName}
                        className="w-10 h-10 rounded-full ring-2 ring-white/20 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                            {p.fullName}
                          </p>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              isOwner
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : isAdmin
                                ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
                                : isMember
                                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                                : 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>🔐 Supabase Auth + NestJS RBAC Guard</span>
            <span>⚡ Instant Switcher</span>
          </div>
        </div>
      </div>
    </div>
  );
}
