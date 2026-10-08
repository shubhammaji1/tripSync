'use client';
import { useEffect, useState } from 'react';
import { CloudSun, RefreshCw } from 'lucide-react';
import type { TrailWatchOverview } from '@tripsync/types';
import { api } from '@/lib/api';

export function DestinationWeatherWidget({ tripId, destination }: { tripId: string; destination?: string; startDate?: string }) {
  const [overview, setOverview] = useState<TrailWatchOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setOverview(null); setError(null); setLoading(true);
    api.getTrailWatchOverview(tripId).then(data => { if (!cancelled) setOverview(data); })
      .catch(reason => { if (!cancelled) setError(reason.message || 'Weather could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tripId, destination, refresh]);
  const weather = overview?.latestWeather;
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900">
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-lg font-bold"><CloudSun className="h-5 w-5 text-sky-600" /> Current destination weather</h3>
      <button type="button" disabled={loading} aria-label="Refresh destination weather" onClick={() => setRefresh(value => value + 1)} className="rounded-lg p-2 disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
    </div>
    <p className="mt-2 text-sm text-slate-600">{overview?.resolvedLocation?.name || destination || 'Destination unavailable'}</p>
    {loading ? <p role="status" className="mt-4">Loading current weather…</p> : error ? <p role="alert" className="mt-4 text-red-700">{error}</p> : weather ? <>
      <p className="mt-4 text-3xl font-bold">{Math.round(weather.temperature)}°C</p>
      <p>{weather.condition}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600"><span>Rain: {weather.rainfallMm} mm</span><span>Wind: {weather.windSpeedKmh} km/h</span><span>Humidity: {weather.humidityPercent}%</span></div>
      <p className="mt-4 text-xs text-slate-500">{weather.source} · Observed {new Date(weather.recordedAt).toLocaleString()}</p>
    </> : <p className="mt-4 text-slate-600">{overview?.weatherError || 'Current weather is unavailable for this destination.'}</p>}
    <p className="mt-4 text-xs text-slate-500">Current conditions are not a forecast for future trip dates.</p>
  </section>;
}
