'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  AlertTriangle,
  CloudFog,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Navigation,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Info,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  TrailWatchOverview,
  TripRoute,
  TrailWatchAlert,
  TrailReport,
  WeatherSnapshot,
  AffectedActivity,
  RouteStatus,
  TrailWatchSeverity,
} from '@tripsync/types';
import { api } from '@/lib/api';
import { TrailWatchMap } from './TrailWatchMap';
import { ReportConditionModal } from './ReportConditionModal';
import { haptic } from '@/lib/haptics';

interface TrailWatchDashboardProps {
  tripId: string;
  tripDestination: string;
  onNavigateToItinerary?: () => void;
  canReport?: boolean;
}

export function TrailWatchDashboard({
  tripId,
  tripDestination,
  onNavigateToItinerary,
  canReport = true,
}: TrailWatchDashboardProps) {
  const [overview, setOverview] = useState<TrailWatchOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  // Sub-tabs below map: 'activities' | 'routes' | 'reports' | 'alerts'
  const [activeSubTab, setActiveSubTab] = useState<'activities' | 'routes' | 'reports' | 'alerts'>('activities');

  // Modal for reporting road/trail condition
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Load TrailWatch Overview from API
  const loadOverview = async (isManualRefresh = false) => {
    const version = ++requestVersion.current;
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await api.getTrailWatchOverview(tripId);
      if (version !== requestVersion.current) return;
      setOverview(data);
    } catch (err: any) {
      if (version !== requestVersion.current) return;
      console.warn('Failed to load TrailWatch overview:', err);
      setError(err?.message || 'Unable to fetch TrailWatch intelligence.');
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  };

  useEffect(() => {
    setOverview(null);
    setLoading(true);
    loadOverview();
    return () => { requestVersion.current++; };
  }, [tripId]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    haptic.success();
    try {
      await api.acknowledgeTrailWatchAlert(tripId, alertId);
      await loadOverview();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not acknowledge alert');
    }
  };

  const handleReportCreated = (newReport: TrailReport) => {
    void loadOverview();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/60 rounded-3xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <h4 className="text-base font-bold text-white">Scanning Trail & Route Intelligence...</h4>
        <p className="text-xs text-slate-400 mt-1">
          Gathering live weather snapshots, community reports, and route advisories for {tripDestination}.
        </p>
      </div>
    );
  }

  const weather = overview?.latestWeather;
  const routes = overview?.routes || [];
  const alerts = overview?.alerts || [];
  const reports = overview?.reports || [];
  const affected = overview?.affectedActivities || [];

  const overallStatus = overview?.overallStatus || RouteStatus.UNKNOWN;
  const limitedMonitoring = overallStatus === RouteStatus.UNKNOWN || (overview?.monitoringStatus !== 'AVAILABLE' && overallStatus === RouteStatus.NORMAL);

  return (
    <div className="space-y-6 rounded-3xl bg-slate-950 p-4 sm:p-6 text-slate-100">
      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-950/60 p-4 text-sm text-red-200">{error} <button type="button" onClick={() => loadOverview(true)} className="underline">Retry</button></div>}
      {overview?.weatherError && <p className="rounded-xl bg-amber-950/50 p-3 text-sm text-amber-200">{overview.weatherError}</p>}
      <p className="text-sm text-slate-300">Conditions cover the resolved location and submitted routes. Missing reports do not confirm that a route is safe. Current weather is not a forecast for future trip dates.</p>
      {/* 1. Header Banner & Quick Controls */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 border border-white/10 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    TrailWatch
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Location & reported conditions
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contextual route conditions, mountain weather, and community alerts for {tripDestination}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                haptic.medium();
                loadOverview(true);
              }}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
              title="Refresh intelligence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.medium();
                if (canReport) setIsReportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Report Condition</span>
            </button>
          </div>
        </div>

        {/* Status Pill & Freshness */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Overall Route Condition:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                limitedMonitoring ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' : overallStatus === RouteStatus.DISRUPTED
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : overallStatus === RouteStatus.CAUTION
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  limitedMonitoring ? 'bg-slate-400' : overallStatus === RouteStatus.DISRUPTED
                    ? 'bg-red-400'
                    : overallStatus === RouteStatus.CAUTION
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              {overallStatus === RouteStatus.UNKNOWN || (overview?.monitoringStatus !== 'AVAILABLE' && overallStatus === RouteStatus.NORMAL) ? 'Limited monitoring data' : overallStatus === RouteStatus.DISRUPTED
                ? 'Disruptions Reported'
                : overallStatus === RouteStatus.CAUTION
                ? 'Caution Advised'
                : 'Normal Conditions'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Weather Source: {weather?.source || 'Unavailable'}</span>
            <span>•</span>
            <span>Weather recorded: {weather?.recordedAt ? new Date(weather.recordedAt).toLocaleString() : 'Unavailable'}</span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Cockpit (4 Responsive Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Mountain Weather */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">Live Weather</span>
            <CloudFog className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white">
              {weather ? `${Math.round(weather.temperature)}°C` : '—'}
            </div>
            <div className="text-[11px] text-slate-300 font-semibold truncate mt-0.5">
              {weather?.condition || 'Weather unavailable'}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Rain: {weather?.rainfallMm ?? '—'} mm</span>
            <span>Vis: {weather?.visibilityKm != null ? `${weather.visibilityKm} km` : 'Unknown'}</span>
          </div>
        </div>

        {/* Metric 2: Monitored Routes */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">Monitored Routes</span>
            <Navigation className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white">{routes.length}</div>
            <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
              {routes.filter((r) => r.status === RouteStatus.NORMAL).length} clear,{' '}
              {routes.filter((r) => r.status === RouteStatus.CAUTION).length} cautious,{' '}
              {routes.filter((r) => r.status === RouteStatus.CLOSED || r.status === RouteStatus.DISRUPTED).length} disrupted,{' '}
              {routes.filter((r) => r.status === RouteStatus.UNKNOWN).length} unknown
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-emerald-400 font-bold">
              {routes.length ? 'Submitted routes available' : 'No routes submitted'}
          </div>
        </div>

        {/* Metric 3: Active Advisories */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-400">
              {alerts.filter((a) => !a.isAcknowledged).length}
            </div>
            <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
              {alerts.filter((a) => a.severity === TrailWatchSeverity.HIGH).length} high priority
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400">
            {alerts.filter((a) => a.isAcknowledged).length} acknowledged by crew
          </div>
        </div>

        {/* Metric 4: Affected Schedule */}
        <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between ${
          affected.length > 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-slate-900/80 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${affected.length > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
              Affected Schedule
            </span>
            <Calendar className={`w-4 h-4 ${affected.length > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black ${affected.length > 0 ? 'text-amber-400' : 'text-white'}`}>
              {affected.length}
            </div>
            <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
              {affected.length > 0 ? 'Activities may need review' : 'No itinerary conflicts'}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400">
            Itinerary unmodified (User in control)
          </div>
        </div>
      </div>

      {/* 3. Affected Activities Warning Banner (The Core TrailWatch Value) */}
      {affected.length > 0 && (
        <div className="bg-amber-950/40 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-200">
                  Potentially Affected Itinerary Activities ({affected.length})
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  TrailWatch detected route or weather conditions that may impact scheduled plans.
                </p>
              </div>
            </div>

            <div className="text-[11px] font-bold text-amber-300/90 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 self-start sm:self-auto">
              Schedule unmodified • You decide
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {affected.map((item) => (
              <div
                key={item.activityId}
                className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Day {item.dayNumber} · {item.dayDate}
                    </span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      {item.severity} IMPACT
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-extrabold text-white mt-2">
                    {item.activityTitle}
                  </h4>

                  {item.startTime && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.startTime} {item.endTime ? `- ${item.endTime}` : ''}</span>
                      {item.locationName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.locationName}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                    <p className="font-semibold text-amber-300 text-[11px] mb-0.5">
                      Condition Report: {item.conditionDescription}
                    </p>
                    {item.reason}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 truncate">
                    Source: {item.source}
                  </span>

                  <div className="flex items-center gap-2">
                    {item.alertId && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeAlert(item.alertId!)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {onNavigateToItinerary && (
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          onNavigateToItinerary();
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors"
                      >
                        <span>Itinerary</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Live Route & Condition Map (Interactive Leaflet Map) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Live Route & Hazard Map
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click pins to inspect warnings, road status, or submit reports
          </span>
        </div>

        <TrailWatchMap
          destination={tripDestination}
          location={overview?.resolvedLocation}
          routes={routes}
          alerts={alerts}
          reports={reports}
          weather={weather}
          affectedActivities={affected}
        />
      </div>

      {/* 5. Sub-Tabs & Detailed Collections (Routes, Reports, Advisories) */}
      <div className="space-y-4">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'activities', label: `Impacted Activities (${affected.length})` },
            { id: 'routes', label: `Monitored Routes (${routes.length})` },
            { id: 'reports', label: `Community Reports (${reports.length})` },
            { id: 'alerts', label: `Active Advisories (${alerts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic.selection();
                setActiveSubTab(tab.id as any);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Monitored Routes */}
        {activeSubTab === 'routes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        route.status === RouteStatus.UNKNOWN ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' : route.status === RouteStatus.DISRUPTED || route.status === RouteStatus.CLOSED
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : route.status === RouteStatus.CAUTION
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {route.status}
                    </span>
                    {route.distanceKm && (
                      <span className="text-xs font-bold text-slate-400">
                        {route.distanceKm} km{route.estimatedDurationMin ? ` · ~${route.estimatedDurationMin} mins` : ''}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white mt-2.5">{route.name}</h4>
                  {route.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{route.description}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    <span className="text-emerald-400 font-bold">{route.startLocation}</span>
                    <span className="text-slate-500">➔</span>
                    <span className="text-sky-400 font-bold">{route.endLocation}</span>
                  </div>

                  {/* Segments Preview */}
                  {route.segments && route.segments.length > 0 && (
                    <div className="mt-4 space-y-2 pt-3 border-t border-white/5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Key Segments
                      </span>
                      {route.segments.map((seg) => (
                        <div
                          key={seg.id}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{seg.name}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{seg.surfaceType}</span>
                          </div>
                          {seg.conditionNotes && (
                            <p className="text-[11px] text-slate-300">{seg.conditionNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Last inspected: {route.lastCheckedAt ? new Date(route.lastCheckedAt).toLocaleString() : 'Not inspected'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.medium();
                      if (canReport) setIsReportModalOpen(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold text-xs"
                  >
                    Report Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content: Community Reports Feed */}
        {activeSubTab === 'reports' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Verified and traveler-reported conditions along routes
              </span>
              <button
                type="button"
                onClick={() => {
                  haptic.medium();
                  if (canReport) setIsReportModalOpen(true);
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit New Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {report.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {report.verificationStatus}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-white mt-2">
                      {report.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{report.locationName || tripDestination}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[9px] text-emerald-400">
                        {(report.user?.fullName || 'T')[0]}
                      </div>
                      <span className="font-semibold text-slate-300">
                        {report.user?.fullName || 'Traveler'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-slate-300">
                      <ThumbsUp className="w-3 h-3 text-slate-400" />
                      <span>{report.upvotes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Active Advisories & Alerts */}
        {activeSubTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  alert.isAcknowledged
                    ? 'bg-slate-900/40 border-white/5 opacity-70'
                    : 'bg-slate-900/90 border-white/15 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      alert.severity === TrailWatchSeverity.HIGH
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">{alert.title}</h4>
                        <span className="px-2 py-0.2 rounded text-[9px] font-black uppercase bg-white/10 text-slate-300">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Source: {alert.source}</span>
                        <span>•</span>
                        <span>{alert.source.toLowerCase().includes('community') ? 'Community report · unverified' : `Confidence: ${Math.round(alert.confidence * 100)}%`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {alert.isAcknowledged ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledged</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all active:scale-95"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content: Impacted Activities List */}
        {activeSubTab === 'activities' && (
          <div>
            {affected.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-white/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No current activity advisories</h4>
                <p className="text-xs text-slate-400 mt-1">
                  No applicable advisories were found in the available data. Verify conditions locally before traveling.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {affected.map((item) => (
                  <div
                    key={item.activityId}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px]">
                          Day {item.dayNumber}
                        </span>
                        <h4 className="text-sm font-extrabold text-white">{item.activityTitle}</h4>
                      </div>
                      <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">{item.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {onNavigateToItinerary && (
                        <button
                          type="button"
                          onClick={onNavigateToItinerary}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                        >
                          <span>Review in Itinerary</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Report Modal */}
      <ReportConditionModal
        tripId={tripId}
        destination={tripDestination}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportCreated={handleReportCreated}
        defaultLat={overview?.resolvedLocation?.latitude}
        defaultLng={overview?.resolvedLocation?.longitude}
      />
    </div>
  );
}
