'use client';

import { useAuth } from '@clerk/nextjs';
import { setOfflineUser } from '@/lib/offline';
import { useEffect } from 'react';
import { setApiAuthTokenProvider } from '@/lib/api';

export function ApiAuthBridge() {
  const { getToken, userId, isLoaded } = useAuth();

  useEffect(() => {
    setApiAuthTokenProvider(() => getToken());
    return () => setApiAuthTokenProvider(null);
  }, [getToken, userId]);

  useEffect(() => {
    if (isLoaded) void setOfflineUser(userId || null).catch(() => undefined);
  }, [userId, isLoaded]);
  return null;
}
