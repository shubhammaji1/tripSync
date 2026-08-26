'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useSignUp, useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { signOut, setActive } = useClerk();
  const { signUp } = useSignUp();
  const { user } = useUser();
  const { setSession } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const signedInEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!user) {
        if (needsVerification) {
          const verification = await signUp.verifications.emailAddress.attemptVerification({ code: verificationCode });
          if (verification.status !== 'complete' || !verification.createdSessionId) {
            throw new Error('Enter the verification code sent to your email.');
          }
          await setActive({ session: verification.createdSessionId });
        } else {
          const created = await signUp.create({
            emailAddress: email.trim(),
            password,
            firstName: fullName.trim(),
          });
          if (created.status !== 'complete' || !created.createdSessionId) {
            await signUp.verifications.emailAddress.prepareVerification({ strategy: 'email_code' });
            setNeedsVerification(true);
            setConfirmationMessage(`Enter the verification code sent to ${email.trim()}.`);
            return;
          }
          await setActive({ session: created.createdSessionId });
        }
      }
      const response = await api.acceptInvitation({ token: params.token, fullName, password });
      if ('accepted' in response && response.accepted) {
        router.push('/dashboard');
        return;
      }
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

  const signInAsInvitee = async () => {
    await signOut();
    router.push(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${params.token}`)}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Join your TripSync trip</h1>
        <p className="mt-2 text-sm text-slate-500">Create your profile and password to accept this invitation.</p>

        {user && signedInEmail && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Signed in as <strong>{user.primaryEmailAddress?.emailAddress}</strong>. Accept this invitation only with the invited email address.
            <button type="button" onClick={signInAsInvitee} className="mt-2 block font-semibold text-brand-700 hover:text-brand-900">
              Sign out and use the invited account
            </button>
          </div>
        )}

        {confirmationMessage && !needsVerification ? (
          <p className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            {confirmationMessage}
          </p>
        ) : (
          <>
            {!user && <p className="mt-6 text-sm text-slate-500">Create your account with the email address that received this invitation.</p>}
            <label className="mt-4 block text-sm font-semibold text-slate-700">Full name</label>
            <input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            {!user && <>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Invited email</label>
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </>}
            <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
            <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            {needsVerification && <>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Verification code</label>
              <input required value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </>}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {submitting ? 'Joining trip...' : needsVerification ? 'Verify and join trip' : user ? 'Join trip' : 'Create account and join'}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
