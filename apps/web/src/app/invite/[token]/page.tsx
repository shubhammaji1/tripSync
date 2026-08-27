'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { MapPin, Users, CheckCircle2, AlertCircle, ArrowRight, Compass, ShieldCheck, UserCheck } from 'lucide-react';

interface InvitationDetails {
  id: string;
  tripId: string;
  tripName: string;
  tripDestination: string;
  email: string | null;
  isShareable?: boolean;
  role: string;
  status: string;
  expiresAt: string;
  inviterName: string;
}

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded: isUserLoaded, user } = useUser();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const acceptanceStarted = useRef(false);

  // 1. Fetch invitation details
  useEffect(() => {
    let cancelled = false;
    setLoadingInvite(true);
    setInviteError(null);

    api.getInvitation(params.token)
      .then((data) => {
        if (cancelled) return;
        setInvitation(data);
        if (data.status === 'EXPIRED') {
          setInviteError('This invitation has expired. Please request a new invite from the trip organizer.');
        } else if (data.status === 'ACCEPTED' && !data.isShareable) {
          setInviteError('This invitation has already been accepted.');
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setInviteError(err.message || 'Invitation link is not valid or has expired.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingInvite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.token]);

  // 2. If already logged in, auto-accept (for both universal shareable link and matching email)
  useEffect(() => {
    if (!isUserLoaded || !user || !invitation || inviteError || acceptanceStarted.current) return;

    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    const invitedEmail = invitation.email?.toLowerCase();
    const isShareable = !invitation.email || invitation.isShareable || params.token.startsWith('join_');

    if (isShareable || (userEmail && invitedEmail && userEmail === invitedEmail)) {
      acceptanceStarted.current = true;
      setSubmitting(true);

      api.acceptInvitation({
        token: params.token,
        fullName: user.fullName || user.firstName || userEmail?.split('@')[0] || 'Trip member',
      })
        .then((response) => {
          if ('accepted' in response && response.accepted) {
            router.replace(response.tripId ? `/trips/${response.tripId}` : '/dashboard');
          }
        })
        .catch((err: any) => {
          setAuthError(err.message || 'Unable to join the trip.');
          acceptanceStarted.current = false;
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }, [isUserLoaded, user, invitation, inviteError, params.token, router]);

  const handleManualAccept = async () => {
    if (!user) return;
    setSubmitting(true);
    setAuthError('');
    try {
      const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
      const response = await api.acceptInvitation({
        token: params.token,
        fullName: user.fullName || user.firstName || userEmail.split('@')[0] || 'Trip member',
      });
      if ('accepted' in response && response.accepted) {
        router.replace(response.tripId ? `/trips/${response.tripId}` : '/dashboard');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Unable to join the trip.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOutAndSwitch = async () => {
    await signOut();
    router.push(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${params.token}`)}`);
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const invitedEmail = invitation?.email?.toLowerCase();
  const isShareable = !invitation?.email || invitation?.isShareable || params.token.startsWith('join_');
  const isEmailMismatch = !isShareable && Boolean(user && userEmail && invitedEmail && userEmail !== invitedEmail);

  if (loadingInvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm font-medium text-slate-600">Verifying invitation link...</p>
        </div>
      </main>
    );
  }

  if (inviteError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Invitation Invalid</h1>
          <p className="mt-2 text-sm text-slate-500">{inviteError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header with trip invitation details */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            {invitation?.tripName || 'Group Trip'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Invited by <strong className="text-slate-700">{invitation?.inviterName}</strong> as a{' '}
            <span className="font-semibold uppercase text-brand-700">{invitation?.role}</span>
          </p>
          {invitation?.tripDestination && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{invitation.tripDestination}</span>
            </div>
          )}
        </div>

        {/* State 1: User already logged in */}
        {user ? (
          <div className="mt-6 space-y-4">
            {isEmailMismatch ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Email address mismatch</p>
                <p className="mt-1 text-xs text-amber-700">
                  You are signed in as <strong>{userEmail}</strong>, but this invite was sent to{' '}
                  <strong>{invitedEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleSignOutAndSwitch}
                  className="mt-4 w-full rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-800"
                >
                  Sign out and switch to {invitedEmail}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Joining as {userEmail}...</span>
                </div>
                {authError && (
                  <div className="mt-4">
                    <p className="text-xs text-red-600 font-medium">{authError}</p>
                    <button
                      type="button"
                      onClick={handleManualAccept}
                      disabled={submitting}
                      className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
                    >
                      {submitting ? 'Joining...' : 'Try Joining Again'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* State 2: Not logged in - Signup or Direct Sign In buttons */
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0" />
              <span>
                {isShareable ? (
                  <>Universal Group Invitation &bull; <strong className="text-slate-900">Open to all travelers</strong></>
                ) : (
                  <>Invitation reserved for <strong className="text-slate-900">{invitation?.email}</strong></>
                )}
              </span>
            </div>

            <Link
              href={`/sign-up?redirect_url=${encodeURIComponent(`/invite/${params.token}`)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <span>Create Account & Join</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${params.token}`)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Already have an account? Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
