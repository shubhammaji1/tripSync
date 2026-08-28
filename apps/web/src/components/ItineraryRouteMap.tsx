'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

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

export function ItineraryRouteMap({ days, tripDestination = 'Darjeeling, West Bengal, India' }: ItineraryRouteMapProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [selectedStop, setSelectedStop] = useState<ItineraryItem | null>(null);

  // Flatten or filter stops
  const activeDays =
    selectedDayId === 'all'
      ? days
      : days.filter((d) => d.id === selectedDayId);

  const stops: { dayNum: number; item: ItineraryItem }[] = [];
  activeDays.forEach((day) => {
    (day.items || []).forEach((item) => {
      stops.push({ dayNum: day.dayNumber, item });
    });
  });

  // Construct Multi-Stop Google Maps Route URL
  const stopsWithLocation = stops.filter((s) => s.item.location || s.item.title);
  const routeLocations = stopsWithLocation.map((s) => s.item.location || s.item.title);
  const fullRouteUrl =
    routeLocations.length > 1
      ? `https://www.google.com/maps/dir/${routeLocations.map((loc) => encodeURIComponent(loc)).join('/')}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tripDestination)}`;

  // Default coordinate center or query for embed
  const currentFocusLocation = selectedStop?.location || selectedStop?.title || tripDestination;
  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(currentFocusLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl overflow-hidden space-y-0">
      {/* Header & Day Selector Bar */}
      <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <Route className="w-3 h-3 inline mr-1" />
              Route Visualizer
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {stops.length} Waypoint{stops.length === 1 ? '' : 's'} Mapped
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>Interactive Expedition Route</span>
            <span className="text-sm font-normal text-slate-400">🗺️</span>
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => {
                setSelectedDayId('all');
                setSelectedStop(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                selectedDayId === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Days
            </button>
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDayId(d.id);
                  setSelectedStop(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  selectedDayId === d.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Day {d.dayNumber}
              </button>
            ))}
          </div>

          {/* Open Complete Multi-Stop Route in Google Maps App */}
          <a
            href={fullRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in GPS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Waypoint Stop Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        {/* Left: Interactive Map Canvas (Spans 7 cols) */}
        <div className="lg:col-span-7 relative h-[360px] lg:h-auto min-h-[360px] bg-slate-950">
          <iframe
            title="Interactive Route Map"
            src={embedMapUrl}
            className="w-full h-full border-0 grayscale-[20%] contrast-[110%] opacity-90 hover:opacity-100 transition-opacity"
            loading="lazy"
            allowFullScreen
          />

          {/* Floating Selected Stop Overlay Bar */}
          {selectedStop && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {selectedStop.startTime ? `${selectedStop.startTime} • Scheduled Stop` : 'Selected Waypoint'}
                </span>
                <h4 className="font-extrabold text-sm text-white truncate">{selectedStop.title}</h4>
                <p className="text-xs text-slate-400 truncate">
                  {selectedStop.location || tripDestination}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedStop.location || selectedStop.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </a>
            </div>
          )}
        </div>

        {/* Right: Waypoints Timeline List (Spans 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col max-h-[500px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Scheduled Stops & Waypoints
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {stops.length} location{stops.length === 1 ? '' : 's'}
            </span>
          </div>

          {stops.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <Compass className="w-8 h-8 text-slate-600 animate-spin-slow" />
              <p className="text-xs font-bold">No stops scheduled for this day yet.</p>
              <p className="text-[11px] text-slate-500">Add activities in the itinerary to view mapped routes.</p>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {stops.map(({ dayNum, item }, idx) => {
                const isSelected = selectedStop?.id === item.id;
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => setSelectedStop(item)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/70 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                              Day {dayNum}
                            </span>
                            {item.startTime && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {item.startTime}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location || item.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-colors shrink-0"
                        title="Open turn-by-turn directions in Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {item.location && (
                      <p className="text-xs text-slate-400 mt-2 pl-9 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    )}

                    {item.leadName && (
                      <div className="mt-2 pl-9 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Lead: {item.leadName}</span>
                      </div>
                    )}
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
