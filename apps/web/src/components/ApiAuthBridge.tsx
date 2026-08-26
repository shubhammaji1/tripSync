'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setApiAuthTokenProvider } from '@/lib/api';

export function ApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setApiAuthTokenProvider(() => getToken());
    return () => setApiAuthTokenProvider(null);
  }, [getToken]);

  return null;
}