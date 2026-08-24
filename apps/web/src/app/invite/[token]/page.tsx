'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await api.acceptInvitation({ token: params.token, fullName, password });
      if ('requiresEmailConfirmation' in response) {
        setConfirmationMessage(response.message);
        return;
      }
      setSession(response.user, response.token);
      router.push('/dashboard');
    } catch (reason: any) {
      setError(reason.message || 'This invitation could not be accepted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Join your TripSync trip</h1>
        <p className="mt-2 text-sm text-slate-500">Create your profile and password to accept this invitation.</p>

        {confirmationMessage ? (
          <p className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            {confirmationMessage}
          </p>
        ) : (
          <>
            <label className="mt-6 block text-sm font-semibold text-slate-700">Full name</label>
            <input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
            <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
