'use client';
import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
export function MountainOfflineSentinel() {
 const [offline, setOffline] = useState(false);
 const [dismissed, setDismissed] = useState(false);
 useEffect(() => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  const update = () => { setOffline(!navigator.onLine); setDismissed(false); };
  update(); window.addEventListener('online', update); window.addEventListener('offline', update);
  return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
 }, []);
 if (!offline || dismissed) return null;
 return <div role="status" className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl bg-slate-900 p-4 text-white shadow-xl border border-amber-400/40"><div className="flex items-start gap-3"><WifiOff className="h-5 w-5 shrink-0"/><div><p className="font-semibold">You are offline</p><p className="text-sm text-slate-300">Changes require a connection. <a className="underline text-emerald-300" href="/offline.html">Open saved itinerary and emergency contacts</a>. Saved information may be out of date.</p></div><button aria-label="Dismiss offline notice" onClick={() => setDismissed(true)}><X className="h-5 w-5"/></button></div></div>;
}
