'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Share2,
  Link2,
  Check,
  Plane,
  Clock,
  Shield,
  Luggage,
  Calculator,
  LayoutGrid,
  List,
  Flame,
  Globe,
  Compass as CompassIcon,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

type PlaceSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  imageUrl?: string | null;
};

// Popular Trip Inspiration Templates
const INSPIRATION_TEMPLATES = [
  {
    id: 'tpl-nepal',
    title: 'Nepal Himalayan Expedition',
    destination: 'Kathmandu, Nepal',
    description: 'High-altitude mountain trekking, Annapurna viewpoints, and heritage temple exploration.',
    budget: 45000,
    currency: 'INR',
    days: 7,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    tag: '🏔️ Mountain Trek',
  },
  {
    id: 'tpl-goa',
    title: 'Goa Coastal Sunsets & Shacks',
    destination: 'Goa, India',
    description: 'Beach hopping in North & South Goa, sunset boat cruises, shacks, and water sports.',
    budget: 25000,
    currency: 'INR',
    days: 4,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    tag: '🏖️ Beach & Nightlife',
  },
  {
    id: 'tpl-manali',
    title: 'Manali & Rohtang Snow Tour',
    destination: 'Manali, Himachal Pradesh, India',
    description: 'Snow adventures at Solang Valley, Rohtang Pass, Old Manali cafes, and river rafting in Kullu.',
    budget: 30000,
    currency: 'INR',
    days: 5,
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    tag: '🌲 Snow & Valley',
  },
  {
    id: 'tpl-kyoto',
    title: 'Kyoto & Tokyo Cultural Express',
    destination: 'Kyoto, Japan',
    description: 'Historic shrine tours, bullet train transit, street food crawls, and modern city nightlife.',
    budget: 120000,
    currency: 'INR',
    days: 6,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    tag: '🏯 Culture & City',
  },
];

