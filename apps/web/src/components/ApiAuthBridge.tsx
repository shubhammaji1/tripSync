'use client';

import { useAuth } from '@clerk/nextjs';
import { setOfflineUser } from '@/lib/offline';
import { useEffect, useRef } from 'react';
import { setApiAuthTokenProvider } from '@/lib/api';

export function ApiAuthBridge() {
  const { getToken, userId, sessionId, isLoaded } = useAuth();
  const tokenGetter = useRef(getToken);

  useEffect(() => {
    tokenGetter.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    const identity = userId && sessionId ? `${userId}:${sessionId}` : null;
    setApiAuthTokenProvider(() => tokenGetter.current(), identity);
    return () => setApiAuthTokenProvider(null, identity);
  }, [userId, sessionId, isLoaded]);

  useEffect(() => {
    if (isLoaded) void setOfflineUser(userId || null).catch(() => undefined);
  }, [userId, isLoaded]);
  return null;
}
