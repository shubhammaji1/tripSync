'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Compass,
  Camera,
  Loader2,
  CheckCircle2,
  LocateFixed,
  ShieldAlert,
} from 'lucide-react';
import {
  TrailReportCategory,
  TrailWatchSeverity,
  TrailReport,
} from '@tripsync/types';
import { api } from '@/lib/api';
import { emitTripActivity } from '@/components/LiveActivityFeedDrawer';
import { haptic } from '@/lib/haptics';

interface ReportConditionModalProps {
  tripId: string;
  destination: string;
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: (report: TrailReport) => void;
  defaultLat?: number;
  defaultLng?: number;
}

export function ReportConditionModal({
  tripId,
  destination,
  isOpen,
  onClose,
  onReportCreated,
  defaultLat = 27.041,
  defaultLng = 88.2663,
}: ReportConditionModalProps) {
  const [category, setCategory] = useState<TrailReportCategory>(
    TrailReportCategory.POOR_VISIBILITY
  );
  const [severity, setSeverity] = useState<TrailWatchSeverity>(
    TrailWatchSeverity.MEDIUM
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(destination);
  const [latitude, setLatitude] = useState<number>(defaultLat);
  const [longitude, setLongitude] = useState<number>(defaultLng);
  const [imageUrl, setImageUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      haptic.medium();
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(5)));
          setLongitude(Number(pos.coords.longitude.toFixed(5)));
          setLocationName((prev) => (prev ? prev : 'Current GPS Location'));
        },
        (err) => {
          console.warn('Geolocation failed:', err);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and description of the condition.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createTrailReport(tripId, {
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
        locationName: locationName.trim() || destination,
        latitude,
        longitude,
        imageUrl: imageUrl.trim() || undefined,
      });

      // Broadcast over TripSync Realtime & Local Feed
      emitTripActivity(tripId, {
        type: 'SCHEDULE_CHANGE',
        title: `TrailWatch Report: ${created.title}`,
        description: `${created.category.replace('_', ' ')} reported near ${created.locationName || destination}.`,
        actorName: created.user?.fullName || 'Traveler',
      });

      haptic.success();
      onReportCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit community report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Report Road or Trail Condition
              </h3>
              <p className="text-xs text-slate-400">
                Help fellow travelers stay safe on the route
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Condition Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TrailReportCategory)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={TrailReportCategory.POOR_VISIBILITY}>Dense Fog / Poor Visibility</option>
              <option value={TrailReportCategory.ROAD_BLOCKED}>Road / Passage Blocked</option>
              <option value={TrailReportCategory.LANDSLIDE}>Landslide / Rockfall</option>
              <option value={TrailReportCategory.WATERLOGGING}>Waterlogging / Mud</option>
              <option value={TrailReportCategory.TRAIL_DAMAGED}>Trail Damaged / Eroded</option>
              <option value={TrailReportCategory.WEATHER_ISSUE}>Severe Rain / Snow / Wind</option>
              <option value={TrailReportCategory.HEAVY_TRAFFIC}>Traffic Jam / Checkpost Delay</option>
              <option value={TrailReportCategory.ROAD_CONSTRUCTION}>Road Construction Work</option>
              <option value={TrailReportCategory.UNSAFE_PASSAGE}>Unsafe Passage</option>
              <option value={TrailReportCategory.OTHER}>Other Hazard</option>
            </select>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { level: TrailWatchSeverity.LOW, label: 'Low', desc: 'Minor delay', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
                { level: TrailWatchSeverity.MEDIUM, label: 'Medium', desc: 'Caution', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
                { level: TrailWatchSeverity.HIGH, label: 'High', desc: 'Disruption', color: 'border-orange-500/50 bg-orange-500/10 text-orange-300' },
                { level: TrailWatchSeverity.CRITICAL, label: 'Critical', desc: 'Impasse', color: 'border-red-500/50 bg-red-500/10 text-red-300' },
              ].map((s) => (
                <button
                  key={s.level}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setSeverity(s.level);
                  }}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    severity === s.level
                      ? `${s.color} ring-2 ring-white/20 font-extrabold`
                      : 'border-white/10 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{s.label}</div>
                  <div className="text-[10px] opacity-75">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Short Headline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Heavy fog near Senchal lake junction"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Details & Advice for Travelers
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe road conditions, vehicle passability, fog lights requirement, or estimated delays..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Location Name & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Location Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Tiger Hill Road bend 4"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  GPS Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>My GPS</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white"
                  placeholder="Lng"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
