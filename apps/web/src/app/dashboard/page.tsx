'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
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
  Search,
  Pencil,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

type PlaceSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  imageUrl?: string | null;
};

async function findPlaceImage(placeName: string): Promise<string | null> {
  const placeParts = placeName.split(',').map((part) => part.trim()).filter(Boolean);
  const searchName = placeParts.slice(0, 2).join(' ');
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${searchName} landscape`,
    gsrlimit: '1',
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*',
  });

  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    const data = await response.json();
    const pages = data.query?.pages ? Object.values(data.query.pages) as Array<{ imageinfo?: Array<{ mime?: string; thumburl?: string; url?: string }> }> : [];
    const image = pages
      .flatMap((page) => page.imageinfo || [])
      .find((info) => info.mime?.startsWith('image/'));
    return image?.thumburl || image?.url || null;
  } catch {
    return null;
  }
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isResolvingImage, setIsResolvingImage] = useState(false);
  const selectedDestinationRef = useRef<string | null>(null);

  useEffect(() => {
    if (isClerkLoaded && !isSignedIn) {
      router.replace(`/login?next=${encodeURIComponent('/dashboard')}`);
    }
  }, [isClerkLoaded, isSignedIn, router]);

  // Form state for creating a new trip
  const [newTrip, setNewTrip] = useState({
    name: '',
    destination: '',
    startDate: '2026-11-15',
    endDate: '2026-11-19',
    budget: 30000,
    currency: 'INR',
    description: '',
    coverImage: null as string | null,
  });

  // Form state for editing an existing trip
  const [editingTrip, setEditingTrip] = useState<{
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    currency: string;
    description: string;
    status: string;
    coverImage: string | null;
  } | null>(null);

  useEffect(() => {
    const query = (showEditModal ? editingTrip?.destination : newTrip.destination)?.trim() || '';
    if (selectedDestinationRef.current === query) {
      setDestinationSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }
    if (query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'jsonv2',
          addressdetails: '1',
          limit: '5',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        });
        if (response.ok) {
          const places: PlaceSuggestion[] = await response.json();
          if (!controller.signal.aborted) setDestinationSuggestions(places);
        }
      } catch {
        if (!controller.signal.aborted) setDestinationSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [newTrip.destination, editingTrip?.destination, showEditModal]);

  const selectDestination = async (place: PlaceSuggestion) => {
    selectedDestinationRef.current = place.display_name;
    setDestinationSuggestions([]);
    setIsResolvingImage(true);
    const coverImage = await findPlaceImage(place.display_name);
    if (showEditModal && editingTrip) {
      setEditingTrip((curr) => curr ? { ...curr, destination: place.display_name, coverImage } : null);
    } else {
      setNewTrip((current) => ({ ...current, destination: place.display_name, coverImage }));
    }
    setIsResolvingImage(false);
  };

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isClerkLoaded && isSignedIn) {
      api.getTrips().then(setTrips).catch(() => setTrips([]));
    }
  }, [isClerkLoaded, isSignedIn]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.name || !newTrip.destination) return;

    setIsResolvingImage(true);
    const coverImage = newTrip.coverImage || await findPlaceImage(newTrip.destination);
    setIsResolvingImage(false);

    try {
      const response = await api.createTrip({
        name: newTrip.name,
        destination: newTrip.destination,
        description: newTrip.description || null,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        budget: Number(newTrip.budget) || null,
        currency: newTrip.currency,
        coverImage,
        privacy: 'PRIVATE',
      });
      setTrips((current) => [response, ...current]);
    } catch (reason: any) {
      window.alert(reason.message || 'Trip could not be saved.');
      return;
    }
    setShowCreateModal(false);
    setNewTrip({
      name: '',
      destination: '',
      startDate: '2026-11-15',
      endDate: '2026-11-19',
      budget: 30000,
      currency: 'INR',
      description: '',
      coverImage: null,
    });
  };

  const handleOpenEdit = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    selectedDestinationRef.current = trip.destination;
    setEditingTrip({
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate ? trip.startDate.split('T')[0] : '2026-11-15',
      endDate: trip.endDate ? trip.endDate.split('T')[0] : '2026-11-19',
      budget: Number(trip.budget || 0),
      currency: trip.currency || 'INR',
      description: trip.description || '',
      status: trip.status || 'PLANNING',
      coverImage: trip.coverImage || null,
    });
    setShowEditModal(true);
  };

  const handleSaveEditTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    try {
      const updated = await api.updateTrip(editingTrip.id, {
        name: editingTrip.name,
        destination: editingTrip.destination,
        description: editingTrip.description || null,
        startDate: editingTrip.startDate,
        endDate: editingTrip.endDate,
        budget: Number(editingTrip.budget) || null,
        currency: editingTrip.currency,
        status: editingTrip.status,
        coverImage: editingTrip.coverImage,
      });

      setTrips((prev) =>
        prev.map((t) => (t.id === editingTrip.id ? { ...t, ...updated } : t))
      );
      setShowEditModal(false);
      setEditingTrip(null);
    } catch (err: any) {
      window.alert(err.message || 'Failed to update trip.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('Delete this trip permanently?')) return;

    try {
      await api.deleteTrip(tripId);
    } catch (reason: any) {
      window.alert(reason.message || 'Trip could not be deleted.');
      return;
    }

    const remainingTrips = trips.filter((trip) => trip.id !== tripId);
    setTrips(remainingTrips);
  };

  const filteredTrips = trips.filter((t) => {
    const matchesFilter = filter === 'all' || (t.status && t.status.toLowerCase() === filter);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.destination?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Pagination calculation for 20+ cards
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage) || 1;
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTripDayCount = (trip: any) => {
    return trip.dayCount || trip.days?.length || 0;
  };

  if (!isClerkLoaded || !isSignedIn) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
        <p className="text-sm text-slate-500">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {trips.length === 0 ? (
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create your first trip
            </button>
          </div>
        ) : (
          <div>
            {/* Header with Title and Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Your Group Trips</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Manage your collaborative itineraries, split budgets, and travel plans.
                </p>
              </div>

              {/* Action and Quick Search */}
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search trips..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Plan Trip</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Trip Count Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', 'planning', 'active', 'completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setFilter(tab);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      filter === tab
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{filteredTrips.length}</strong> {filteredTrips.length === 1 ? 'trip' : 'trips'}
                {trips.length > 20 && ` (Total: ${trips.length})`}
              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
                <h2 className="text-lg font-bold text-slate-900">No trips found</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {searchQuery ? `No trips matching "${searchQuery}"` : `No trips with status "${filter}"`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Compact Modern Responsive Card Grid (3-4 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
                  {paginatedTrips.map((trip) => (
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
                      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {/* Compact Image Header */}
                      <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={trip.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                          alt={trip.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between text-white">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold truncate max-w-[65%]">
                            <MapPin className="w-3 h-3 text-brand-300 shrink-0" />
                            <span className="truncate">{trip.destination?.split(',')[0]}</span>
                          </span>
                          <span className="inline-flex items-center rounded-md bg-emerald-500/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                            {trip.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="text-base font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors" title={trip.name}>
                              {trip.name}
                            </h2>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                            {trip.description || 'No description provided.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(trip.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{trip.memberCount || 1} Members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-slate-400" />
                              <span>{getTripDayCount(trip)} Days</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Footer with Quick Edit & Delete Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Budget / Spent</span>
                            <span className="font-bold text-slate-800 text-xs">
                              {formatCurrency(trip.budget || 0, trip.currency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit trip details"
                              aria-label={`Edit ${trip.name}`}
                              onClick={(e) => handleOpenEdit(e, trip)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete trip permanently"
                              aria-label={`Delete ${trip.name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteTrip(trip.id);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls when multiple pages or 20+ cards exist */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Showing page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({filteredTrips.length} total trips)
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setCurrentPage(pg)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                            currentPage === pg
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Trip Modal */}
      {showEditModal && editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Edit Trip Details</h2>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTrip(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrip} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nepal Himalayan Expedition"
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu, Nepal"
                    value={editingTrip.destination}
                    onChange={(e) => {
                      selectedDestinationRef.current = null;
                      setEditingTrip({ ...editingTrip, destination: e.target.value, coverImage: null });
                      setDestinationSuggestions([]);
                    }}
                    className="w-full rounded-full border border-slate-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {(destinationSuggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      {isLoadingSuggestions && <div className="px-3 py-2 text-xs text-slate-500">Finding places...</div>}
                      {destinationSuggestions.map((place) => (
                        <button
                          key={`${place.lat}-${place.lon}`}
                          type="button"
                          onClick={() => selectDestination(place)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left first:bg-slate-100 hover:bg-slate-100"
                        >
                          {place.imageUrl ? (
                            <img
                              src={place.imageUrl}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                              <MapPin className="h-5 w-5" />
                            </div>
                          )}
                          <span className="min-w-0 leading-tight">
                            <span className="block truncate text-sm font-bold text-slate-900">
                              {place.display_name.split(',')[0]}
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {place.display_name.split(',').slice(1).join(',').trim() || 'Location'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editingTrip.startDate}
                    onChange={(e) => setEditingTrip({ ...editingTrip, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editingTrip.endDate}
                    onChange={(e) => setEditingTrip({ ...editingTrip, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={editingTrip.budget}
                    onChange={(e) => setEditingTrip({ ...editingTrip, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingTrip.status}
                    onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key goals or highlights..."
                  value={editingTrip.description}
                  onChange={(e) => setEditingTrip({ ...editingTrip, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTrip(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolvingImage}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manali, Himachal Pradesh, India"
                    value={newTrip.destination}
                    onChange={(e) => {
                      selectedDestinationRef.current = null;
                      setNewTrip({ ...newTrip, destination: e.target.value, coverImage: null });
                      setDestinationSuggestions([]);
                    }}
                    className="w-full rounded-full border border-slate-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {(destinationSuggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      {isLoadingSuggestions && <div className="px-3 py-2 text-xs text-slate-500">Finding places...</div>}
                      {destinationSuggestions.map((place) => (
                        <button
                          key={`${place.lat}-${place.lon}`}
                          type="button"
                          onClick={() => selectDestination(place)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left first:bg-slate-100 hover:bg-slate-100"
                        >
                          {place.imageUrl ? (
                            <img
                              src={place.imageUrl}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                              <MapPin className="h-5 w-5" />
                            </div>
                          )}
                          <span className="min-w-0 leading-tight">
                            <span className="block truncate text-sm font-bold text-slate-900">
                              {place.display_name.split(',')[0]}
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {place.display_name.split(',').slice(1).join(',').trim() || 'Location'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {newTrip.coverImage && <p className="mt-1 text-[11px] text-brand-700">A destination photo is ready for this trip.</p>}
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
                  disabled={isResolvingImage}
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60 text-white text-xs font-semibold shadow-md"
                >
                  {isResolvingImage ? 'Finding photo...' : 'Create Trip'}
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
