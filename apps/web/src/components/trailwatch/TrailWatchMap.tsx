'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  CloudFog,
  Navigation,
  Compass,
  Layers,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  X,
} from 'lucide-react';
import {
  TripRoute,
  TrailWatchAlert,
  TrailReport,
  WeatherSnapshot,
  AffectedActivity,
  RouteStatus,
  TrailWatchSeverity,
} from '@tripsync/types';
import { haptic } from '@/lib/haptics';

interface TrailWatchMapProps {
  destination: string;
  routes: TripRoute[];
  alerts: TrailWatchAlert[];
  reports: TrailReport[];
  weather?: WeatherSnapshot | null;
  affectedActivities: AffectedActivity[];
  onSelectAlert?: (alert: TrailWatchAlert) => void;
  onSelectReport?: (report: TrailReport) => void;
}

export function TrailWatchMap({
  destination,
  routes,
  alerts,
  reports,
  weather,
  affectedActivities,
  onSelectAlert,
  onSelectReport,
}: TrailWatchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ALERTS' | 'REPORTS' | 'ROUTES'>('ALL');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'alert' | 'report' | 'route' | 'activity';
    data: any;
  } | null>(null);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initOrUpdateMap() {
      const L = (await import('leaflet')).default;
      if (!mapContainerRef.current || !isMounted) return;

      // Initialize map instance if not yet created
      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] =
          weather && weather.latitude && weather.longitude
            ? [weather.latitude, weather.longitude]
            : [27.041, 88.2663]; // Darjeeling default

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 11,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // OpenStreetMap raster tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        layersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const layerGroup = layersGroupRef.current;
      if (!map || !layerGroup) return;

      layerGroup.clearLayers();
      const bounds: [number, number][] = [];

      // 1. Draw Route Lines & Segments
      if (activeFilter === 'ALL' || activeFilter === 'ROUTES') {
        routes.forEach((route) => {
          if (route.startLat && route.startLng && route.endLat && route.endLng) {
            bounds.push([route.startLat, route.startLng]);
            bounds.push([route.endLat, route.endLng]);

            const lineColor =
              route.status === RouteStatus.DISRUPTED
                ? '#ef4444' // red
                : route.status === RouteStatus.CAUTION
                ? '#f59e0b' // amber
                : '#10b981'; // emerald

            const polyline = L.polyline(
              [
                [route.startLat, route.startLng],
                [route.endLat, route.endLng],
              ],
              {
                color: lineColor,
                weight: 5,
                opacity: 0.85,
                dashArray: route.status === RouteStatus.CAUTION ? '8, 8' : undefined,
              }
            );

            polyline.on('click', () => {
              haptic.selection();
              setSelectedItem({ type: 'route', data: route });
            });

            layerGroup.addLayer(polyline);

            // Start & End markers
            const startIcon = L.divIcon({
              className: 'custom-route-icon',
              html: `
                <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-md text-emerald-400 font-bold text-[10px]" style="transform: translate(-50%, -50%);">
                  <span>START</span>
                </div>
              `,
              iconSize: [28, 28],
            });

            const endIcon = L.divIcon({
              className: 'custom-route-icon',
              html: `
                <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 border-sky-400 shadow-md text-sky-400 font-bold text-[10px]" style="transform: translate(-50%, -50%);">
                  <span>END</span>
                </div>
              `,
              iconSize: [28, 28],
            });

            const startMarker = L.marker([route.startLat, route.startLng], { icon: startIcon });
            startMarker.on('click', () => {
              haptic.selection();
              setSelectedItem({ type: 'route', data: route });
            });
            layerGroup.addLayer(startMarker);

            const endMarker = L.marker([route.endLat, route.endLng], { icon: endIcon });
            endMarker.on('click', () => {
              haptic.selection();
              setSelectedItem({ type: 'route', data: route });
            });
            layerGroup.addLayer(endMarker);
          }
        });
      }

      // 2. Draw Hazard & Condition Alerts
      if (activeFilter === 'ALL' || activeFilter === 'ALERTS') {
        alerts.forEach((alert) => {
          if (alert.latitude && alert.longitude) {
            bounds.push([alert.latitude, alert.longitude]);

            const isHigh =
              alert.severity === TrailWatchSeverity.HIGH ||
              alert.severity === TrailWatchSeverity.CRITICAL;
            const markerBg = isHigh ? '#ef4444' : '#f59e0b';

            const alertIcon = L.divIcon({
              className: 'custom-alert-pin',
              html: `
                <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -100%);">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce" style="background-color: ${markerBg};">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div class="px-1.5 py-0.5 mt-0.5 rounded bg-slate-950/90 text-white text-[9px] font-bold border border-white/20 whitespace-nowrap shadow-md">
                    ${alert.type}
                  </div>
                </div>
              `,
              iconSize: [32, 42],
            });

            const marker = L.marker([alert.latitude, alert.longitude], { icon: alertIcon });
            marker.on('click', () => {
              haptic.selection();
              setSelectedItem({ type: 'alert', data: alert });
              onSelectAlert?.(alert);
            });
            layerGroup.addLayer(marker);
          }
        });
      }

      // 3. Draw Community Reports
      if (activeFilter === 'ALL' || activeFilter === 'REPORTS') {
        reports.forEach((report) => {
          if (report.latitude && report.longitude) {
            bounds.push([report.latitude, report.longitude]);

            const reportIcon = L.divIcon({
              className: 'custom-report-pin',
              html: `
                <div class="relative flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -100%);">
                  <div class="w-7 h-7 rounded-full bg-violet-600 border-2 border-white text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div class="px-1.5 py-0.5 mt-0.5 rounded bg-slate-900 text-violet-300 text-[8px] font-extrabold border border-violet-500/30 whitespace-nowrap">
                    Report
                  </div>
                </div>
              `,
              iconSize: [28, 36],
            });

            const marker = L.marker([report.latitude, report.longitude], { icon: reportIcon });
            marker.on('click', () => {
              haptic.selection();
              setSelectedItem({ type: 'report', data: report });
              onSelectReport?.(report);
            });
            layerGroup.addLayer(marker);
          }
        });
      }

      // 4. Draw Affected Activities Marker
      affectedActivities.forEach((act) => {
        if (act.latitude && act.longitude) {
          bounds.push([act.latitude, act.longitude]);

          const actIcon = L.divIcon({
            className: 'custom-activity-pin',
            html: `
              <div class="relative flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -100%);">
                <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white text-slate-950 flex items-center justify-center shadow-xl ring-4 ring-amber-400/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" x2="16" y1="2" y2="6"/>
                    <line x1="8" x2="8" y1="2" y2="6"/>
                    <line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                </div>
                <div class="px-1.5 py-0.5 mt-0.5 rounded bg-amber-950 text-amber-300 text-[8px] font-black border border-amber-500/50 whitespace-nowrap shadow-md">
                  Day ${act.dayNumber} Activity
                </div>
              </div>
            `,
            iconSize: [32, 40],
          });

          const marker = L.marker([act.latitude, act.longitude], { icon: actIcon });
          marker.on('click', () => {
            haptic.selection();
            setSelectedItem({ type: 'activity', data: act });
          });
          layerGroup.addLayer(marker);
        }
      });

      // Fit map bounds smoothly
      if (bounds.length > 1) {
        try {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        } catch {}
      }
    }

    initOrUpdateMap();

    return () => {
      isMounted = false;
    };
  }, [routes, alerts, reports, affectedActivities, activeFilter]);

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Control Bar (Filter Layer & Legend) */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
        {[
          { id: 'ALL', label: 'All Layers' },
          { id: 'ALERTS', label: `Alerts (${alerts.length})` },
          { id: 'REPORTS', label: `Reports (${reports.length})` },
          { id: 'ROUTES', label: `Routes (${routes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              haptic.selection();
              setActiveFilter(tab.id as any);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeFilter === tab.id
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live Map Status Pill */}
      <div className="absolute top-3 right-3 hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-xs font-semibold text-slate-200">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live Route Intelligence</span>
      </div>

      {/* Selected Marker Detail Card / Drawer */}
      {selectedItem && (
        <div className="absolute bottom-3 left-3 right-3 sm:max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {selectedItem.type === 'alert' && (
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              {selectedItem.type === 'report' && (
                <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                  <Compass className="w-5 h-5" />
                </div>
              )}
              {selectedItem.type === 'route' && (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Navigation className="w-5 h-5" />
                </div>
              )}
              {selectedItem.type === 'activity' && (
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {selectedItem.type === 'activity' ? 'Planned Activity Impact' : selectedItem.type}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {selectedItem.data.title || selectedItem.data.name || selectedItem.data.activityTitle}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            {selectedItem.data.description || selectedItem.data.reason || selectedItem.data.conditionNotes}
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">
                {selectedItem.data.locationName || destination}
              </span>
            </div>
            {selectedItem.data.severity && (
              <span
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  selectedItem.data.severity === 'HIGH' || selectedItem.data.severity === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedItem.data.severity}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
