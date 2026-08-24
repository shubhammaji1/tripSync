'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Compass,
  Calendar,
  MapPin,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const TRIPS_STORAGE_KEY = 'tripsync_trips';

const DEFAULT_TRIPS = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Darjeeling Himalayan Adventure',
    description: '4-day scenic mountain getaway featuring tea garden trails, Tiger Hill sunrise, and toy train ride.',
    destination: 'Darjeeling, West Bengal, India',
    startDate: '2026-09-10',
    endDate: '2026-09-14',
    budget: 35000,
    currency: 'INR',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    status: 'PLANNING',
    memberCount: 6,
    totalExpenses: 11600,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Goa Coastal Monsoon Retreat',
    description: 'Chilled weekend trip with beach hopping, sunset cruises, and seafood feast.',
    destination: 'North Goa, India',
    startDate: '2026-10-02',
    endDate: '2026-10-06',
    budget: 45000,
    currency: 'INR',
    coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    status: 'PLANNING',
    memberCount: 4,
    totalExpenses: 0,
  },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDemoSession, setIsDemoSession] = useState(false);

  // Form state for creating a new trip
  const [newTrip, setNewTrip] = useState({
    name: '',
    destination: '',
    startDate: '2026-11-15',
    endDate: '2026-11-19',
    budget: 30000,
    currency: 'INR',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  });

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const hasDemoPersona = typeof window !== 'undefined' && !!localStorage.getItem('tripsync_persona_id');
    setIsDemoSession(hasDemoPersona);

    if (typeof window === 'undefined') return;

    const savedTrips = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (savedTrips) {
      try {
        const parsedTrips = JSON.parse(savedTrips);
        if (Array.isArray(parsedTrips) && parsedTrips.length > 0) {
          setTrips(parsedTrips);
          return;
        }
      } catch (error) {
        console.warn('Trips load failed, falling back to defaults:', error);
      }
    }

    if (!hasDemoPersona) {
      setTrips([]);
      return;
    }

    setTrips(DEFAULT_TRIPS);

    api.getTrips().then((data) => {
      if (data && data.length > 0) {
        setTrips(data);
        localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(data));
      }
    }).catch(() => {
      setTrips(DEFAULT_TRIPS);
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(DEFAULT_TRIPS));
    });
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.name || !newTrip.destination) return;

    const created = {
      id: 'trip-' + Date.now(),
      ...newTrip,
      budget: Number(newTrip.budget) || 0,
      status: 'PLANNING',
      memberCount: 1,
      totalExpenses: 0,
      ownerName: user?.fullName || 'Trip Owner',
      ownerEmail: user?.email || 'owner@tripsync.local',
      members: [
        {
          id: user?.id || 'owner-current-user',
          name: user?.fullName || 'Trip Owner',
          email: user?.email || 'owner@tripsync.local',
          role: 'OWNER',
        },
      ],
    };

    let savedTrip = created;
    try {
      const response = await api.createTrip({
        name: newTrip.name,
        destination: newTrip.destination,
        description: newTrip.description || null,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        budget: Number(newTrip.budget) || null,
        currency: newTrip.currency,
        coverImage: newTrip.coverImage,
        privacy: 'PRIVATE',
      });
      savedTrip = { ...created, ...response, budget: Number(response.budget ?? created.budget) };
    } catch {
      // Keep the local trip available when the API/database is not configured.
    }

    const nextTrips = [savedTrip, ...trips];
    setTrips(nextTrips);
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(nextTrips));
    setShowCreateModal(false);
    setNewTrip({
      name: '',
      destination: '',
      startDate: '2026-11-15',
      endDate: '2026-11-19',
      budget: 30000,
      currency: 'INR',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    });
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('Delete this trip permanently?')) return;

    try {
      await api.deleteTrip(tripId);
    } catch {
      // Local/demo trips are not present in the API database.
    }

    const remainingTrips = trips.filter((trip) => trip.id !== tripId);
    setTrips(remainingTrips);
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(remainingTrips));
  };

  const filteredTrips = trips.filter((t) => {
    if (filter === 'all') return true;
    return t.status.toLowerCase() === filter;
  });

  const getTripDayCount = (trip: any) => {
    if (typeof window === 'undefined') return trip.dayCount || trip.days?.length || 0;
    try {
      const savedDays = JSON.parse(localStorage.getItem(`tripsync_trip_days_${trip.id}`) || '[]');
      return Array.isArray(savedDays) ? savedDays.length : trip.dayCount || trip.days?.length || 0;
    } catch {
      return trip.dayCount || trip.days?.length || 0;
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-8">
        {!isDemoSession && filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-20 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-100">
              <Plus className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">No trips yet</h2>
            <p className="mt-3 max-w-md text-base text-slate-500">
              Start your first trip as owner, invite your group, and build your itinerary, budget, and emergency plan from scratch.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create your first trip
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Your Group Trips</h1>
              <p className="text-base text-slate-500 mt-1">
                Manage your collaborative itineraries, split budgets, and travel plans.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {(['all', 'planning', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                  filter === tab
                    ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                role="link"
                tabIndex={0}
                onClick={() => { window.location.href = `/trips/${trip.id}`; }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    window.location.href = `/trips/${trip.id}`;
                  }
                }}
                className="group cursor-pointer bg-white rounded-[22px] border border-slate-200 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-all duration-200 flex flex-col focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={trip.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                    alt={trip.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between text-white">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/35 backdrop-blur-md px-3 py-1.5 text-[11px] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-brand-300" />
                      {trip.destination.split(',')[0]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      {trip.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-[2rem] leading-tight font-extrabold tracking-[-0.04em] text-slate-900">
                      {trip.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {trip.description}
                    </p>

                    <div className="flex items-center gap-5 mt-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{formatDate(trip.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{trip.memberCount} Members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{getTripDayCount(trip)} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-slate-400">Budget: </span>
                      <span className="font-bold text-slate-800">{formatCurrency(trip.budget || 0, trip.currency)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Spent: </span>
                      <span className="font-bold text-slate-800">{formatCurrency(trip.totalExpenses || 0, trip.currency)}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${trip.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteTrip(trip.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}

      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Plan a New Group Trip</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manali Snow Expedition"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manali, Himachal Pradesh, India"
                  value={newTrip.destination}
                  onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newTrip.endDate}
                    onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Budget (₹)</label>
                  <input
                    type="number"
                    value={newTrip.budget}
                    onChange={(e) => setNewTrip({ ...newTrip, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={newTrip.currency}
                    onChange={(e) => setNewTrip({ ...newTrip, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key goals or highlights for the group..."
                  value={newTrip.description}
                  onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Trips Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
