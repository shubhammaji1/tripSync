'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(searchParams.get('email') || '');
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || token.length < OTP_MIN_LENGTH) return;

    try {
      setLoading(true);
      setError(null);
      const session = await api.verifyEmailOtp({ email, token });
      setSession(session.user, session.token);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'We could not verify that code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-300/30 to-ocean-300/30 blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-ocean-500 flex items-center justify-center text-white shadow-md">
            <MailCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Verify your email</h1>
            <p className="text-xs text-slate-500">Enter the one-time code we sent to finish creating your account.</p>
          </div>
        </div>

        <div className="p-3 mb-5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p>
            The verification code was sent to <strong className="text-slate-800">{email || 'your email address'}</strong>.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="email" className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 text-xs"
            />
          </div>

          <div>
            <label htmlFor="otp" className="block font-semibold text-slate-700 mb-1.5">Verification Code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              required
              minLength={OTP_MIN_LENGTH}
              maxLength={OTP_MAX_LENGTH}
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH))}
              placeholder="Enter your code"
              className="w-full px-3 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-center tracking-[0.45em] font-bold text-lg text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading || token.length < OTP_MIN_LENGTH}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Did not get a code? Check your spam folder, then <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">register again</Link> after waiting a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)]" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
