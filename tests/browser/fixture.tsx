import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { TrailWatchDashboard } from '../../apps/web/src/components/trailwatch/TrailWatchDashboard';
import { FormAccessibility } from '../../apps/web/src/components/FormAccessibility';
import { api } from '../../apps/web/src/lib/api';
import { setOfflineUser, saveOfflineTrip } from '../../apps/web/src/lib/offline';
Object.assign(window, { offlineTest: { setOfflineUser, saveOfflineTrip } });
const scenario = new URLSearchParams(location.search).get('location') || 'Kyoto';
const coordinates: Record<string, [number, number]> = { Goa: [15.4909, 73.8278], GoaNoRoutes: [15.4909, 73.8278], Kyoto: [35.0116, 135.7681], Mumbai: [19.076, 72.8777], Darjeeling: [27.041, 88.2663], Zero: [0, 0] };
const position = coordinates[scenario];
api.getTrailWatchOverview = async () => ({ tripId: 'fixture', destination: scenario, overallStatus: position && scenario !== 'GoaNoRoutes' ? 'DISRUPTED' : 'UNKNOWN', monitoringStatus: scenario === 'GoaNoRoutes' ? 'PARTIAL' : position ? 'AVAILABLE' : 'UNAVAILABLE', resolvedLocation: position ? { latitude: position[0], longitude: position[1], name: scenario } : null,
  weatherError: position ? null : 'Destination coordinates are unavailable. Choose a precise trip location.', monitoredRoutesCount: position && scenario !== 'GoaNoRoutes' ? 1 : 0, activeAlertsCount: 0, affectedActivitiesCount: 0, communityReportsCount: 0,
  routes: position && scenario !== 'GoaNoRoutes' ? [{ id: 'route', tripId: 'fixture', name: `${scenario} route`, routeType: 'ROAD', status: 'CLOSED', startLocation: scenario, endLocation: 'Trail entrance', startLat: position[0], startLng: position[1], endLat: position[0] + 0.02, endLng: position[1] + 0.02, segments: [], lastCheckedAt: new Date().toISOString() }] : [], alerts: [], reports: [], affectedActivities: [],
  latestWeather: position ? { id: 'weather', tripId: 'fixture', latitude: position[0], longitude: position[1], temperature: 0, condition: 'Clear', humidityPercent: 50, rainfallMm: 0, windSpeedKmh: 2, visibilityKm: 8, source: 'Test weather fixture', recordedAt: new Date().toISOString() } : null, lastRefreshedAt: new Date().toISOString(),
} as any);
createRoot(document.getElementById('root')!).render(<main className="max-w-6xl mx-auto p-4"><h1 className="text-2xl mb-4">TrailWatch visual regression · {scenario}</h1><FormAccessibility /><TrailWatchDashboard tripId="fixture" tripDestination={scenario} /></main>);