// Packing checklist items
const DEFAULT_PACKING_ITEMS = [
  { id: 'p1', cat: 'Documents', name: 'Government ID / Passport & Tickets', checked: true },
  { id: 'p2', cat: 'Documents', name: 'Hotel Bookings & Permits', checked: false },
  { id: 'p3', cat: 'Electronics', name: 'Power Bank (20,000 mAh) & Cables', checked: true },
  { id: 'p4', cat: 'Electronics', name: 'Camera & Memory Cards', checked: false },
  { id: 'p5', cat: 'Clothing', name: 'Layered Warm Wear / Rain Jacket', checked: false },
  { id: 'p6', cat: 'Clothing', name: 'Comfortable Trekking / Walking Shoes', checked: true },
  { id: 'p7', cat: 'Medical', name: 'First Aid Kit, Painkillers & Bandages', checked: true },
  { id: 'p8', cat: 'Medical', name: 'Motion Sickness & Altitude Meds', checked: false },
];

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
  const [sortBy, setSortBy] = useState<'nearest' | 'newest' | 'budget' | 'alpha'>('nearest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showSplitCalcModal, setShowSplitCalcModal] = useState(false);

  // Quick Calculator state
  const [calcBill, setCalcBill] = useState(4800);
  const [calcPeople, setCalcPeople] = useState(4);
  const [calcTipPercent, setCalcTipPercent] = useState(10);

  // Packing Checklist state
  const [packingList, setPackingList] = useState(DEFAULT_PACKING_ITEMS);

  // Join Link input state
  const [joinLinkInput, setJoinLinkInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  // Autocomplete destination state
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

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

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

  const fetchTrips = () => {
    if (isClerkLoaded && isSignedIn) {
      api.getTrips().then(setTrips).catch(() => setTrips([]));
    }
  };

  useEffect(() => {
    fetchTrips();
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

    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  };

  const handleApplyTemplate = (tpl: typeof INSPIRATION_TEMPLATES[0]) => {
    setNewTrip({
      name: tpl.title,
      destination: tpl.destination,
      startDate: '2026-11-15',
      endDate: '2026-11-22',
      budget: tpl.budget,
      currency: tpl.currency,
      description: tpl.description,
      coverImage: tpl.image,
    });
    setShowCreateModal(true);
  };

  const handleJoinViaLink = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = joinLinkInput.trim();
    if (!raw) return;

    let targetToken = raw;
    if (raw.includes('/invite/')) {
      const parts = raw.split('/invite/');
      targetToken = parts[parts.length - 1].split('?')[0];
    }

    if (!targetToken) {
      setJoinError('Invalid invitation link or token format.');
      return;
    }

    router.push(`/invite/${targetToken}`);
  };

  const handleShareTrip = async (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    try {
      const shareData = await api.getShareLink(trip.id);
      const link = shareData.inviteLink || `${window.location.origin}/invite/${shareData.token}`;
      await navigator.clipboard.writeText(link);
      setCopiedTripId(trip.id);
      setTimeout(() => setCopiedTripId(null), 2500);
    } catch {
      const fallbackLink = `${window.location.origin}/invite/join_${trip.id}`;
      await navigator.clipboard.writeText(fallbackLink);
      setCopiedTripId(trip.id);
      setTimeout(() => setCopiedTripId(null), 2500);
    }
  };

  // Filter & Search & Sort Logic
  const filteredAndSortedTrips = useMemo(() => {
    let result = trips.filter((t) => {
      const matchesFilter = filter === 'all' || (t.status && t.status.toLowerCase() === filter);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === 'nearest') {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === 'newest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'budget') {
        return (Number(b.budget) || 0) - (Number(a.budget) || 0);
      }
      if (sortBy === 'alpha') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [trips, filter, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedTrips.length / itemsPerPage) || 1;
  const paginatedTrips = filteredAndSortedTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // High-Level KPIs
  const totalBudgetManaged = useMemo(() => {
    return trips.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
  }, [trips]);

  const totalMembersConnected = useMemo(() => {
    return trips.reduce((sum, t) => sum + (Number(t.memberCount) || 1), 0);
  }, [trips]);

  // Nearest upcoming trip for spotlight banner
  const spotlightTrip = useMemo(() => {
    if (!trips.length) return null;
    const sortedByDate = [...trips].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      return dateA - dateB;
    });
    return sortedByDate[0];
  }, [trips]);

  const spotlightCountdown = useMemo(() => {
    if (!spotlightTrip?.startDate) return null;
    const diff = new Date(`${spotlightTrip.startDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / 86400000);
  }, [spotlightTrip]);

  const getTripDayCount = (trip: any) => {
    return trip.dayCount || trip.days?.length || 0;
  };

  if (!isClerkLoaded || !isSignedIn) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-6 animate-in fade-in duration-300">
        {/* Top Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-64 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Central Syncing Beacon */}
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-inner animate-spin">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800 tracking-tight">Checking your session...</p>
            <p className="text-xs text-slate-400 font-medium">Connecting to TripSync travel cloud</p>
          </div>
        </div>

        {/* KPI & Banner Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="h-3 w-20 bg-slate-100 rounded-md animate-pulse" />
              <div className="h-7 w-16 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-2.5 w-24 bg-slate-100 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* 1. TOP GREETING & QUICK ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
              ✈️ Travel Workspace
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mt-1">
            {greeting}, {user?.firstName || 'Traveler'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your collaborative itineraries, split budgets, and stay synced with your crew.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
          >
            <Link2 className="h-4 w-4 text-brand-600" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={() => setShowPackingModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
          >
            <Luggage className="h-4 w-4 text-ocean-600" />
            <span>Packing List</span>
          </button>

          <button
            onClick={() => setShowSplitCalcModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
          >
            <Calculator className="h-4 w-4 text-emerald-600" />
            <span>Split Calculator</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 text-brand-400" />
            <span>Plan New Trip</span>
          </button>
        </div>
      </div>

      {/* 2. TRAVEL PULSE KPI STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expeditions</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <CompassIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{trips.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{trips.filter((t) => t.status === 'ACTIVE').length} currently active</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Travel Network</span>
            <div className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalMembersConnected}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Travelers across trips</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Managed Budget</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(totalBudgetManaged, 'INR')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total pooled estimate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Next Departure</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {spotlightCountdown !== null ? (spotlightCountdown > 0 ? `${spotlightCountdown}d` : 'Today') : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {spotlightTrip ? spotlightTrip.name : 'No trips planned'}
          </p>
        </div>
      </div>

      {/* 3. SPOTLIGHT HERO BANNER (When trips exist) */}
      {spotlightTrip && (() => {
        const spotlightRole = spotlightTrip?.role || (spotlightTrip?.isOwner ? 'OWNER' : 'VIEWER');
        const isSpotlightManager = spotlightRole === 'OWNER' || spotlightRole === 'ADMIN';

        return (
          <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-950 text-white border border-slate-800">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
              <Image
                src={spotlightTrip.coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80'}
                alt={spotlightTrip.name}
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

            <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 text-brand-400" />
                    <span>Featured Expedition</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-xs font-medium backdrop-blur-md">
                    {spotlightCountdown !== null && spotlightCountdown > 0 ? `🗓️ ${spotlightCountdown} Days to Departure` : '🚀 On Schedule'}
                  </span>
                  {/* Role Indicator Chip */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-md border ${
                      spotlightRole === 'OWNER'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : spotlightRole === 'ADMIN'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : spotlightRole === 'MEMBER'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    {spotlightRole === 'OWNER'
                      ? '👑 Trip Creator & Owner'
                      : spotlightRole === 'ADMIN'
                      ? '🛡️ Co-Organizer & Admin'
                      : spotlightRole === 'MEMBER'
                      ? '🎒 Active Traveler'
                      : '👁️ Guest (View Only)'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-3">
                  {spotlightTrip.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>{spotlightTrip.destination}</span>
                  <span>•</span>
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatDate(spotlightTrip.startDate)} - {formatDate(spotlightTrip.endDate)}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Users className="w-3.5 h-3.5 text-brand-300" />
                    <span>{spotlightTrip.memberCount || 1} Travelers</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Budget: {formatCurrency(spotlightTrip.budget || 0, spotlightTrip.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {isSpotlightManager && (
                  <button
                    onClick={(e) => handleOpenEdit(e, spotlightTrip)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 inline mr-1.5" />
                    Edit Details
                  </button>
                )}
                <Link
                  href={`/trips/${spotlightTrip.id}`}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                  <span>{spotlightRole === 'VIEWER' ? 'Explore View Workspace' : 'Open Trip Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. MAIN TRIP EXPLORER SECTION */}
      <div className="space-y-4">
        {/* Controls Bar: Search, Filters, Sort, View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['all', 'planning', 'active', 'completed'] as const).map((tab) => {
              const count = tab === 'all'
                ? trips.length
                : trips.filter((t) => t.status && t.status.toLowerCase() === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setFilter(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    filter === tab
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Sort, and View mode */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search your trips..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="nearest">Nearest Departure</option>
              <option value="newest">Recently Added</option>
              <option value="budget">Highest Budget</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trips Output */}
        {filteredAndSortedTrips.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <CompassIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No expeditions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery ? `No results match "${searchQuery}". Try a different keyword.` : 'You have no planned trips in this status tab.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
                >
                  Create New Trip
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View (4 columns responsive) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedTrips.map((trip) => {
              const role = trip.role || (trip.isOwner ? 'OWNER' : 'VIEWER');
              const isOwner = role === 'OWNER' || trip.isOwner;
              const isAdmin = role === 'ADMIN';
              const isMember = role === 'MEMBER';
              const isViewer = role === 'VIEWER';
              const isManager = isOwner || isAdmin;

              return (
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
                  {/* Header Image */}
                  <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                    <Image
                      src={trip.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                      alt={trip.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Top Role Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${
                          isOwner
                            ? 'bg-amber-400 text-amber-950 border border-amber-300'
                            : isAdmin
                            ? 'bg-blue-600 text-white'
                            : isMember
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-600'
                        }`}
                      >
                        {isOwner ? '👑 Owner' : isAdmin ? '🛡️ Admin' : isMember ? '🎒 Member' : '👁️ Viewer'}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between text-white">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold truncate max-w-[65%]">
                        <MapPin className="w-3 h-3 text-brand-300 shrink-0" />
                        <span className="truncate">{trip.destination?.split(',')[0]}</span>
                      </span>
                      <span className="inline-flex items-center rounded-md bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                        {trip.status || 'PLANNING'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors" title={trip.name}>
                        {trip.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                        {trip.description || 'Collaborative itinerary and budget workspace.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(trip.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trip.memberCount || 1} Members</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Budget</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {formatCurrency(trip.budget || 0, trip.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {!isViewer ? (
                          <>
                            <button
                              type="button"
                              title="Share invite link"
                              onClick={(e) => handleShareTrip(e, trip)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                              {copiedTripId === trip.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                            </button>
                            {isManager && (
                              <button
                                type="button"
                                title="Edit trip details"
                                aria-label={`Edit ${trip.name}`}
                                onClick={(e) => handleOpenEdit(e, trip)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isOwner && (
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
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            👁️ View Only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {paginatedTrips.map((trip) => {
              const role = trip.role || (trip.isOwner ? 'OWNER' : 'VIEWER');
              const isOwner = role === 'OWNER' || trip.isOwner;
              const isAdmin = role === 'ADMIN';
              const isMember = role === 'MEMBER';
              const isViewer = role === 'VIEWER';
              const isManager = isOwner || isAdmin;

              return (
                <div
                  key={trip.id}
                  onClick={() => { window.location.href = `/trips/${trip.id}`; }}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <Image
                        src={trip.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'}
                        alt={trip.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{trip.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                            isOwner
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : isAdmin
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : isMember
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isOwner ? '👑 Owner' : isAdmin ? '🛡️ Admin' : isMember ? '🎒 Member' : '👁️ Viewer'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          {trip.status || 'PLANNING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{trip.destination}</span>
                        <span>•</span>
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Est. Budget</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {formatCurrency(trip.budget || 0, trip.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isViewer ? (
                        <>
                          <button
                            type="button"
                            title="Share invite link"
                            onClick={(e) => handleShareTrip(e, trip)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            {copiedTripId === trip.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
                          </button>
                          {isManager && (
                            <button
                              type="button"
                              title="Edit trip details"
                              onClick={(e) => handleOpenEdit(e, trip)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {isOwner && (
                            <button
                              type="button"
                              title="Delete trip permanently"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrip(trip.id);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                          👁️ View Only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar for 20+ cards */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500">
              Showing page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({filteredAndSortedTrips.length} total trips)
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
      </div>

      {/* 5. INSPIRATION & QUICK-START TRIP TEMPLATES */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
              <Globe className="w-3 h-3" />
              <span>Explore Group Destinations</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2">Adventure Inspiration Templates</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch a curated group expedition in 1-click with pre-built budgets and itineraries.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {INSPIRATION_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="group bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/80 p-3.5 flex flex-col justify-between transition-all hover:border-brand-500/50"
            >
              <div>
                <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                  <Image
                    src={tpl.image}
                    alt={tpl.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 250px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white z-10">
                    {tpl.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Est. Budget</span>
                  <span className="text-xs font-bold text-brand-400">{formatCurrency(tpl.budget, tpl.currency)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. JOIN VIA CODE / LINK MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Join a Trip</h3>
              </div>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinViaLink} className="overflow-y-auto flex-1 mt-4 space-y-3 pr-1">
              <p className="text-xs text-slate-500">
                Paste an invitation link or token from a trip organizer:
              </p>
              <input
                type="text"
                required
                placeholder="e.g. http://localhost:3000/invite/join_..."
                value={joinLinkInput}
                onChange={(e) => {
                  setJoinLinkInput(e.target.value);
                  setJoinError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {joinError && <p className="text-xs text-red-600 font-medium">{joinError}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Join Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PACKING CHECKLIST MODAL */}
      {showPackingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center shadow-xs">
                  <Luggage className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Trip Packing Checklist</h3>
                  <p className="text-[11px] text-slate-500">Essential travel gear & documents</p>
                </div>
              </div>
              <button onClick={() => setShowPackingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-2.5 pr-1">
              {packingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setPackingList((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
                    );
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                    item.checked ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      readOnly
                      className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 pointer-events-none"
                    />
                    <div>
                      <p className={`text-xs font-bold ${item.checked ? 'line-through opacity-75' : ''}`}>
                        {item.name}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        {item.cat}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowPackingModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SPLIT CALCULATOR MODAL */}
      {showSplitCalcModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Quick Bill Splitter</h3>
              </div>
              <button onClick={() => setShowSplitCalcModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-3 text-xs pr-1">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Total Bill Amount (₹)</label>
                <input
                  type="number"
                  value={calcBill}
                  onChange={(e) => setCalcBill(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">People</label>
                  <input
                    type="number"
                    min={1}
                    value={calcPeople}
                    onChange={(e) => setCalcPeople(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tip (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={calcTipPercent}
                    onChange={(e) => setCalcTipPercent(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Result Box */}
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Each Person Pays</span>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  ₹{Math.round(((calcBill + (calcBill * calcTipPercent) / 100) / Math.max(1, calcPeople)) * 100) / 100}
                </p>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">
                  Total with tip: ₹{Math.round((calcBill + (calcBill * calcTipPercent) / 100) * 100) / 100}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowSplitCalcModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT TRIP MODAL */}
      {showEditModal && editingTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrip} className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nepal Himalayan Expedition"
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {(destinationSuggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
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
                              className="h-12 w-12 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                              <MapPin className="h-5 w-5" />
                            </div>
                          )}
                          <span className="min-w-0 leading-tight">
                            <span className="block truncate text-sm font-bold text-slate-900">
                              {place.display_name.split(',')[0]}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
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

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTrip(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolvingImage}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE TRIP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-slate-900">Plan a New Group Trip</h2>
                  <p className="text-[11px] text-slate-500">Collaborate with your travel crew</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manali Snow Expedition"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
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
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {(destinationSuggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
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
                              className="h-12 w-12 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                              <MapPin className="h-5 w-5" />
                            </div>
                          )}
                          <span className="min-w-0 leading-tight">
                            <span className="block truncate text-sm font-bold text-slate-900">
                              {place.display_name.split(',')[0]}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newTrip.endDate}
                    onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={newTrip.currency}
                    onChange={(e) => setNewTrip({ ...newTrip, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolvingImage}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
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

