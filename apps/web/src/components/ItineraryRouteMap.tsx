'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
  Clock,
  User,
  Layers,
  ChevronRight,
  Route,
  Sparkles,
  Car,
  Maximize2,
  Calendar,
  Share2,
  Loader2,
  LocateFixed,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface ItineraryItem {
  id: string;
  title: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  leadName?: string;
}

interface ItineraryDay {
  id: string;
  dayNumber: number;
  date?: string;
  title?: string;
  items?: ItineraryItem[];
}

interface ItineraryRouteMapProps {
  days: ItineraryDay[];
  tripDestination?: string;
}

interface ResolvedWaypoint {
  id: string;
  dayNumber: number;
  dayId: string;
  stopIndex: number;
  globalIndex: number;
  title: string;
  locationName: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  leadName?: string;
  lat: number;
  lng: number;
}

// Vibrant Day Colors for Connected Trails & Pins
const DAY_COLORS = [
  { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', name: 'Emerald' },
  { stroke: '#0284c7', bg: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500', name: 'Sky' },
  { stroke: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', name: 'Purple' },
  { stroke: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', name: 'Amber' },
  { stroke: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500', name: 'Pink' },
  { stroke: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', name: 'Cyan' },
];

function getDayColor(dayNum: number) {
  return DAY_COLORS[(dayNum - 1) % DAY_COLORS.length];
}

// In-memory geocode cache
const geoCache: Record<string, { lat: number; lng: number }> = {};

export function ItineraryRouteMap({
  days,
  tripDestination = 'Nepal',
}: ItineraryRouteMapProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [resolvedWaypoints, setResolvedWaypoints] = useState<ResolvedWaypoint[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const polylinesGroupRef = useRef<any>(null);

  // 1. Flatten all items from days
  const allStops: { dayNum: number; dayId: string; item: ItineraryItem; stopIdx: number }[] = [];
  days.forEach((day) => {
    (day.items || []).forEach((item, idx) => {
      allStops.push({
        dayNum: day.dayNumber,
        dayId: day.id,
        item,
        stopIdx: idx + 1,
      });
    });
  });

  // 2. Geocode and resolve coordinates for every stop
  useEffect(() => {
    let isCancelled = false;

    async function geocodeAllStops() {
      setIsGeocoding(true);
      const results: ResolvedWaypoint[] = [];

      // Helper to fetch lat/lng from Nominatim
      const fetchCoords = async (query: string): Promise<{ lat: number; lng: number } | null> => {
        if (!query || query.trim().length < 2) return null;
        const normalized = query.trim().toLowerCase();
        if (geoCache[normalized]) return geoCache[normalized];

        try {
          // Check localStorage cache
          const localStored = localStorage.getItem(`tripsync_geo_${normalized}`);
          if (localStored) {
            const parsed = JSON.parse(localStored);
            geoCache[normalized] = parsed;
            return parsed;
          }
        } catch {}

        try {
          const params = new URLSearchParams({
            q: query,
            format: 'jsonv2',
            limit: '1',
          });
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const coords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };
              geoCache[normalized] = coords;
              try {
                localStorage.setItem(`tripsync_geo_${normalized}`, JSON.stringify(coords));
              } catch {}
              return coords;
            }
          }
        } catch {}
        return null;
      };

      // Fallback destination coordinates
      let baseDestCoords = { lat: 28.3949, lng: 84.124 }; // Default Nepal
      const resolvedDest = await fetchCoords(tripDestination);
      if (resolvedDest) baseDestCoords = resolvedDest;

      for (let i = 0; i < allStops.length; i++) {
        if (isCancelled) return;
        const { dayNum, dayId, item, stopIdx } = allStops[i];
        const searchLocation = item.location || item.title;

        let coords = await fetchCoords(searchLocation);
        if (!coords && item.location && tripDestination) {
          coords = await fetchCoords(`${item.location}, ${tripDestination}`);
        }
        if (!coords && item.title && tripDestination) {
          coords = await fetchCoords(`${item.title}, ${tripDestination}`);
        }

        // If not found, place with slight smart offset around destination
        if (!coords) {
          coords = {
            lat: baseDestCoords.lat + (Math.sin(i + 1) * 0.08) + ((dayNum - 1) * 0.05),
            lng: baseDestCoords.lng + (Math.cos(i + 1) * 0.08) + ((dayNum - 1) * 0.05),
          };
        }

        results.push({
          id: item.id,
          dayNumber: dayNum,
          dayId,
          stopIndex: stopIdx,
          globalIndex: i + 1,
          title: item.title,
          locationName: item.location || tripDestination,
          startTime: item.startTime,
          endTime: item.endTime,
          notes: item.notes,
          leadName: item.leadName,
          lat: coords.lat,
          lng: coords.lng,
        });
      }

      if (!isCancelled) {
        setResolvedWaypoints(results);
        setIsGeocoding(false);
      }
    }

    geocodeAllStops();

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(allStops.map((s) => s.item.id + s.item.location + s.item.title)), tripDestination]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (!mapContainerRef.current || !isMounted) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter: [number, number] =
        resolvedWaypoints.length > 0
          ? [resolvedWaypoints[0].lat, resolvedWaypoints[0].lng]
          : [28.3949, 84.124];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 8,
        zoomControl: false,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Official Tiles (Zero watermark, 100% free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      polylinesGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      renderLayers(L);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 4. Render Day-Wise Connecting Polylines & Interactive Markers
  const renderLayers = async (LInstance?: any) => {
    const L = LInstance || (await import('leaflet')).default;
    const map = mapInstanceRef.current;
    if (!map || !markersGroupRef.current || !polylinesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    polylinesGroupRef.current.clearLayers();

    if (resolvedWaypoints.length === 0) return;

    // Filter active waypoints based on day tab
    const filteredWaypoints =
      selectedDayId === 'all'
        ? resolvedWaypoints
        : resolvedWaypoints.filter((wp) => wp.dayId === selectedDayId);

    const latLngBounds: [number, number][] = [];

    // Group waypoints by day for day-wise trail rendering
    const dayGroups: Record<number, ResolvedWaypoint[]> = {};
    resolvedWaypoints.forEach((wp) => {
      if (!dayGroups[wp.dayNumber]) dayGroups[wp.dayNumber] = [];
      dayGroups[wp.dayNumber].push(wp);
    });

    // --- INTERACTIVE NUMBERED MARKERS ---
    filteredWaypoints.forEach((wp) => {
      latLngBounds.push([wp.lat, wp.lng]);
      const dayColor = getDayColor(wp.dayNumber);
      const isSelected = selectedStopId === wp.id;
      const displayWaypointNumber = selectedDayId === 'all' ? (wp.globalIndex || wp.stopIndex) : wp.stopIndex;

      // Custom Location Pin Icon with written D1, D2 at the bottom
      const iconHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
          <!-- Pulse ripple if selected -->
          ${
            isSelected
              ? `<div class="absolute bottom-3 w-6 h-2 rounded-full animate-ping opacity-75" style="background-color: ${dayColor.stroke};"></div>`
              : ''
          }

          <!-- Location Pin & Day Tag Container -->
          <div class="relative flex flex-col items-center transition-all duration-200 ${
            isSelected ? 'scale-125 -translate-y-1.5 drop-shadow-xl' : 'hover:scale-115 hover:-translate-y-0.5'
          }">
            <!-- Teardrop Location Pin SVG -->
            <div class="relative filter drop-shadow-md">
              <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Pin Teardrop Body -->
                <path
                  d="M16 0C7.16 0 0 7.16 0 16C0 26.5 14.2 37.1 15.36 37.95C15.74 38.23 16.26 38.23 16.64 37.95C17.8 37.1 32 26.5 32 16C32 7.16 24.84 0 16 0Z"
                  fill="${dayColor.stroke}"
                  stroke="#ffffff"
                  stroke-width="2"
                />
                <!-- Inner White Disc -->
                <circle cx="16" cy="15" r="9" fill="#ffffff" />
                <!-- Stop Number inside the pin head -->
                <text
                  x="16"
                  y="19"
                  text-anchor="middle"
                  fill="${dayColor.stroke}"
                  font-family="system-ui, -apple-system, sans-serif"
                  font-weight="900"
                  font-size="12px"
                >${displayWaypointNumber}</text>
              </svg>
            </div>

            <!-- Written D1, D2 badge at the bottom of the location pin -->
            <div class="-mt-1 px-2 py-0.5 rounded-full text-white text-[9px] font-black tracking-wider shadow-md border border-white flex items-center justify-center whitespace-nowrap z-10" style="background: linear-gradient(135deg, ${dayColor.stroke}, #0f172a);">
              <span>D${wp.dayNumber}</span>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-itinerary-marker',
        html: iconHtml,
        iconSize: [34, 52],
        iconAnchor: [17, 50],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: customIcon }).addTo(markersGroupRef.current);

      // Popup Content
      const popupHtml = `
        <div class="p-1 text-slate-900 font-sans min-w-[190px]">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white" style="background-color: ${dayColor.stroke};">
              Day ${wp.dayNumber} • Stop ${wp.stopIndex}
            </span>
            ${wp.startTime ? `<span class="text-[10px] font-bold text-slate-500">${wp.startTime}</span>` : ''}
          </div>
          <h4 class="font-extrabold text-xs text-slate-900 mb-0.5 leading-tight">${wp.title}</h4>
          <p class="text-[11px] text-slate-500 truncate mb-2">${wp.locationName}</p>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(wp.locationName)}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700"
          >
            <span>🧭 Navigate GPS</span> &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'custom-leaflet-popup',
      });

      marker.on('click', () => {
        haptic.light();
        setSelectedStopId(wp.id);
      });

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Auto-fit bounds to encompass all active waypoints
    if (latLngBounds.length > 0) {
      try {
        map.fitBounds(latLngBounds, {
          padding: [45, 45],
          maxZoom: 14,
        });
      } catch {}
    }
  };

  // Re-render markers and lines whenever filter or waypoints update
  useEffect(() => {
    renderLayers();
  }, [selectedDayId, selectedStopId, resolvedWaypoints]);

  // Center on specific stop when selected from list
  const handleSelectStop = (wp: ResolvedWaypoint) => {
    haptic.selection();
    setSelectedStopId(wp.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([wp.lat, wp.lng], 13, { duration: 0.8 });
    }
  };

  // Construct Multi-Stop Google Maps Route URL
  const stopsWithLocation = resolvedWaypoints.filter((s) => s.locationName || s.title);
  const routeLocations = stopsWithLocation.map((s) => s.locationName || s.title);
  const fullRouteUrl =
    routeLocations.length > 1
      ? `https://www.google.com/maps/dir/${routeLocations.map((loc) => encodeURIComponent(loc)).join('/')}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tripDestination)}`;

  const activeWaypointsList =
    selectedDayId === 'all'
      ? resolvedWaypoints
      : resolvedWaypoints.filter((wp) => wp.dayId === selectedDayId);

  return (
    <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-0">
      {/* Header & Day Selector Bar */}
      <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <Route className="w-3 h-3" />
              <span>Connected Route Visualizer</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {resolvedWaypoints.length} Stop{resolvedWaypoints.length === 1 ? '' : 's'} • Day 1 to Day {days.length || 1}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>Interactive Expedition Route</span>
            <span className="text-sm">🗺️</span>
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => {
                haptic.selection();
                setSelectedDayId('all');
                setSelectedStopId(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedDayId === 'all'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Days (Continuous Trail)
            </button>
            {days.map((d) => {
              const dayColor = getDayColor(d.dayNumber);
              const isActive = selectedDayId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    haptic.selection();
                    setSelectedDayId(d.id);
                    setSelectedStopId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dayColor.stroke }}
                  />
                  <span>Day {d.dayNumber}</span>
                </button>
              );
            })}
          </div>

          {/* Re-center / Fit View Button */}
          <button
            onClick={() => {
              haptic.light();
              renderLayers();
            }}
            title="Re-center all waypoints"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {/* Open Complete Multi-Stop Route in Google Maps App */}
          <a
            href={fullRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in GPS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Interactive Leaflet Map + Waypoint Connecting Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left: Interactive Map Canvas (Spans 7 cols) */}
        <div className="lg:col-span-7 relative h-[380px] lg:h-auto min-h-[380px] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-10" />

          {/* Geocoding Loading Shimmer Indicator */}
          {isGeocoding && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-lg">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Plotting connected day routes...</span>
            </div>
          )}

          {/* Floating Day Legend Bar at Map Bottom */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl hidden sm:flex items-center gap-3 text-[11px] font-bold">
            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Day Trails:</span>
            {days.slice(0, 5).map((d) => {
              const dayColor = getDayColor(d.dayNumber);
              return (
                <div key={d.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: dayColor.stroke }}
                  />
                  <span className="text-slate-300">Day {d.dayNumber}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Waypoints Connecting Timeline List (Spans 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col max-h-[520px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              {selectedDayId === 'all' ? 'Full Expedition Route' : 'Day Stops & Route'}
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {activeWaypointsList.length} Connected Waypoint{activeWaypointsList.length === 1 ? '' : 's'}
            </span>
          </div>

          {activeWaypointsList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <Compass className="w-8 h-8 text-slate-600 animate-spin" style={{ animationDuration: '6s' }} />
              <p className="text-xs font-bold text-slate-300">No stops scheduled for this day yet.</p>
              <p className="text-[11px] text-slate-500">
                Go to the Timeline View and click &quot;+ Add Activity&quot; with a location to plot it on the map.
              </p>
            </div>
          ) : (
            <div className="space-y-0 flex-1 relative">
              {activeWaypointsList.map((wp, idx) => {
                const isSelected = selectedStopId === wp.id;
                const dayColor = getDayColor(wp.dayNumber);
                const isLast = idx === activeWaypointsList.length - 1;

                return (
                  <div key={wp.id} className="relative flex gap-3 pb-3 group">
                    {/* Connecting Vertical Trail Line on Timeline */}
                    {!isLast && (
                      <div
                        className="absolute left-4 top-8 bottom-0 w-1 transition-all rounded-full"
                        style={{
                          backgroundColor: dayColor.stroke,
                          opacity: 0.85,
                        }}
                      />
                    )}

                    {/* Step Dot Pin */}
                    <button
                      type="button"
                      onClick={() => handleSelectStop(wp)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs transition-all shadow-md cursor-pointer z-10 ${
                        isSelected
                          ? 'scale-115 ring-2 ring-white shadow-emerald-500/50'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: dayColor.stroke }}
                    >
                      <span>{selectedDayId === 'all' ? (wp.globalIndex || idx + 1) : wp.stopIndex}</span>
                    </button>

                    {/* Stop Card */}
                    <div
                      onClick={() => handleSelectStop(wp)}
                      className={`flex-1 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white"
                              style={{ backgroundColor: dayColor.stroke }}
                            >
                              Day {wp.dayNumber}
                            </span>
                            {wp.startTime && (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{wp.startTime}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-white group-hover:text-emerald-400 transition-colors truncate">
                            {wp.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{wp.locationName}</span>
                          </p>
                        </div>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(wp.locationName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-colors shrink-0"
                          title="Navigate in Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
