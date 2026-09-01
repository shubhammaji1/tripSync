'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Wallet,
  CheckSquare,
  ShieldAlert,
  Users,
  PieChart as PieChartIcon,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  Phone,
  PhoneCall,
  Navigation,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Building,
  Split,
  ChevronRight,
  Sparkles,
  ExternalLink,
  DollarSign,
  Shield,
  Lock,
  Trash2,
  Edit,
  UserCheck,
  Eye,
  Info,
  Share2,
  Link2,
  UserPlus,
  Mail,
  RefreshCw,
  X,
  Printer,
  Star,
  HeartPulse,
  Download,
  Pencil,
  Activity,
  Flame,
  Smartphone,
  Route,
  Layers,
  FileCheck,
  Sun,
  CloudSun,
  Receipt,
  Camera,
  UploadCloud,
  ImageIcon,
  MessageSquare,
  Bell,
  Loader2,
  Save,
  Tag,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { canForRole } from '@/lib/auth-context';
import { TripRole } from '@tripsync/types';
import { UPISettlementModal } from '@/components/UPISettlementModal';
import { ItineraryRouteMap } from '@/components/ItineraryRouteMap';
import { DestinationWeatherWidget } from '@/components/DestinationWeatherWidget';
import { DocumentVaultSection } from '@/components/DocumentVaultSection';
import { ReceiptPreviewModal } from '@/components/ReceiptPreviewModal';
import { CrewChatDrawer } from '@/components/CrewChatDrawer';
import { LiveActivityFeedDrawer, emitTripActivity } from '@/components/LiveActivityFeedDrawer';
import { haptic } from '@/lib/haptics';
import { SUPPORTED_CURRENCIES, convertCurrency, formatCurrencyWithSymbol } from '@/lib/currencies';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type ActiveTab = 'overview' | 'itinerary' | 'expenses' | 'tasks' | 'documents' | 'emergency' | 'analytics' | 'members';

interface MemberState {
  id: string;
  name: string;
  role: TripRole;
  phone: string;
}

interface TripDayState {
  id?: string;
  num: number;
  date: string;
  label: string;
}

function TripWorkspaceContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const isDemoSession = false;
  const [tripDetails, setTripDetails] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Members list with dynamic roles
  const [members, setMembers] = useState<MemberState[]>([]);

  // Role is derived from this trip's persisted member list and trip creator ownership.
  const isTripOwner = Boolean(
    (user?.id && tripDetails?.ownerId && user.id === tripDetails.ownerId) ||
    (user?.email && tripDetails?.owner?.email && user.email === tripDetails.owner.email) ||
    (user?.id && tripDetails?.owner?.id && user.id === tripDetails.owner.id)
  );
  const myMembership = members.find((m) => m.id === user?.id);
  const currentRole: TripRole = isTripOwner
    ? TripRole.OWNER
    : (myMembership?.role ?? (tripDetails?.ownerId === user?.id ? TripRole.OWNER : TripRole.VIEWER));
  const can = (permission: Parameters<typeof canForRole>[1]) => canForRole(currentRole, permission);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TripRole>(TripRole.MEMBER);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  // Dynamic role drafting & saving states
  const [draftRoles, setDraftRoles] = useState<Record<string, TripRole>>({});
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savedRoleId, setSavedRoleId] = useState<string | null>(null);

  // Universal Shareable Group Invite Link & Bulk Invite state
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [shareableRole, setShareableRole] = useState<TripRole>(TripRole.MEMBER);
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [bulkInviteMode, setBulkInviteMode] = useState<'single' | 'bulk'>('single');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkRole, setBulkRole] = useState<TripRole>(TripRole.MEMBER);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [recentInvites, setRecentInvites] = useState<{ email: string; link: string; emailSent?: boolean }[]>([]);

  const [emergencyContacts, setEmergencyContacts] = useState<{
    id: string;
    tripId?: string;
    name: string;
    relationship: string;
    phone: string;
    altPhone?: string | null;
    notes?: string | null;
    isPrimary?: boolean;
    createdAt?: string;
  }[]>([]);
  const [isLoadingEmergency, setIsLoadingEmergency] = useState(false);
  const [showAddEmergencyModal, setShowAddEmergencyModal] = useState(false);
  const [showEditEmergencyModal, setShowEditEmergencyModal] = useState(false);
  const [editingEmergencyContact, setEditingEmergencyContact] = useState<any>(null);
  const [emergencyFilter, setEmergencyFilter] = useState<string>('ALL');
  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    relationship: 'Primary Hospital & 24x7 Ambulance',
    phone: '',
    altPhone: '',
    notes: '',
    isPrimary: false,
  });

  // Traveler Phone Edit Modal state
  const [showEditMemberPhoneModal, setShowEditMemberPhoneModal] = useState(false);
  const [editingMemberForPhone, setEditingMemberForPhone] = useState<any>(null);
  const [memberPhoneInput, setMemberPhoneInput] = useState('');

  // Edit Trip Modal state
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [editTripForm, setEditTripForm] = useState({
    name: '',
    destination: '',
    budget: 0,
    currency: 'INR',
    startDate: '',
    endDate: '',
    description: '',
    status: 'PLANNING',
  });

  useEffect(() => {
    api.getMe().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    api.getTripById(params.id).then((trip) => {
      setTripDetails(trip);
      const mapMember = (member: any) => {
        const memberId = member.userId || member.user?.id || member.id;
        const isThisOwner = memberId === trip.ownerId || (trip.owner?.email && member.user?.email === trip.owner.email) || member.role === TripRole.OWNER;
        return {
          id: memberId,
          name: member.user?.fullName || member.user?.email || member.name || 'Trip Member',
          role: isThisOwner ? TripRole.OWNER : (member.role || TripRole.MEMBER),
          phone: member.user?.phone || member.phone || '',
        };
      };
      const apiMembers = (trip.members || []).map(mapMember);
      if (apiMembers.length) {
        setMembers(apiMembers);
      } else {
        api.getMembers(params.id).then((tripMembers) => {
          const fetchedMembers = tripMembers.map(mapMember);
          if (fetchedMembers.length) {
            setMembers(fetchedMembers);
          }
        }).catch(() => {});
      }

      const apiDays = (trip.days || []).map((day: any) => ({
        id: day.id,
        num: day.dayNumber,
        date: day.date,
        label: day.title || `Day ${day.dayNumber}`,
      }));
      setTripDays(apiDays);

      setActivitiesList((trip.days || []).flatMap((day: any) =>
        (day.activities || []).map((activity: any) => ({
          id: activity.id,
          dayNumber: day.dayNumber,
          time: [activity.startTime, activity.endTime].filter(Boolean).join(' - '),
          title: activity.title,
          description: activity.description || '',
          location: activity.locationName || '',
          responsible: activity.responsibleMember?.fullName || 'Unassigned',
          cost: Number(activity.estimatedCost || 0),
          status: activity.status || 'PLANNED',
        }))
      ));

      setExpensesList((trip.expenses || []).map((expense: any) => ({
        id: expense.id,
        title: expense.title,
        paidById: expense.paidById,
        paidBy: expense.paidBy?.fullName || expense.paidBy?.email || 'Unknown',
        amount: Number(expense.amount || 0),
        category: expense.category,
        date: expense.date,
        participants: expense.participants || [],
        split: `${expense.participants?.length || 0} members`,
      })));

      setTasks((trip.tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        assignedTo: task.assignedTo?.fullName || task.assignedTo?.email || 'Unassigned',
        dueDate: task.dueDate || '',
        priority: task.priority,
        status: task.status,
      })));
      if (trip.emergencyContacts && trip.emergencyContacts.length > 0) {
        setEmergencyContacts(trip.emergencyContacts);
      } else {
        api.getEmergencyContacts(params.id).then((contacts) => {
          if (contacts && contacts.length > 0) {
            setEmergencyContacts(contacts);
          }
        }).catch(() => {});
      }
    }).catch((reason: any) => setActionAlert(reason.message || 'Trip data could not be loaded.'));
  }, [params.id]);

  // Itinerary state
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [tripDays, setTripDays] = useState<TripDayState[]>([]);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayLabel, setNewDayLabel] = useState('');
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);
  const [activitiesList, setActivitiesList] = useState([
    {
      id: 'act-1',
      dayNumber: 1,
      time: '14:00 - 15:30',
      title: 'Check-in at Summit Hermon Hotel',
      description: 'Drop bags, freshen up, and meet in the lobby for evening tea.',
      location: 'Summit Hermon Hotel',
      responsible: 'Shubham Verma',
      cost: 6000,
      status: 'COMPLETED',
    },
    {
      id: 'act-2',
      dayNumber: 1,
      time: '16:30 - 19:30',
      title: 'Mall Road & Chowrasta Evening Walk',
      description: 'Explore local tea lounges, woollen handicraft shops, and hot momo stalls.',
      location: 'Chowrasta Mall Road',
      responsible: 'Priya Patel',
      cost: 1500,
      status: 'PLANNED',
    },
    {
      id: 'act-3',
      dayNumber: 2,
      time: '04:30 - 07:30',
      title: 'Tiger Hill Early Morning Sunrise',
      description: 'Wakeup call at 3:30 AM. Witness Kanchenjunga peak illuminated in sunrise colors.',
      location: 'Tiger Hill Observatory',
      responsible: 'Rahul Sharma',
      cost: 2400,
      status: 'EARLY SUNRISE',
    },
    {
      id: 'act-4',
      dayNumber: 2,
      time: '10:30 - 13:00',
      title: 'Happy Valley Tea Estate Guided Tour',
      description: 'Historical tea factory processing walkthrough followed by tea tasting session.',
      location: 'Happy Valley Tea Estate',
      responsible: 'Amit Kumar',
      cost: 1200,
      status: 'PLANNED',
    },
    {
      id: 'act-5',
      dayNumber: 3,
      time: '10:00 - 13:00',
      title: 'Ghoom Monastery & Heritage Toy Train Ride',
      description: 'Steam joyride loop through Batasia war memorial and Ghum altitude summit.',
      location: 'Ghoom Railway Station',
      responsible: 'Rahul Sharma',
      cost: 3600,
      status: 'PLANNED',
    },
  ]);

  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    startTime: '10:00',
    endTime: '12:00',
    locationName: '',
    estimatedCost: 1000,
    responsibleMemberId: '',
  });

  // Real-time Activity Location Geocoding Autocomplete State
  const [activityLocationSuggestions, setActivityLocationSuggestions] = useState<any[]>([]);
  const [isLoadingActivityLocations, setIsLoadingActivityLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const selectedActivityLocationRef = React.useRef<string>('');

  useEffect(() => {
    const query = newActivity.locationName?.trim();
    if (!query || query === selectedActivityLocationRef.current) {
      setActivityLocationSuggestions([]);
      setIsLoadingActivityLocations(false);
      return;
    }
    if (query.length < 2) {
      setActivityLocationSuggestions([]);
      setIsLoadingActivityLocations(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingActivityLocations(true);
      try {
        const dest = tripDetails?.destination || '';
        const searchQuery = dest && !query.toLowerCase().includes(dest.toLowerCase())
          ? `${query}, ${dest}`
          : query;

        const params = new URLSearchParams({
          q: searchQuery,
          format: 'jsonv2',
          addressdetails: '1',
          limit: '6',
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        });

        if (response.ok) {
          let places: any[] = await response.json();
          if (places.length === 0 && searchQuery !== query) {
            const rawParams = new URLSearchParams({
              q: query,
              format: 'jsonv2',
              addressdetails: '1',
              limit: '6',
            });
            const rawRes = await fetch(`https://nominatim.openstreetmap.org/search?${rawParams}`, {
              signal: controller.signal,
              headers: { 'Accept-Language': 'en' },
            });
            if (rawRes.ok) places = await rawRes.json();
          }
          if (!controller.signal.aborted) {
            setActivityLocationSuggestions(places);
            setShowLocationSuggestions(true);
          }
        }
      } catch {
        if (!controller.signal.aborted) setActivityLocationSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoadingActivityLocations(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [newActivity.locationName, tripDetails?.destination]);

  const selectActivityLocation = (place: any) => {
    haptic.light();
    const primaryName = place.name || place.display_name.split(',')[0].trim();
    const formattedLocation = place.display_name;
    selectedActivityLocationRef.current = formattedLocation;

    setNewActivity((curr) => ({
      ...curr,
      locationName: formattedLocation,
      title: curr.title?.trim() ? curr.title : primaryName,
    }));
    setShowLocationSuggestions(false);
    setActivityLocationSuggestions([]);
  };

  // Expense & Split state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expensesList, setExpensesList] = useState<any[]>([
    {
      id: 'exp-1',
      title: 'Summit Hermon Hotel Advance Booking',
      paidBy: 'Rahul Sharma',
      amount: 6000,
      category: 'ACCOMMODATION',
      date: '2026-09-10',
      split: '6 members (₹1,000 each)',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'exp-2',
      title: 'Toyota Innova Sightseeing Cab',
      paidBy: 'Shubham Verma',
      amount: 2400,
      category: 'TRANSPORT',
      date: '2026-09-11',
      split: '6 members (₹400 each)',
    },
    {
      id: 'exp-3',
      title: 'Glenary’s Bakery & Restaurant Group Dinner',
      paidBy: 'Priya Patel',
      amount: 3200,
      category: 'FOOD',
      date: '2026-09-11',
      split: '6 members (₹533 each)',
      receiptUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    },
  ]);

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 1800,
    currency: 'INR',
    category: 'FOOD',
    date: '',
    paidById: '',
    splitType: 'EQUAL',
    receiptUrl: '',
  });

  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState<any | null>(null);

  const formatExpenseAmount = (amount: number) => new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

  // Settled debts & UPI state
  const [settledDebtIds, setSettledDebtIds] = useState<Record<string, boolean>>({});
  const [selectedUpiDebt, setSelectedUpiDebt] = useState<any | null>(null);

  // Itinerary View Mode (Timeline vs Map)
  const [itineraryViewMode, setItineraryViewMode] = useState<'timeline' | 'map'>('timeline');

  // Real-Time Crew Chat Drawer State
  const [showCrewChat, setShowCrewChat] = useState(false);

  // Real-Time Live Activity Feed Drawer State
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  // Tasks local state
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'MEDIUM', assignedToId: '' });
  const [tasks, setTasks] = useState([
    {
      id: 't-1',
      title: 'Confirm Toyota Innova cab pickup at Bagdogra Airport',
      assignedTo: 'Rahul Sharma',
      dueDate: '2026-09-09',
      priority: 'HIGH',
      status: 'DONE',
    },
    {
      id: 't-2',
      title: 'Book Himalayan Mountaineering Institute museum tickets',
      assignedTo: 'Shubham Verma',
      dueDate: '2026-09-10',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
    {
      id: 't-3',
      title: 'Assemble First Aid & Mountain Motion Sickness Kit',
      assignedTo: 'Priya Patel',
      dueDate: '2026-09-08',
      priority: 'HIGH',
      status: 'DONE',
    },
    {
      id: 't-4',
      title: 'Download offline Google Maps & emergency contact list',
      assignedTo: 'Amit Kumar',
      dueDate: '2026-09-09',
      priority: 'URGENT',
      status: 'TODO',
    },
  ]);

  // Sync tab from query param (e.g. ?tab=emergency)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ActiveTab;
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    haptic.medium();
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const showPermissionWarning = (actionName: string) => {
    haptic.warning();
    setActionAlert(`Action Locked: Your current role (${currentRole}) does not have permission to ${actionName}. Switch to OWNER or ADMIN above to unlock.`);
    setTimeout(() => setActionAlert(null), 5000);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('ADD_ACTIVITY')) {
      showPermissionWarning('add activities');
      setShowAddActivityModal(false);
      return;
    }

    const selectedDayDetails = tripDays.find((day) => day.num === selectedDay);
    const responsiblePerson = members.find((m) => m.id === newActivity.responsibleMemberId)?.name || user?.fullName || 'Traveler';
    const newAct = {
      id: 'act-' + Date.now(),
      dayNumber: selectedDay,
      time: `${newActivity.startTime} - ${newActivity.endTime}`,
      title: newActivity.title || 'New Activity',
      description: newActivity.description || 'Added by ' + (user?.fullName || 'Member'),
      location: newActivity.locationName || 'Darjeeling',
      responsible: responsiblePerson,
      cost: Number(newActivity.estimatedCost || 0),
      status: 'PLANNED',
    };

    try {
      if (!selectedDayDetails?.id) throw new Error('Select a saved itinerary day first.');
      const saved = await api.createActivity(params.id, {
        dayId: selectedDayDetails.id,
        title: newAct.title,
        description: newAct.description,
        startTime: newActivity.startTime,
        endTime: newActivity.endTime,
        locationName: newAct.location,
        estimatedCost: newAct.cost,
        currency: tripCurrency,
        responsibleMemberId: /^[0-9a-f-]{36}$/i.test(newActivity.responsibleMemberId) ? newActivity.responsibleMemberId : null,
        status: 'PLANNED',
        sortOrder: activitiesList.length,
      });
      setActivitiesList((current) => [...current, { ...newAct, id: saved.id || newAct.id }]);
      haptic.success();
      emitTripActivity(params.id, {
        type: 'SCHEDULE_CHANGE',
        title: 'Schedule Updated',
        description: `Added "${newAct.title}" to Day ${selectedDay}${newActivity.startTime ? ` (${newActivity.startTime})` : ''}`,
        actorName: user?.fullName || user?.name || 'Organizer',
      });
    } catch (reason: any) {
      haptic.error();
      setActionAlert(reason.message || 'Activity could not be saved.');
      return;
    }
    setShowAddActivityModal(false);
    setNewActivity({
      title: '',
      description: '',
      startTime: '10:00',
      endTime: '12:00',
      locationName: '',
      estimatedCost: 1000,
      responsibleMemberId: '',
    });
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setActionAlert('Receipt file exceeds 5MB maximum size limit.');
        e.target.value = '';
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.type) && !/\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name)) {
        setActionAlert('Invalid receipt file type. Only JPG, PNG, WEBP, and PDF are allowed.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewExpense((prev) => ({ ...prev, receiptUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('ADD_EXPENSE')) {
      showPermissionWarning('add expenses');
      setShowAddExpenseModal(false);
      return;
    }

    const payerId = members.some((member) => member.id === newExpense.paidById)
      ? newExpense.paidById
      : user?.id || newExpense.paidById;
    const payer = members.find((p) => p.id === payerId)?.name || user?.fullName || 'Traveler';
    const rawAmount = Number(newExpense.amount) || 0;
    const expenseCurrency = newExpense.currency || 'INR';

    // Auto-convert to INR base currency if logged in foreign currency
    const baseAmount = expenseCurrency !== 'INR'
      ? convertCurrency(rawAmount, expenseCurrency, 'INR')
      : rawAmount;

    const newEntry = {
      id: 'exp-' + Date.now(),
      paidById: payerId,
      title: newExpense.title || 'Group Expense',
      paidBy: payer,
      amount: baseAmount,
      originalAmount: expenseCurrency !== 'INR' ? rawAmount : undefined,
      originalCurrency: expenseCurrency !== 'INR' ? expenseCurrency : undefined,
      category: newExpense.category,
      receiptUrl: newExpense.receiptUrl || undefined,
      date: newExpense.date || tripDetails?.startDate || new Date().toISOString().slice(0, 10),
      participants: members.map((member) => ({
        userId: member.id,
        shareAmount: baseAmount / Math.max(1, members.length),
      })),
      split: `${members.length} members (₹${formatExpenseAmount(baseAmount / Math.max(1, members.length))} each)`,
    };

    if (editingExpenseId) {
      const updatedEntry = { ...newEntry, id: editingExpenseId };
      try {
        await api.updateExpense(params.id, editingExpenseId, {
          title: newEntry.title,
          amount: baseAmount,
          category: newEntry.category,
          currency: tripCurrency,
          splitType: newExpense.splitType,
          date: newEntry.date,
          participants: newEntry.participants,
        });
        haptic.success();
      } catch (reason: any) {
        haptic.error();
        setActionAlert(reason.message || 'Expense could not be updated.');
        return;
      }
      setExpensesList((current) => current.map((expense) => expense.id === editingExpenseId ? updatedEntry : expense));
      setEditingExpenseId(null);
      setShowAddExpenseModal(false);
      return;
    }

    try {
      const validMembers = members.filter((member) => /^[0-9a-f-]{36}$/i.test(member.id));
      const saved = await api.createExpense(params.id, {
        title: newEntry.title,
        amount: baseAmount,
        currency: tripCurrency,
        category: newExpense.category,
        splitType: newExpense.splitType,
        date: newEntry.date,
        participants: validMembers.map((member) => ({
          userId: member.id,
          shareAmount: Math.round((baseAmount / validMembers.length) * 100) / 100,
        })),
      });
      setExpensesList((current) => [{ ...newEntry, id: saved.id || newEntry.id }, ...current]);
      haptic.success();
      emitTripActivity(params.id, {
        type: 'NEW_EXPENSE',
        title: 'New Group Bill Logged',
        description: `₹${baseAmount.toLocaleString('en-IN')} for "${newEntry.title}" (Paid by ${payer})`,
        actorName: user?.fullName || user?.name || payer,
      });
    } catch (reason: any) {
      haptic.error();
      setActionAlert(reason.message || 'Expense could not be saved.');
      return;
    }
    setShowAddExpenseModal(false);
    setNewExpense({
      title: '',
      amount: 1800,
      currency: 'INR',
      category: 'FOOD',
      date: '',
      paidById: user?.id || members[0]?.id || '',
      splitType: 'EQUAL',
      receiptUrl: '',
    });
  };

  const handleEditExpense = (expense: any) => {
    haptic.light();
    setEditingExpenseId(expense.id);
    setNewExpense({
      title: expense.title || '',
      amount: Number(expense.originalAmount || expense.amount || 0),
      currency: expense.originalCurrency || 'INR',
      category: expense.category || 'FOOD',
      date: expense.date || '',
      paidById: expense.paidById || members.find((member) => member.name === expense.paidBy)?.id || user?.id || '',
      splitType: expense.splitType || 'EQUAL',
      receiptUrl: expense.receiptUrl || '',
    });
    setShowAddExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Delete this expense?')) return;
    haptic.warning();
    try {
      if (/^[0-9a-f-]{36}$/i.test(expenseId)) await api.deleteExpense(params.id, expenseId);
    } catch (reason: any) {
      haptic.error();
      setActionAlert(reason.message || 'Expense could not be deleted.');
      return;
    }
    setExpensesList((current) => current.filter((expense) => expense.id !== expenseId));
  };

  const toggleTaskStatus = async (taskId: string) => {
    if (!can('MANAGE_TASKS')) {
      showPermissionWarning('update task statuses');
      return;
    }

    const nextTasks = tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'DONE' ? 'TODO' : t.status === 'TODO' ? 'IN_PROGRESS' : 'DONE';
          return { ...t, status: nextStatus };
        }
        return t;
      });
    setTasks(nextTasks);
    const task = nextTasks.find((item) => item.id === taskId);
    if (task && /^[0-9a-f-]{36}$/i.test(taskId)) {
      try {
        await api.updateTask(params.id, taskId, { status: task.status as any });
        if (task.status === 'DONE') haptic.success();
        else haptic.light();
      } catch (reason: any) {
        setTasks(tasks);
        haptic.error();
        setActionAlert(reason.message || 'Task could not be updated.');
      }
    }
  };

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can('MANAGE_TASKS') || !newTask.title.trim()) return;

    const assignedMember = members.find((member) => member.id === newTask.assignedToId);
    const localTask = {
      id: `task-${Date.now()}`,
      title: newTask.title.trim(),
      assignedTo: assignedMember?.name || 'Unassigned',
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      status: 'TODO',
    };
    try {
      const saved = await api.createTask(params.id, {
        title: localTask.title,
        dueDate: localTask.dueDate || null,
        priority: localTask.priority,
        status: 'TODO',
        assignedToId: /^[0-9a-f-]{36}$/i.test(newTask.assignedToId) ? newTask.assignedToId : null,
      });
      setTasks((current) => [{ ...localTask, id: saved.id || localTask.id }, ...current]);
      haptic.light();
    } catch (reason: any) {
      haptic.error();
      setActionAlert(reason.message || 'Task could not be saved.');
      return;
    }
    setNewTask({ title: '', dueDate: '', priority: 'MEDIUM', assignedToId: '' });
  };

  const handleMemberRoleChange = async (memberId: string, customRole?: TripRole) => {
    if (!can('MANAGE_ROLES')) {
      showPermissionWarning('change member roles');
      return;
    }

    const targetMember = members.find((m) => m.id === memberId);
    const newRole = customRole || draftRoles[memberId] || targetMember?.role || TripRole.MEMBER;

    // Admins cannot change Owner's role
    if (targetMember?.role === TripRole.OWNER && currentRole !== TripRole.OWNER) {
      setActionAlert('Security Violation: Only the Trip Owner can modify ownership privileges.');
      setTimeout(() => setActionAlert(null), 4000);
      return;
    }

    setSavingRoleId(memberId);
    try {
      await api.updateMemberRole(params.id, memberId, { role: newRole });
      setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role: newRole } : member));
      setDraftRoles((prev) => ({ ...prev, [memberId]: newRole }));
      setSavedRoleId(memberId);
      haptic.success();
      setActionAlert(`✅ Saved: Updated ${targetMember?.name || 'Member'}'s role to ${newRole}.`);
      setTimeout(() => {
        setSavedRoleId(null);
        setActionAlert(null);
      }, 3000);
    } catch (reason: any) {
      haptic.error();
      setActionAlert(reason.message || 'Member role could not be updated.');
      setTimeout(() => setActionAlert(null), 4000);
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!can('INVITE_MEMBERS')) {
      showPermissionWarning('remove trip members');
      return;
    }

    const targetMember = members.find((m) => m.id === memberId);
    if (targetMember?.role === TripRole.OWNER) {
      setActionAlert('Cannot remove the Trip Owner.');
      setTimeout(() => setActionAlert(null), 3000);
      return;
    }

    try {
      await api.removeMember(params.id, memberId);
      setMembers((current) => current.filter((member) => member.id !== memberId));
    } catch (reason: any) {
      setActionAlert(reason.message || 'Member could not be removed.');
      return;
    }
    setActionAlert(`Removed ${targetMember?.name} from the trip roster.`);
    setTimeout(() => setActionAlert(null), 3000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('INVITE_MEMBERS')) {
      showPermissionWarning('invite new members');
      return;
    }

    const email = newMemberEmail.trim();
    if (!email || !email.includes('@')) {
      setInviteStatus('Please enter a valid email address.');
      return;
    }

    const duplicate = members.some((member) => member.phone === email || member.name.toLowerCase() === email.toLowerCase());
    if (duplicate) {
      setInviteStatus('This email is already part of this trip.');
      return;
    }

    const localMember = {
      id: `invite-${Date.now()}`,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      role: newMemberRole,
      phone: email,
    };

    try {
      const invitation = await api.inviteMember(params.id, { email, role: newMemberRole });
      const rawLink = invitation.inviteLink;
      const inviteLink = rawLink && rawLink.startsWith('http')
        ? rawLink
        : `${window.location.origin}/invite/${invitation.token || ''}`;
      setMembers((current) => [...current, { ...localMember, id: invitation.id || localMember.id }]);
      setLastInviteLink(inviteLink);
      setRecentInvites((prev) => [
        { email, link: inviteLink, emailSent: invitation.emailSent },
        ...prev.filter((i) => i.email !== email),
      ]);
      const statusMsg = invitation.emailSent
        ? `✅ Email invitation delivered to ${email}!`
        : `Invitation created for ${email}. Copy the direct link below to share with them.`;
      setInviteStatus(statusMsg);
      await navigator.clipboard?.writeText(inviteLink);
      setActionAlert(invitation.emailSent ? `Email sent to ${email}` : `Invite link copied for ${email}`);
    } catch (reason: any) {
      setInviteStatus(reason.message || 'Invitation could not be saved.');
      return;
    }
    setNewMemberEmail('');
    setNewMemberRole(TripRole.MEMBER);
    setTimeout(() => setActionAlert(null), 4000);
  };

  const loadShareLink = async () => {
    try {
      const data = await api.getShareLink(params.id);
      const raw = data.inviteLink;
      const full = raw && raw.startsWith('http') ? raw : `${window.location.origin}/invite/${data.token || ''}`;
      setShareableLink(full);
      if (data.role) setShareableRole(data.role);
    } catch {
      setShareableLink(`${window.location.origin}/invite/join_${params.id}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') {
      loadShareLink();
    }
  }, [activeTab, params.id]);

  const handleUpdateShareLinkRole = async (newRole: TripRole) => {
    setShareableRole(newRole);
    setIsGeneratingShareLink(true);
    try {
      const data = await api.createShareLink(params.id, { role: newRole });
      const raw = data.inviteLink;
      const full = raw && raw.startsWith('http') ? raw : `${window.location.origin}/invite/${data.token || ''}`;
      setShareableLink(full);
      setActionAlert('Shareable group invite link updated.');
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to update share link.');
    } finally {
      setIsGeneratingShareLink(false);
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawList = bulkEmails
      .split(/[\n,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'));

    if (rawList.length === 0) {
      setBulkStatus('Please enter at least one valid email address.');
      return;
    }

    setIsSendingBulk(true);
    setBulkStatus(null);

    try {
      const result = await api.bulkInviteMembers(params.id, { emails: rawList, role: bulkRole });
      const newItems = (result.invitations || []).map((inv: any) => ({
        email: inv.email,
        link: inv.inviteLink && inv.inviteLink.startsWith('http') ? inv.inviteLink : `${window.location.origin}/invite/${inv.token}`,
        emailSent: inv.emailSent,
      }));
      setRecentInvites((prev) => [...newItems, ...prev]);

      const feedback = result.emailsDelivered > 0
        ? `✅ Successfully delivered ${result.emailsDelivered} email invitation(s)!`
        : `Created ${result.count} invitation(s). Copy the links below to share with travelers.`;
      setBulkStatus(feedback);
      setBulkEmails('');

      api.getMembers(params.id).then((tripMembers) => {
        const mapped = tripMembers.map((m: any) => ({
          id: m.userId || m.user?.id || m.id,
          name: m.user?.fullName || m.user?.email || 'Trip Member',
          role: m.role,
          phone: m.user?.phone || '',
        }));
        setMembers(mapped);
      }).catch(() => {});
      setActionAlert(`${result.count} invitation(s) processed.`);
    } catch (err: any) {
      setBulkStatus(err.message || 'Bulk invitations could not be saved.');
    } finally {
      setIsSendingBulk(false);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  const loadEmergencyContacts = async () => {
    setIsLoadingEmergency(true);
    try {
      const data = await api.getEmergencyContacts(params.id);
      setEmergencyContacts(data || []);
    } catch (err: any) {
      console.error('Failed to load emergency contacts:', err);
    } finally {
      setIsLoadingEmergency(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'emergency') {
      loadEmergencyContacts();
    }
  }, [activeTab, params.id]);

  const handleOpenAddEmergency = () => {
    if (!can('EDIT_TRIP')) {
      showPermissionWarning('add emergency contacts');
      return;
    }
    setEmergencyForm({
      name: '',
      relationship: 'Primary Hospital & 24x7 Ambulance',
      phone: '',
      altPhone: '',
      notes: '',
      isPrimary: false,
    });
    setShowAddEmergencyModal(true);
  };

  const handleSaveNewEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('EDIT_TRIP')) {
      showPermissionWarning('add emergency contacts');
      return;
    }
    if (!emergencyForm.name.trim() || !emergencyForm.phone.trim() || !emergencyForm.relationship.trim()) {
      setActionAlert('Please provide a name, phone number, and category/relationship.');
      return;
    }

    try {
      const created = await api.createEmergencyContact(params.id, emergencyForm);
      setEmergencyContacts((prev) => {
        let updated = [...prev];
        if (emergencyForm.isPrimary) {
          updated = updated.map((c) => ({ ...c, isPrimary: false }));
        }
        return [created, ...updated];
      });
      setShowAddEmergencyModal(false);
      setEmergencyForm({
        name: '',
        relationship: 'Primary Hospital & 24x7 Ambulance',
        phone: '',
        altPhone: '',
        notes: '',
        isPrimary: false,
      });
      setActionAlert('Emergency contact added successfully.');
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to save emergency contact.');
    } finally {
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleOpenEditEmergency = (contact: any) => {
    if (!can('EDIT_TRIP')) {
      showPermissionWarning('edit emergency contacts');
      return;
    }
    setEditingEmergencyContact(contact);
    setEmergencyForm({
      name: contact.name || '',
      relationship: contact.relationship || '',
      phone: contact.phone || '',
      altPhone: contact.altPhone || '',
      notes: contact.notes || '',
      isPrimary: Boolean(contact.isPrimary),
    });
    setShowEditEmergencyModal(true);
  };

  const handleSaveEditEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('EDIT_TRIP') || !editingEmergencyContact) {
      showPermissionWarning('edit emergency contacts');
      return;
    }
    if (!emergencyForm.name.trim() || !emergencyForm.phone.trim() || !emergencyForm.relationship.trim()) {
      setActionAlert('Please provide a name, phone number, and relationship.');
      return;
    }

    try {
      const updated = await api.updateEmergencyContact(params.id, editingEmergencyContact.id, emergencyForm);
      setEmergencyContacts((prev) =>
        prev.map((c) => {
          if (c.id === editingEmergencyContact.id) {
            return { ...c, ...updated };
          }
          if (emergencyForm.isPrimary) {
            return { ...c, isPrimary: false };
          }
          return c;
        })
      );
      setShowEditEmergencyModal(false);
      setEditingEmergencyContact(null);
      setActionAlert('Emergency contact updated successfully.');
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to update emergency contact.');
    } finally {
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleDeleteEmergencyContact = async (contactId: string) => {
    if (!can('EDIT_TRIP')) {
      showPermissionWarning('delete emergency contacts');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return;

    try {
      await api.deleteEmergencyContact(params.id, contactId);
      setEmergencyContacts((prev) => prev.filter((c) => c.id !== contactId));
      setActionAlert('Emergency contact removed.');
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to delete emergency contact.');
    } finally {
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleSeedStarterContacts = async () => {
    if (!can('EDIT_TRIP')) {
      showPermissionWarning('manage emergency contacts');
      return;
    }
    setIsLoadingEmergency(true);
    try {
      const seeded = await api.seedStarterEmergencyContacts(params.id);
      setEmergencyContacts(seeded || []);
      setActionAlert('Starter emergency directory created.');
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to seed starter contacts.');
    } finally {
      setIsLoadingEmergency(false);
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handlePrintEmergencySheet = () => {
    window.print();
  };

  const handleOpenEditMemberPhone = (member: any) => {
    if (!can('EDIT_TRIP') && user?.id !== member.id) {
      showPermissionWarning('update traveler phone numbers');
      return;
    }
    setEditingMemberForPhone(member);
    setMemberPhoneInput(member.phone || '');
    setShowEditMemberPhoneModal(true);
  };

  const handleSaveMemberPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberForPhone) return;
    try {
      const cleanPhone = memberPhoneInput.trim();
      await api.updateMemberPhone(params.id, editingMemberForPhone.id, cleanPhone || null);
      setMembers((prev) =>
        prev.map((m) => (m.id === editingMemberForPhone.id ? { ...m, phone: cleanPhone } : m))
      );
      setShowEditMemberPhoneModal(false);
      setEditingMemberForPhone(null);
      setActionAlert(`Phone number updated for ${editingMemberForPhone.name}.`);
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to update phone number.');
    } finally {
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleDeleteMemberPhone = async (member: any) => {
    if (!can('EDIT_TRIP') && user?.id !== member.id) {
      showPermissionWarning('delete traveler phone numbers');
      return;
    }
    if (!window.confirm(`Clear phone number for ${member.name}?`)) return;
    try {
      await api.updateMemberPhone(params.id, member.id, null);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, phone: '' } : m))
      );
      setActionAlert(`Phone number cleared for ${member.name}.`);
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to clear phone number.');
    } finally {
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleOpenEditTrip = () => {
    if (!can('EDIT_TRIP')) return;
    setEditTripForm({
      name: tripDetails?.name || '',
      destination: tripDetails?.destination || '',
      budget: Number(tripDetails?.budget || 0),
      currency: tripDetails?.currency || 'INR',
      startDate: tripDetails?.startDate ? tripDetails.startDate.split('T')[0] : '',
      endDate: tripDetails?.endDate ? tripDetails.endDate.split('T')[0] : '',
      description: tripDetails?.description || '',
      status: tripDetails?.status || 'PLANNING',
    });
    setShowEditTripModal(true);
  };

  const handleSaveEditTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateTrip(params.id, editTripForm);
      setTripDetails((curr: any) => ({ ...curr, ...updated }));
      setShowEditTripModal(false);
      setActionAlert('Trip details updated successfully.');
      setTimeout(() => setActionAlert(null), 3000);
    } catch (err: any) {
      setActionAlert(err.message || 'Failed to update trip.');
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('EDIT_TRIP') || !newDayDate) return;

    const dayNumber = tripDays.length + 1;
    let savedDay: any = null;
    try {
      savedDay = await api.createTripDay(params.id, {
        dayNumber,
        date: newDayDate,
        title: newDayLabel.trim() || `Day ${dayNumber}`,
      });
    } catch (reason: any) {
      setActionAlert(reason.message || 'Itinerary day could not be saved.');
      return;
    }
    setTripDays((current) => [
      ...current,
      {
        id: savedDay?.id,
        num: dayNumber,
        date: newDayDate,
        label: newDayLabel.trim() || `Day ${dayNumber}`,
      },
    ]);
    setNewDayDate('');
    setNewDayLabel('');
  };

  const handleDeleteDay = async () => {
    if (!can('EDIT_TRIP')) return;
    const dayToDelete = tripDays.find((day) => day.num === selectedDay);
    if (!dayToDelete || !window.confirm(`Delete ${dayToDelete.label} and all its activities?`)) return;

    if (dayToDelete.id && /^[0-9a-f-]{36}$/i.test(dayToDelete.id)) {
      try {
        await api.deleteTripDay(params.id, dayToDelete.id);
      } catch (reason: any) {
        setActionAlert(reason.message || 'Itinerary day could not be deleted.');
        return;
      }
    }

    const remainingDays = tripDays
      .filter((day) => day.num !== selectedDay)
      .map((day, index) => ({ ...day, num: index + 1 }));
    setTripDays(remainingDays);
    setActivitiesList((current) => current.filter((activity) => activity.dayNumber !== selectedDay));
    setSelectedDay(Math.max(1, Math.min(selectedDay, remainingDays.length)));
  };

  const calculatedDebtTransfers = (() => {
    const balances = new Map<string, number>(members.map((member) => [member.id, 0]));
    for (const expense of expensesList) {
      const payerId = expense.paidById || members.find((member) => member.name === expense.paidBy)?.id;
      if (!payerId || !balances.has(payerId)) continue;
      const amount = Number(expense.amount || 0);
      balances.set(payerId, (balances.get(payerId) || 0) + amount);

      const participants = expense.participants?.length
        ? expense.participants
        : members.map((member) => ({ userId: member.id, shareAmount: amount / Math.max(1, members.length) }));
      for (const participant of participants) {
        if (balances.has(participant.userId)) {
          balances.set(participant.userId, (balances.get(participant.userId) || 0) - Number(participant.shareAmount || 0));
        }
      }
    }

    const creditors = Array.from(balances.entries()).filter(([, amount]) => amount > 0.01).map(([id, amount]) => ({ id, amount }));
    const debtors = Array.from(balances.entries()).filter(([, amount]) => amount < -0.01).map(([id, amount]) => ({ id, amount: -amount }));
    const transfers: { id: string; from: string; to: string; amount: number }[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      const amount = Math.min(creditor.amount, debtor.amount);
      transfers.push({
        id: `settlement-${transfers.length + 1}`,
        from: members.find((member) => member.id === debtor.id)?.name || 'Member',
        to: members.find((member) => member.id === creditor.id)?.name || 'Member',
        amount: Math.round(amount * 100) / 100,
      });
      creditor.amount -= amount;
      debtor.amount -= amount;
      if (creditor.amount <= 0.01) creditorIndex += 1;
      if (debtor.amount <= 0.01) debtorIndex += 1;
    }
    return transfers;
  })();

  const debtTransfers = isDemoSession ? [
    { id: 'dt-1', from: 'Amit Kumar', to: 'Rahul Sharma', amount: 1933 },
    { id: 'dt-2', from: 'Sneha Reddy', to: 'Rahul Sharma', amount: 1933 },
    { id: 'dt-3', from: 'Arjun Mehta', to: 'Rahul Sharma', amount: 200 },
    { id: 'dt-4', from: 'Arjun Mehta', to: 'Priya Patel', amount: 1267 },
    { id: 'dt-5', from: 'Shubham Verma', to: 'Priya Patel', amount: 467 },
  ] : calculatedDebtTransfers;

  const tripBudget = isDemoSession ? 35000 : Number(tripDetails?.budget || 0);
  const calculatedTripSpent = expensesList.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  const tripSpent = isDemoSession ? 11600 : calculatedTripSpent;
  const tripCurrency = tripDetails?.currency || 'INR';
  const pendingTaskCount = tasks.filter((task) => task.status !== 'DONE').length;

  const categoryColors = ['#22c55e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
  const categoryTotals = expensesList.reduce<Record<string, number>>((totals, expense) => {
    const category = expense.category || 'OTHER';
    totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});
  const categoryChartData = Object.entries(categoryTotals).map(([name, value], index) => ({
    name,
    value,
    color: categoryColors[index % categoryColors.length],
  }));

  const memberPaidTotals = expensesList.reduce<Record<string, number>>((totals, expense) => {
    const payerId = expense.paidById || members.find((member) => member.name === expense.paidBy)?.id;
    if (payerId) totals[payerId] = (totals[payerId] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});
  const equalShare = members.length > 0 ? tripSpent / members.length : 0;
  const memberSpendingData = members.map((member) => ({
    name: member.name.split(' ').map((part) => part[0]).join(''),
    paid: memberPaidTotals[member.id] || 0,
    share: equalShare,
  }));

  const displayTripName = isDemoSession ? 'Darjeeling Himalayan Adventure' : tripDetails?.name || 'Your New Trip';
  const displayDestination = isDemoSession
    ? 'Darjeeling, West Bengal, India'
    : tripDetails?.destination || 'Add your destination to get started';
  const displayDates = isDemoSession
    ? 'Sep 10 - Sep 14, 2026 (4 Days)'
    : tripDetails?.startDate && tripDetails?.endDate
      ? `${formatDate(tripDetails.startDate)} - ${formatDate(tripDetails.endDate)}`
      : 'No dates selected';
  const displayCoverImage = isDemoSession
    ? 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80'
    : tripDetails?.coverImage;
  const countdownDays = !isDemoSession && tripDetails?.startDate
    ? Math.ceil((new Date(`${tripDetails.startDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
    : null;
  const countdownLabel = isDemoSession
    ? '19 Days'
    : countdownDays === null
      ? 'N/A'
      : countdownDays > 0
        ? `${countdownDays} Days`
        : countdownDays === 0
          ? 'Today'
          : 'Trip started';

  return (
    <div className="min-h-full pb-28 md:pb-16">
      {/* ========================================================= */}
      {/* ROLE-AWARE ACCESS BANNER */}
      {/* ========================================================= */}
      {currentRole === 'VIEWER' ? (
        <div className="bg-indigo-950 text-indigo-100 border-b border-indigo-800/80 py-3 px-4 sm:px-6 lg:px-8 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Guest View-Only Access</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                    VIEWER
                  </span>
                </div>
                <p className="text-[11px] text-indigo-300 mt-0.5">
                  You are viewing this trip in read-only guest mode. You can browse the full itinerary, explore expense splits, and download offline emergency safety cards.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 text-white border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Active Access Role:</span>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      currentRole === 'OWNER'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : currentRole === 'ADMIN'
                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
                        : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                    }`}
                  >
                    {user?.fullName || 'Traveler'} • {currentRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentRole === 'OWNER' && '👑 Organizer & Owner: Full control over trip details, member roles, budget, and settings.'}
                  {currentRole === 'ADMIN' && '🛡️ Co-Organizer & Admin: Manage itinerary, expenses, tasks & travelers.'}
                  {currentRole === 'MEMBER' && '🎒 Active Traveler: Log shared expenses, complete assigned tasks, and participate in planning.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Permission Warning Alert */}
      {actionAlert && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-brand-500/50 animate-in fade-in slide-in-from-top-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold leading-relaxed">{actionAlert}</p>
          </div>
        </div>
      )}

      {/* Trip Top Hero Banner */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          {displayCoverImage && <img src={displayCoverImage} alt={displayTripName} className="w-full h-full object-cover" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isDemoSession && <>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                    🏔️ Mountain Expedition
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    🌤️ 18°C Sunny in Darjeeling
                  </span>
                </>}
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {displayTripName}
                </h1>
                {can('EDIT_TRIP') && (
                  <button
                    type="button"
                    onClick={handleOpenEditTrip}
                    title="Edit trip name & details"
                    className="rounded-xl p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white backdrop-blur-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>{displayDestination}</span>
                <span>•</span>
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{displayDates}</span>
              </p>
            </div>

            {/* Quick Spend Counter, Live Activity Feed & Crew Chat */}
            <div className="w-full md:w-auto flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowActivityFeed(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 backdrop-blur-md text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Open Real-Time Activity Feed & Notifications"
              >
                <div className="relative">
                  <Bell className="w-4 h-4 text-sky-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                </div>
                <span>Activity Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCrewChat(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 backdrop-blur-md text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Open Crew Live Chat & Announcements"
              >
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span>Crew Chat</span>
              </button>

              <div className="flex items-center justify-between gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Total Spent</p>
                  <p className="text-lg font-extrabold text-brand-400">{formatCurrency(tripSpent, tripCurrency)}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Budget</p>
                  <p className="text-lg font-extrabold text-white">{formatCurrency(tripBudget, tripCurrency)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar (Clean swipeable pills) */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 overflow-x-auto no-scrollbar border-b border-white/10 pb-2.5 sm:pb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'itinerary', label: 'Itinerary', icon: Calendar },
              { id: 'expenses', label: 'Expenses', icon: Wallet },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'documents', label: 'Vault', icon: FileCheck },
              { id: 'emergency', label: '🆘 SOS Hub', icon: ShieldAlert, highlight: true },
              { id: 'analytics', label: 'Analytics', icon: PieChartIcon },
              { id: 'members', label: `Crew (${members.length})`, icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic.selection();
                    setActiveTab(tab.id as ActiveTab);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-t-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    tab.highlight
                      ? isActive
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'text-red-300 hover:text-white bg-red-500/10 sm:bg-transparent border border-red-500/30 sm:border-0'
                      : isActive
                      ? 'bg-white text-slate-900 shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 bg-white/5 sm:bg-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ========================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Days Countdown</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{countdownLabel}</p>
                <p className="text-[11px] text-brand-600 font-semibold mt-0.5">{isDemoSession ? 'Departing Sep 10' : tripDetails?.startDate ? `Starts ${formatDate(tripDetails.startDate)}` : 'Add trip dates'}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Itinerary Items</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{activitiesList.length} Activities</p>
                <p className="text-[11px] text-ocean-600 font-semibold mt-0.5">Across {tripDays.length} Days</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Split Status</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(tripSpent, tripCurrency)}</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{isDemoSession ? '5 Transfers pending' : `${debtTransfers.length} transfer${debtTransfers.length === 1 ? '' : 's'} pending`}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Pending Tasks</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{isDemoSession ? '2 Left' : `${pendingTaskCount} Left`}</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{isDemoSession ? '2 Completed' : `${tasks.length - pendingTaskCount} Completed`}</p>
              </div>
            </div>

            {/* Live Destination Weather & Sunrise Widget */}
            <DestinationWeatherWidget destination={displayDestination} startDate={tripDetails?.startDate} />

            {/* Next Upcoming Activity Card */}
            <div className="bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-1 rounded-md bg-brand-500/30 text-brand-300 font-semibold text-xs border border-brand-400/40">
                    {isDemoSession ? 'Next Key Highlight' : 'Trip workspace ready'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold mt-2">
                    {isDemoSession ? 'Tiger Hill Early Morning Sunrise & Kanchenjunga View' : 'No upcoming activities yet'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {isDemoSession ? 'Day 2 • 04:30 AM - 07:30 AM • Private Innova Cab Lead by Rahul' : 'Add an itinerary activity to start planning this trip.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('itinerary')}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md transition-all"
                >
                  {isDemoSession ? 'View Full Schedule' : 'Open Itinerary'}
                </button>
              </div>
            </div>

            {/* Travelers Roster */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  Trip Members Roster ({members.length})
                </h2>
                <button
                  onClick={() => setActiveTab('members')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Manage Roles →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {members.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {p.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.phone}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        p.role === 'OWNER'
                          ? 'bg-amber-100 text-amber-800'
                          : p.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : p.role === 'MEMBER'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. ITINERARY TAB */}
        {/* ========================================================= */}
        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            {/* View Mode Toggle: Timeline vs Interactive Map */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-slate-200 uppercase">Expedition Itinerary View</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setItineraryViewMode('timeline')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    itineraryViewMode === 'timeline'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Timeline View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItineraryViewMode('map')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    itineraryViewMode === 'map'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Route Map View</span>
                </button>
              </div>
            </div>

            {/* If Route Map View is active */}
            {itineraryViewMode === 'map' ? (
              <ItineraryRouteMap
                days={tripDays.map((d) => ({
                  id: `day-${d.num}`,
                  dayNumber: d.num,
                  date: d.date,
                  title: d.label,
                  items: activitiesList
                    .filter((a) => a.dayNumber === d.num)
                    .map((a) => ({
                      id: a.id,
                      title: a.title,
                      location: a.location,
                      startTime: a.time,
                      notes: a.description,
                      leadName: a.responsible,
                    })),
                }))}
                tripDestination={displayDestination}
              />
            ) : (
              <>
                {/* Day Selector Pills & Responsive Action Controls */}
                <div className="space-y-3 pb-3 border-b border-slate-200">
                  {/* Day Pills Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {tripDays.map((d) => (
                      <button
                        key={d.num}
                        onClick={() => setSelectedDay(d.num)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                          selectedDay === d.num
                            ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-400/40'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <span>{d.label}</span>
                        <span className="block text-[10px] font-normal opacity-80">
                          {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Action Bar: Add Day / Delete Day / Add Activity */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
                    {can('EDIT_TRIP') && (
                      <form onSubmit={handleAddDay} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                          {/* Calendar Date Input with Icon and Visual Placeholder */}
                          <div className="relative flex items-center">
                            <div className="absolute left-3 pointer-events-none flex items-center gap-1.5 z-10">
                              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                              {!newDayDate && (
                                <span className="text-xs font-bold text-slate-500">Pick Date</span>
                              )}
                            </div>
                            <input
                              type="date"
                              required
                              value={newDayDate}
                              onChange={(event) => setNewDayDate(event.target.value)}
                              className={`w-full ${!newDayDate ? 'text-transparent' : 'text-slate-900 font-bold'} pl-9 sm:pl-24 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs cursor-pointer`}
                              aria-label="New itinerary day date"
                            />
                          </div>

                          {/* Day Title Input with Icon */}
                          <div className="relative flex items-center">
                            <div className="absolute left-3 pointer-events-none text-slate-400 z-10">
                              <Tag className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                              value={newDayLabel}
                              onChange={(event) => setNewDayLabel(event.target.value)}
                              placeholder="Day title (e.g. Day 3)"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                              aria-label="New itinerary day title"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button type="submit" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition-colors active:scale-95">
                            <Plus className="h-4 w-4 text-emerald-400" />
                            <span>Add Day</span>
                          </button>
                          {tripDays.length > 0 && (
                            <button
                              type="button"
                              onClick={handleDeleteDay}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2.5 text-xs font-bold text-red-700 transition-colors active:scale-95"
                              title="Delete selected day"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Delete Day</span>
                            </button>
                          )}
                        </div>
                      </form>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      {can('ADD_ACTIVITY') ? (
                        <button
                          onClick={() => setShowAddActivityModal(true)}
                          disabled={tripDays.length === 0}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Activity</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => showPermissionWarning('add activities (Viewer role is read-only)')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Add Activity (Read-Only)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

            {/* Timeline for Selected Day */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                {tripDays.find((day) => day.num === selectedDay)?.label || 'Itinerary'} Schedule
              </h2>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-slate-200">
                {activitiesList
                  .filter((a) => a.dayNumber === selectedDay)
                  .map((act) => (
                    <div key={act.id} className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
                      <div className="absolute left-2.5 top-2 w-3.5 h-3.5 rounded-full bg-brand-500 ring-4 ring-white" />
                      <div className="flex-1 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
                            <Clock className="w-3.5 h-3.5 text-brand-600" /> {act.time}
                          </span>
                          <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                            {act.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-2">{act.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.description}</p>

                        <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-none">{act.location}</span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              👤 {act.responsible}
                            </span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              ₹{act.cost.toLocaleString()}
                            </span>
                          </div>

                          {/* 1-Tap Google Maps Directions Shortcut */}
                          {act.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${act.location}, ${displayDestination}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all"
                            >
                              <Navigation className="w-3.5 h-3.5 text-brand-500" />
                              <span>Map Directions</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {activitiesList.filter((a) => a.dayNumber === selectedDay).length === 0 && (
                  <div className="pl-10 text-xs text-slate-500 italic py-4">
                    No activities scheduled for this day yet. Click "Add Activity" above to schedule.
                  </div>
                )}
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. EXPENSES & SPLITS TAB */}
        {/* ========================================================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Expenses & Settlements</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track group bills and minimize debt transfers automatically.
                </p>
              </div>

              {can('ADD_EXPENSE') ? (
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Group Expense</span>
                </button>
              ) : (
                <button
                  onClick={() => showPermissionWarning('add expenses (Viewers have read-only access)')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>Add Expense (Read-Only)</span>
                </button>
              )}
            </div>

            {/* Settlement Optimization Card ("Who Owes Whom") */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <Split className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Optimal Debt Settlement Engine</h3>
                    <p className="text-xs text-slate-400">
                      {debtTransfers.length > 0
                        ? `Reduced shared expenses into ${debtTransfers.length} minimal direct transfer${debtTransfers.length === 1 ? '' : 's'}.`
                        : 'Everyone is settled. New shared expenses will appear here.'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Greedy Min-Cash-Flow
                </span>
              </div>

              {/* Debt Transfer Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {debtTransfers.map((dt) => {
                  const isSettled = settledDebtIds[dt.id];
                  return (
                    <div
                      key={dt.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSettled
                          ? 'bg-emerald-950/40 border-emerald-700/60 opacity-80'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-300">{dt.from}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                        <span className="font-semibold text-brand-300">{dt.to}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                        <span className="text-base font-extrabold text-white">
                          ₹{dt.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUpiDebt(dt)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Pay UPI</span>
                          </button>
                          {can('ADD_EXPENSE') && (
                            <button
                              type="button"
                              onClick={() => setSettledDebtIds({ ...settledDebtIds, [dt.id]: !isSettled })}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                                isSettled
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white/10 hover:bg-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isSettled ? 'Settled' : 'Mark Paid'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {debtTransfers.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-slate-400">No outstanding settlements.</p>
                )}
              </div>
            </div>

            {/* Expense Log: Mobile Cards (< md) & Desktop Table (>= md) */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                Logged Expenses ({expensesList.length})
              </h3>

              {/* Mobile Expense Cards (< md) */}
              <div className="md:hidden space-y-3">
                {expensesList.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug truncate">{exp.title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                            {exp.category}
                          </span>
                          {exp.originalCurrency && exp.originalAmount && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              {formatCurrencyWithSymbol(exp.originalAmount, exp.originalCurrency)}
                            </span>
                          )}
                          {exp.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptExpense(exp)}
                              className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1 transition-colors"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-slate-900">₹{formatExpenseAmount(exp.amount)}</span>
                        <span className="block text-[10px] text-slate-400 font-medium">{exp.date}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium text-slate-700">👤 Paid by <strong className="text-slate-900">{exp.paidBy}</strong></span>
                      <span className="text-[11px] text-slate-500 font-medium">{exp.split}</span>
                    </div>

                    {can('ADD_EXPENSE') && (
                      <div className="pt-2 flex items-center justify-end gap-3 text-xs border-t border-slate-200/40">
                        <button
                          type="button"
                          onClick={() => handleEditExpense(exp)}
                          className="font-bold text-brand-600 hover:text-brand-800 p-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="font-bold text-red-600 hover:text-red-800 p-1"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {expensesList.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">No expenses recorded yet.</div>
                )}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Title & Category</th>
                      <th className="pb-3">Receipt</th>
                      <th className="pb-3">Paid By</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Split Details</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesList.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5">
                          <p className="font-bold text-slate-900">{exp.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                              {exp.category}
                            </span>
                            {exp.originalCurrency && exp.originalAmount && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                {formatCurrencyWithSymbol(exp.originalAmount, exp.originalCurrency)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5">
                          {exp.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptExpense(exp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-bold transition-all shadow-2xs"
                              title="View Attached Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">—</span>
                          )}
                        </td>
                        <td className="py-3.5 font-medium text-slate-700">{exp.paidBy}</td>
                        <td className="py-3.5 text-slate-500">{exp.date}</td>
                        <td className="py-3.5 text-slate-600">{exp.split}</td>
                        <td className="py-3.5 text-right font-extrabold text-slate-900">
                          ₹{formatExpenseAmount(exp.amount)}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditExpense(exp)}
                              className="font-semibold text-brand-700 hover:text-brand-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="font-semibold text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TASKS TAB */}
        {/* ========================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Trip Responsibilities</h2>
                <p className="text-xs text-slate-500 mt-0.5">Assign and track who is managing what.</p>
              </div>
            </div>

            {can('MANAGE_TASKS') && (
              <form onSubmit={handleAddTask} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-end">
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="mb-1 block text-xs font-bold text-slate-700">Task</label>
                  <input required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Book train tickets, Pack first-aid" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Assignee</label>
                  <select value={newTask.assignedToId} onChange={(event) => setNewTask({ ...newTask, assignedToId: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    <option value="">Unassigned</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Due date</label>
                  <input type="date" value={newTask.dueDate} onChange={(event) => setNewTask({ ...newTask, dueDate: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Priority</label>
                  <select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                  </select>
                </div>
                <button type="submit" className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors">Add task</button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do Column */}
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">To Do</h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status === 'TODO')
                    .map((t) => (
                      <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            {t.priority}
                          </span>
                          <span className="text-slate-400">Due {t.dueDate}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mt-1">{t.title}</h4>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-600 font-medium">👤 {t.assignedTo}</span>
                          {can('MANAGE_TASKS') ? (
                            <button
                              onClick={() => toggleTaskStatus(t.id)}
                              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                            >
                              Start →
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-ocean-700">In Progress</h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status === 'IN_PROGRESS')
                    .map((t) => (
                      <div key={t.id} className="bg-white p-4 rounded-xl border border-ocean-200 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {t.priority}
                          </span>
                          <span className="text-slate-400">Due {t.dueDate}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mt-1">{t.title}</h4>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-600 font-medium">👤 {t.assignedTo}</span>
                          {can('MANAGE_TASKS') ? (
                            <button
                              onClick={() => toggleTaskStatus(t.id)}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              Done ✓
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700">Completed</h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status === 'DONE')
                    .map((t) => (
                      <div key={t.id} className="bg-white/80 p-4 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            RESOLVED
                          </span>
                          <span className="text-slate-400">Due {t.dueDate}</span>
                        </div>
                        <h4 className="font-medium text-xs text-slate-700 line-through mt-1">{t.title}</h4>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-500">👤 {t.assignedTo}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. DOCUMENTS & TICKET VAULT TAB */}
        {/* ========================================================= */}
        {activeTab === 'documents' && (
          <DocumentVaultSection canEdit={can('EDIT_TRIP')} tripId={params.id} tripName={displayTripName} />
        )}

        {/* ========================================================= */}
        {/* 6. EMERGENCY MODE TAB (Dynamic & Editable) */}
        {/* ========================================================= */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            {/* Alert & Actions Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 md:p-8 text-white shadow-xl border-2 border-red-500/50">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <ShieldAlert className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                        24/7 Safety Command
                      </span>
                      {tripDetails?.destination && (
                        <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-[11px] font-bold text-red-100 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {tripDetails.destination}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide mt-1">
                      Emergency & Safety Directory
                    </h2>
                    <p className="text-xs sm:text-sm text-red-100 max-w-xl mt-1">
                      High-contrast, offline-ready emergency services, insurance policies, and traveler contacts for{' '}
                      <strong className="underline text-white">{tripDetails?.destination || tripDetails?.name || 'this trip'}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrintEmergencySheet}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs shadow-sm transition-all border border-white/20"
                    title="Print or save as offline PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Offline Sheet</span>
                  </button>

                  {can('EDIT_TRIP') && (
                    <button
                      type="button"
                      onClick={handleOpenAddEmergency}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Emergency Contact</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick SOS Dial Grid (Universal local emergency lines) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                Universal Emergency Quick Dials
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <a
                  href="tel:112"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50 border border-red-200 hover:bg-red-100/80 transition-all group"
                >
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-red-600 uppercase">National SOS</span>
                    <p className="text-base font-black text-red-950 font-mono">112</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                </a>

                <a
                  href="tel:108"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100/80 transition-all group"
                >
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-rose-600 uppercase">Ambulance</span>
                    <p className="text-base font-black text-rose-950 font-mono">108</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                </a>

                <a
                  href="tel:100"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100/80 transition-all group"
                >
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase">Police</span>
                    <p className="text-base font-black text-blue-950 font-mono">100</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                </a>

                <a
                  href="tel:101"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100/80 transition-all group"
                >
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-amber-700 uppercase">Fire Dept</span>
                    <p className="text-base font-black text-amber-950 font-mono">101</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                </a>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
                {[
                  { id: 'ALL', label: `All Contacts (${emergencyContacts.length})` },
                  { id: 'MEDICAL', label: '🏥 Medical' },
                  { id: 'POLICE', label: '👮 Police' },
                  { id: 'HOTEL', label: '🏨 Stay & Desk' },
                  { id: 'INSURANCE', label: '🛡️ Insurance' },
                  { id: 'PRIMARY', label: '⭐ Primary SOS' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setEmergencyFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      emergencyFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {can('EDIT_TRIP') && emergencyContacts.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedStarterContacts}
                  disabled={isLoadingEmergency}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Seed Quick Starter Contacts</span>
                </button>
              )}
            </div>

            {/* Dynamic Emergency Contacts Grid */}
            {emergencyContacts.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Emergency Contacts Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Ensure traveler safety by adding local hospital numbers, nearest police station, accommodation desk, and travel insurance policy details.
                </p>
                {can('EDIT_TRIP') && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddEmergency}
                      className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm"
                    >
                      + Add Emergency Service
                    </button>
                    <button
                      type="button"
                      onClick={handleSeedStarterContacts}
                      disabled={isLoadingEmergency}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200"
                    >
                      ⚡ Auto-Populate {tripDetails?.destination || 'Destination'} Contacts
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyContacts
                  .filter((contact) => {
                    if (emergencyFilter === 'PRIMARY') return contact.isPrimary;
                    if (emergencyFilter === 'MEDICAL') {
                      const text = `${contact.name} ${contact.relationship}`.toLowerCase();
                      return text.includes('hosp') || text.includes('medic') || text.includes('clinic') || text.includes('ambul') || text.includes('doctor');
                    }
                    if (emergencyFilter === 'POLICE') {
                      const text = `${contact.name} ${contact.relationship}`.toLowerCase();
                      return text.includes('polic') || text.includes('rescue') || text.includes('tourist') || text.includes('security') || text.includes('patrol');
                    }
                    if (emergencyFilter === 'HOTEL') {
                      const text = `${contact.name} ${contact.relationship}`.toLowerCase();
                      return text.includes('hotel') || text.includes('resort') || text.includes('desk') || text.includes('stay') || text.includes('host') || text.includes('lodge');
                    }
                    if (emergencyFilter === 'INSURANCE') {
                      const text = `${contact.name} ${contact.relationship}`.toLowerCase();
                      return text.includes('insur') || text.includes('embassy') || text.includes('consul') || text.includes('policy') || text.includes('claim');
                    }
                    return true;
                  })
                  .map((contact) => {
                    const desc = `${contact.name} ${contact.relationship}`.toLowerCase();
                    const isMedical = desc.includes('hosp') || desc.includes('medic') || desc.includes('clinic') || desc.includes('ambul') || desc.includes('doctor');
                    const isPolice = desc.includes('polic') || desc.includes('rescue') || desc.includes('tourist') || desc.includes('security');
                    const isHotel = desc.includes('hotel') || desc.includes('resort') || desc.includes('desk') || desc.includes('stay') || desc.includes('host') || desc.includes('lodge');
                    const isInsurance = desc.includes('insur') || desc.includes('embassy') || desc.includes('consul') || desc.includes('policy');

                    const iconEmoji = isMedical ? '🏥' : isPolice ? '👮' : isHotel ? '🏨' : isInsurance ? '🛡️' : '📞';
                    const iconBg = isMedical
                      ? 'bg-red-100 text-red-700'
                      : isPolice
                      ? 'bg-blue-100 text-blue-700'
                      : isHotel
                      ? 'bg-amber-100 text-amber-700'
                      : isInsurance
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700';

                    return (
                      <div
                        key={contact.id}
                        className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                          contact.isPrimary
                            ? 'border-2 border-red-300 ring-2 ring-red-100'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`p-2.5 rounded-xl ${iconBg} font-bold text-base shrink-0`}>
                              {iconEmoji}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate">
                                  {contact.name}
                                </h3>
                                {contact.isPrimary && (
                                  <span className="px-2 py-0.5 text-[9px] font-black bg-red-600 text-white rounded-md uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                    <Star className="w-2.5 h-2.5 fill-white" /> PRIMARY SOS
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {contact.relationship}
                              </p>
                            </div>
                          </div>

                          {can('EDIT_TRIP') && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEmergency(contact)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Edit Contact"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmergencyContact(contact.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Contact"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {contact.notes && (
                          <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{contact.notes}</p>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call: {contact.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(contact.phone)}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 flex items-center gap-1 transition-colors"
                              title="Copy Phone Number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedText === contact.phone ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          {contact.altPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg font-mono">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Alt/Policy:</span>
                              <span className="font-semibold text-slate-800">{contact.altPhone}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(contact.altPhone!)}
                                className="text-slate-400 hover:text-slate-700 ml-1"
                                title="Copy Alt Info"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Offline Travelers Phone Sheet with Add / Edit / Delete */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                    <Users className="w-4 h-4 text-brand-400" />
                    All Travelers Emergency Directory ({members.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Direct phone lines for all group participants registered on this expedition. Add or edit numbers below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {members.map((p) => {
                  const isOwner = p.role === TripRole.OWNER;
                  const canManageThisPhone = can('EDIT_TRIP') || user?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{p.name}</p>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isOwner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : p.role === TripRole.ADMIN
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        {p.phone ? (
                          <p className="text-slate-300 text-[11px] font-mono mt-0.5 truncate">
                            📞 {p.phone}
                          </p>
                        ) : (
                          <p className="text-slate-500 text-[11px] italic mt-0.5">
                            Phone not provided
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.phone ? (
                          <>
                            <a
                              href={`tel:${p.phone.replace(/\s+/g, '')}`}
                              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-transform active:scale-95 shadow-sm"
                              title={`Call ${p.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            {canManageThisPhone && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMemberPhone(p)}
                                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                                  title="Edit Phone Number"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMemberPhone(p)}
                                  className="p-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-300 transition-colors"
                                  title="Delete Phone Number"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          canManageThisPhone && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditMemberPhone(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-[11px] transition-colors border border-white/10"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Phone</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. ANALYTICS TAB */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Trip Spending Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown Pie */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
                <h3 className="font-bold text-sm text-slate-800 self-start mb-4">
                  Expense Category Distribution
                </h3>
                <div className="w-full h-64">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No expenses recorded yet.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {categoryChartData.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>
                        {c.name}: ₹{c.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Contribution Bar Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 mb-4">
                  Member Paid vs Equal Share ({formatCurrency(equalShare, tripCurrency)})
                </h3>
                <div className="w-full h-64">
                  {memberSpendingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={memberSpendingData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                        <Bar dataKey="paid" fill="#22c55e" radius={[4, 4, 0, 0]} name="Paid" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No members or expenses recorded yet.
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  {memberSpendingData.length > 0
                    ? 'Compare each member\'s payments with their equal share.'
                    : 'Member contribution data will appear after members and expenses are added.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. MEMBERS TAB (Interactive RBAC Management) */}
        {/* ========================================================= */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Trip Members & RBAC Roles</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage traveler permissions: OWNER (Lead), ADMIN (Co-organizer), MEMBER (Traveler), VIEWER (Guest).
                </p>
              </div>

              {can('INVITE_MEMBERS') && shareableLink ? (
                <button
                  onClick={() => copyToClipboard(shareableLink)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  {copiedText === shareableLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Group Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Group Invite Link</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {/* Feature 1: Universal Group Shareable Link (For WhatsApp / Groups of 20-50+ users) */}
            {can('INVITE_MEMBERS') && (
              <div className="rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50/90 via-white to-slate-50 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-brand-100">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/20 shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">Universal Group Invite Link</h3>
                        <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-extrabold text-brand-800 uppercase tracking-wide">
                          Active & Ready to Share
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Share this single link with all <strong>20–50+ travelers</strong> in your <strong>WhatsApp group, Telegram, Slack, or email thread</strong>. Anyone with the link can join the trip instantly with one click!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <label className="text-[11px] font-bold uppercase text-slate-500 pl-1.5">Join as:</label>
                    <select
                      value={shareableRole}
                      onChange={(e) => handleUpdateShareLinkRole(e.target.value as TripRole)}
                      disabled={isGeneratingShareLink}
                      className="rounded-lg border-0 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value={TripRole.MEMBER}>Member (Traveler)</option>
                      <option value={TripRole.VIEWER}>Viewer (Guest)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={shareableLink || 'Generating shareable link...'}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-mono text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500 selection:bg-brand-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => shareableLink && copyToClipboard(shareableLink)}
                    disabled={!shareableLink || isGeneratingShareLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {copiedText === shareableLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Link Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Group Invite Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Helper Tips */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">1</span>
                    <span>Copy link above</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">2</span>
                    <span>Paste in WhatsApp / Slack</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">3</span>
                    <span>Travelers click & join instantly</span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* Feature 2: Direct Email Invitations (Commented out as requested) */}
            {/* ========================================================= */}
            {/*
            {can('INVITE_MEMBERS') && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-900">Direct Email Invitations</h3>
                  </div>

                  <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setBulkInviteMode('single')}
                      className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                        bulkInviteMode === 'single'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Single Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkInviteMode('bulk')}
                      className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                        bulkInviteMode === 'bulk'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Bulk Paste (20+ Emails)
                    </button>
                  </div>
                </div>

                {bulkInviteMode === 'single' ? (
                  <form onSubmit={handleAddMember}>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_200px_auto] md:items-end">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Member email</label>
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="traveler@example.com"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Role</label>
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value as TripRole)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value={TripRole.ADMIN}>Admin</option>
                          <option value={TripRole.MEMBER}>Member</option>
                          <option value={TripRole.VIEWER}>Viewer</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
                      >
                        Add Member
                      </button>
                    </div>

                    {inviteStatus && (
                      <p className="mt-3 text-xs font-semibold text-emerald-700">{inviteStatus}</p>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleBulkInvite} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Paste Multiple Emails (Separated by comma, space, or newline)
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {bulkEmails.split(/[\n,;\s]+/).filter((e) => e.includes('@')).length} email(s) detected
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        placeholder="alice@gmail.com, bob@example.com, charlie@domain.org&#10;david@travel.com"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600">Assign Role:</label>
                        <select
                          value={bulkRole}
                          onChange={(e) => setBulkRole(e.target.value as TripRole)}
                          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value={TripRole.ADMIN}>Admin</option>
                          <option value={TripRole.MEMBER}>Member</option>
                          <option value={TripRole.VIEWER}>Viewer</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingBulk}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          {isSendingBulk
                            ? 'Sending Invites...'
                            : `Send Invites to ${bulkEmails.split(/[\n,;\s]+/).filter((e) => e.includes('@')).length || 0} Travelers`}
                        </span>
                      </button>
                    </div>

                    {bulkStatus && (
                      <p className="text-xs font-semibold text-emerald-700">{bulkStatus}</p>
                    )}
                  </form>
                )}

                {recentInvites.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Generated Traveler Links ({recentInvites.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Click copy to share directly via WhatsApp, SMS, or Email
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 max-h-56 overflow-y-auto">
                      {recentInvites.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 p-2.5 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 truncate">{item.email}</span>
                              {item.emailSent ? (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  Email Delivered
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                                  Direct Link
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{item.link}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.link)}
                            className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs shrink-0"
                          >
                            {copiedText === item.link ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            */}

            {/* Members Roster: Mobile Cards (< md) & Desktop Table (>= md) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Mobile Member Cards (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {members.map((p) => {
                  const isOwner = p.role === TripRole.OWNER;
                  const canEditThisRole = can('MANAGE_ROLES') && (!isOwner || currentRole === TripRole.OWNER);

                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {p.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{p.name}</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {isOwner ? '👑 Trip Creator & Owner' : 'Joined via Invitation'}
                            </p>
                          </div>
                        </div>

                        {!isOwner && can('INVITE_MEMBERS') && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(p.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Contact info & role on mobile */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Emergency Contact:</span>
                          {p.phone ? (
                            <a href={`tel:${p.phone.replace(/\s+/g, '')}`} className="font-bold text-brand-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {p.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No phone added</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs gap-2 pt-1">
                          <span className="text-slate-500 font-medium shrink-0">Access Role:</span>
                          {canEditThisRole && !isOwner ? (
                            <div className="flex items-center gap-1.5 w-full max-w-[240px]">
                              <select
                                value={draftRoles[p.id] || p.role}
                                onChange={(e) => {
                                  const nextRole = e.target.value as TripRole;
                                  setDraftRoles((prev) => ({ ...prev, [p.id]: nextRole }));
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                              >
                                <option value={TripRole.ADMIN}>🛡️ ADMIN (Co-Organizer)</option>
                                <option value={TripRole.MEMBER}>🎒 MEMBER (Active Traveler)</option>
                                <option value={TripRole.VIEWER}>👁️ VIEWER (Read-Only Guest)</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleMemberRoleChange(p.id, draftRoles[p.id] || p.role)}
                                disabled={savingRoleId === p.id}
                                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                                  savedRoleId === p.id
                                    ? 'bg-emerald-600 text-white'
                                    : draftRoles[p.id] && draftRoles[p.id] !== p.role
                                    ? 'bg-brand-600 hover:bg-brand-700 text-white animate-pulse'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="Save updated role"
                              >
                                {savingRoleId === p.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : savedRoleId === p.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-white" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3 h-3" />
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                                p.role === 'OWNER'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : p.role === 'ADMIN'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : p.role === 'MEMBER'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {p.role === 'OWNER' ? '👑 OWNER' : p.role === 'ADMIN' ? '🛡️ ADMIN' : p.role === 'MEMBER' ? '🎒 MEMBER' : '👁️ VIEWER'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Active RBAC Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((p) => {
                      const isOwner = p.role === TripRole.OWNER;
                      const canEditThisRole = can('MANAGE_ROLES') && (!isOwner || currentRole === TripRole.OWNER);
                      const currentSelectedRole = draftRoles[p.id] || p.role;
                      const hasUnsavedRole = Boolean(draftRoles[p.id] && draftRoles[p.id] !== p.role);
                      const isSaving = savingRoleId === p.id;
                      const isSaved = savedRoleId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center">
                                {p.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {isOwner ? 'Trip Creator & Organizer' : 'Joined via Invitation'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{p.phone || '—'}</td>
                          <td className="py-3.5 px-4">
                            {canEditThisRole && !isOwner ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={currentSelectedRole}
                                  onChange={(e) => {
                                    const nextRole = e.target.value as TripRole;
                                    setDraftRoles((prev) => ({ ...prev, [p.id]: nextRole }));
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                                >
                                  <option value={TripRole.ADMIN}>🛡️ ADMIN (Co-Organizer)</option>
                                  <option value={TripRole.MEMBER}>🎒 MEMBER (Active Traveler)</option>
                                  <option value={TripRole.VIEWER}>👁️ VIEWER (Read-Only Guest)</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleMemberRoleChange(p.id, currentSelectedRole)}
                                  disabled={isSaving}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                    isSaved
                                      ? 'bg-emerald-600 text-white'
                                      : hasUnsavedRole
                                      ? 'bg-brand-600 hover:bg-brand-700 text-white ring-2 ring-brand-400'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                  title="Save Role Changes"
                                >
                                  {isSaving ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : isSaved ? (
                                    <>
                                      <Check className="w-3 h-3 text-white" />
                                      <span>Saved</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3 h-3" />
                                      <span>Save</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  p.role === 'OWNER'
                                    ? 'bg-amber-100 text-amber-800'
                                    : p.role === 'ADMIN'
                                    ? 'bg-blue-100 text-blue-800'
                                    : p.role === 'MEMBER'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {p.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {!isOwner && can('INVITE_MEMBERS') ? (
                              <button
                                onClick={() => handleRemoveMember(p.id)}
                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Activity */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-base text-slate-900">Add Activity to Day {selectedDay}</h3>
              <button
                type="button"
                onClick={() => setShowAddActivityModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="overflow-y-auto flex-1 my-4 space-y-3.5 text-xs pr-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batasia Loop War Memorial"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newActivity.startTime}
                    onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newActivity.endTime}
                    onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              {/* Location Name with Real-Time Geocoding Autocomplete */}
              <div className="relative">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Location Name / Venue *</span>
                  </span>
                  {isLoadingActivityLocations ? (
                    <span className="text-[10px] text-emerald-600 font-semibold animate-pulse flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Searching map...
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Live GPS Autocomplete</span>
                  )}
                </label>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annapurna Base Camp, Batasia Loop, Phewa Lake"
                    value={newActivity.locationName}
                    onChange={(e) => {
                      setNewActivity({ ...newActivity, locationName: e.target.value });
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => {
                      if (activityLocationSuggestions.length > 0) setShowLocationSuggestions(true);
                    }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 transition-all"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  {newActivity.locationName && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewActivity({ ...newActivity, locationName: '' });
                        setActivityLocationSuggestions([]);
                        setShowLocationSuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 p-0.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Real-time OpenStreetMap Suggestions Dropdown */}
                {showLocationSuggestions && activityLocationSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Mapped Locations & Landmarks</span>
                      <span className="text-emerald-600">OpenStreetMap</span>
                    </div>
                    {activityLocationSuggestions.map((place) => {
                      const parts = place.display_name.split(',');
                      const primary = parts[0].trim();
                      const secondary = parts.slice(1, 4).join(',').trim();
                      return (
                        <button
                          key={place.place_id}
                          type="button"
                          onClick={() => selectActivityLocation(place)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-start gap-2.5 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                            <Navigation className="w-3 h-3" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                              {primary}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {secondary || place.display_name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={newActivity.estimatedCost}
                  onChange={(e) => setNewActivity({ ...newActivity, estimatedCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingExpenseId ? 'Edit Group Expense' : 'Log Group Expense'}
                </h3>
                <p className="text-xs text-slate-500">Split automatically among trip crew</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="overflow-y-auto flex-1 my-4 space-y-3.5 text-xs pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glenary's Dinner, Innova Fuel, Museum Tickets"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Amount & Multi-Currency Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block font-bold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={newExpense.currency || 'INR'}
                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Currency Conversion Preview Badge (if foreign currency) */}
              {newExpense.currency && newExpense.currency !== 'INR' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] flex items-center justify-between">
                  <span>
                    Auto-converted: <strong>≈ ₹{formatExpenseAmount(convertCurrency(newExpense.amount, newExpense.currency, 'INR'))} INR</strong>
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold">
                    1 {newExpense.currency} = ₹{SUPPORTED_CURRENCIES[newExpense.currency]?.rateToInr}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="FOOD">🍔 FOOD & DINING</option>
                    <option value="ACCOMMODATION">🏨 HOTEL / STAY</option>
                    <option value="TRANSPORT">🚗 CAB & TRANSIT</option>
                    <option value="ACTIVITIES">🎟️ TICKETS & ENTRY</option>
                    <option value="SHOPPING">🛍️ SHOPPING</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid By</label>
                  <select
                    value={newExpense.paidById}
                    onChange={(e) => setNewExpense({ ...newExpense, paidById: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {members.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Receipt Photo Attachment Section */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-700">Receipt / Bill Attachment</label>
                {newExpense.receiptUrl ? (
                  <div className="relative p-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newExpense.receiptUrl}
                        alt="Receipt preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt attached</span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">Photo saved with expense record</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, receiptUrl: '' })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove receipt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 text-slate-600 text-xs font-bold cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Snap / Upload Receipt Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Split equally:</span>
                <strong className="text-slate-900 font-extrabold">
                  ₹{formatExpenseAmount((newExpense.currency !== 'INR' ? convertCurrency(newExpense.amount, newExpense.currency, 'INR') : newExpense.amount) / Math.max(1, members.length))} per traveler
                </strong>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingExpenseId ? 'Save Changes' : 'Save & Split Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Details Modal */}
      {showEditTripModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Edit Trip Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTripModal(false)}
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
                  value={editTripForm.name}
                  onChange={(e) => setEditTripForm({ ...editTripForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kathmandu, Nepal"
                  value={editTripForm.destination}
                  onChange={(e) => setEditTripForm({ ...editTripForm, destination: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editTripForm.startDate}
                    onChange={(e) => setEditTripForm({ ...editTripForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editTripForm.endDate}
                    onChange={(e) => setEditTripForm({ ...editTripForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={editTripForm.budget}
                    onChange={(e) => setEditTripForm({ ...editTripForm, budget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editTripForm.status}
                    onChange={(e) => setEditTripForm({ ...editTripForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  value={editTripForm.description}
                  onChange={(e) => setEditTripForm({ ...editTripForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditTripModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Emergency Contact */}
      {showAddEmergencyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Add Emergency Service</h3>
                  <p className="text-xs text-slate-500">Register rapid contact details for traveler safety</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEmergencyModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEmergencyContact} className="overflow-y-auto flex-1 my-4 space-y-4 text-xs pr-1">
              {/* Quick Category Chips */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quick Category Preset
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🏥 Hospital', rel: 'Primary Hospital & 24x7 Ambulance' },
                    { label: '👮 Police', rel: 'Tourist Police & Mountain Rescue' },
                    { label: '🏨 Hotel Desk', rel: 'Accommodation Front Desk & Host' },
                    { label: '🛡️ Insurance', rel: 'Group Travel Insurance Hotline' },
                    { label: '🏛️ Embassy', rel: 'Consulate & Diplomatic Emergency' },
                    { label: '🧭 Guide/Cab', rel: 'Local Transport & Guide Coordinator' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEmergencyForm({ ...emergencyForm, relationship: preset.rel })}
                      className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-all cursor-pointer ${
                        emergencyForm.relationship === preset.rel
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service / Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kathmandu CIWEC Clinic & Hospital"
                  value={emergencyForm.name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Relationship <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24/7 Casualty & Mountain Evacuation"
                  value={emergencyForm.relationship}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+977 1 4424111 or 112"
                    value={emergencyForm.phone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alt Phone / Policy Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Policy #TRIP-9988 or 108"
                    value={emergencyForm.altPhone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, altPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Address / Landmark & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Opposite British Embassy, Lazimpat. 24h Ambulance on call."
                  value={emergencyForm.notes}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50/70 border border-red-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyForm.isPrimary}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, isPrimary: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-red-900">
                  Mark as Primary Emergency SOS Contact
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddEmergencyModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Emergency Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Emergency Contact */}
      {showEditEmergencyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Emergency Contact</h3>
                  <p className="text-xs text-slate-500">Update safety provider or emergency numbers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditEmergencyModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEmergencyContact} className="overflow-y-auto flex-1 my-4 space-y-4 text-xs pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service / Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={emergencyForm.name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Relationship <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={emergencyForm.relationship}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={emergencyForm.phone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alt Phone / Policy Number
                  </label>
                  <input
                    type="text"
                    value={emergencyForm.altPhone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, altPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Address / Landmark & Notes
                </label>
                <textarea
                  rows={2}
                  value={emergencyForm.notes}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50/70 border border-red-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyForm.isPrimary}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, isPrimary: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-red-900">
                  Mark as Primary Emergency SOS Contact
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditEmergencyModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Update Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Traveler Phone Number */}
      {showEditMemberPhoneModal && editingMemberForPhone && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  📞
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingMemberForPhone.phone ? 'Edit Emergency Phone' : 'Add Emergency Phone'}
                  </h3>
                  <p className="text-xs text-slate-500">{editingMemberForPhone.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditMemberPhoneModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMemberPhone} className="overflow-y-auto flex-1 my-4 space-y-4 text-xs pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Traveler Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210 or +977 98..."
                  value={memberPhoneInput}
                  onChange={(e) => setMemberPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This contact number will be visible to all travelers in the emergency directory and offline print sheet.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 shrink-0">
                {editingMemberForPhone.phone ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditMemberPhoneModal(false);
                      handleDeleteMemberPhone(editingMemberForPhone);
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    Delete Number
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditMemberPhoneModal(false)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    Save Number
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE STICKY BOTTOM NAVIGATION DOCK (md:hidden) */}
      {/* ========================================================= */}
      <nav aria-label="Mobile trip navigation" className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 md:hidden shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* 1. Schedule / Itinerary Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('itinerary')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
              activeTab === 'itinerary' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'itinerary' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">Plan</span>
          </button>

          {/* 2. Expenses Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
              activeTab === 'expenses' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'expenses' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">Spend</span>
          </button>

          {/* 3. Center Elevated Quick Action (+) Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              type="button"
              onClick={() => setShowMobileQuickActions(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform flex items-center justify-center text-white"
              title="Quick Action Shortcut"
              aria-label="Quick Actions"
            >
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center hover:bg-transparent transition-colors">
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
            </button>
          </div>

          {/* 4. SOS Emergency Hub Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative transition-all ${
              activeTab === 'emergency' ? 'text-red-400 font-bold' : 'text-slate-400 hover:text-red-300'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'emergency' ? 'bg-red-500/20 text-red-400' : ''}`}>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-[10px] tracking-tight font-bold text-red-400">SOS Hub</span>
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </button>

          {/* 5. Members / Crew Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
              activeTab === 'members' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'members' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">Crew</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MOBILE QUICK ACTION BOTTOM SHEET */}
      {/* ========================================================= */}
      {showMobileQuickActions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="On-the-Road Quick Actions"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-0 md:hidden animate-in fade-in duration-200"
          onClick={() => setShowMobileQuickActions(false)}
        >
          <div
            className="w-full bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 text-white shadow-2xl animate-in slide-in-from-bottom-6 duration-300 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">On-The-Road Quick Actions</h3>
                <p className="text-xs text-slate-400">Fast 1-tap shortcuts for active travel</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileQuickActions(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Quick Expense */}
              {can('ADD_EXPENSE') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileQuickActions(false);
                    setShowAddExpenseModal(true);
                  }}
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-left flex flex-col justify-between gap-3 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Log Expense</h4>
                    <p className="text-[10px] text-emerald-300/80">Snap / split group bill</p>
                  </div>
                </button>
              )}

              {/* Quick Activity */}
              {can('ADD_ACTIVITY') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileQuickActions(false);
                    setShowAddActivityModal(true);
                  }}
                  className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-left flex flex-col justify-between gap-3 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Add Place / Stop</h4>
                    <p className="text-[10px] text-sky-300/80">Add to today's schedule</p>
                  </div>
                </button>
              )}

              {/* Emergency Mode */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setActiveTab('emergency');
                }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-left flex flex-col justify-between gap-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Emergency SOS</h4>
                  <p className="text-[10px] text-red-300/80">Direct dial police & doctor</p>
                </div>
              </button>

              {/* View Tasks */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setActiveTab('tasks');
                }}
                className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-left flex flex-col justify-between gap-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Trip Tasks</h4>
                  <p className="text-[10px] text-purple-300/80">Check packing & tickets</p>
                </div>
              </button>

              {/* View Document Vault */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setActiveTab('documents');
                }}
                className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-left flex flex-col justify-between gap-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Document Vault</h4>
                  <p className="text-[10px] text-teal-300/80">Flight, hotel & PNR tickets</p>
                </div>
              </button>

              {/* Crew Live Chat */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setShowCrewChat(true);
                }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-left flex flex-col justify-between gap-3 group transition-all col-span-2 sm:col-span-1"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Crew Live Chat</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h4>
                  <p className="text-[10px] text-emerald-300/80">Announcements & quick chat</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Crew Chat Button (Desktop Bottom Left) */}
      <button
        type="button"
        onClick={() => setShowCrewChat(true)}
        className="hidden md:flex fixed md:bottom-6 md:left-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl hover:shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all items-center gap-2.5 cursor-pointer backdrop-blur-md"
        title="Open Real-Time Crew Chat"
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
        <span className="text-xs font-black">Crew Chat</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/20 text-emerald-100">
          Live
        </span>
      </button>

      {/* 1-Tap UPI Settlement Modal */}
      {selectedUpiDebt && (
        <UPISettlementModal
          isOpen={!!selectedUpiDebt}
          onClose={() => setSelectedUpiDebt(null)}
          fromUser={selectedUpiDebt.from}
          toUser={selectedUpiDebt.to}
          amount={selectedUpiDebt.amount}
          tripName={displayTripName}
          onMarkSettled={() => {
            setSettledDebtIds({ ...settledDebtIds, [selectedUpiDebt.id]: true });
          }}
        />
      )}

      {/* Full-Screen Receipt Inspection Modal */}
      {selectedReceiptExpense && (
        <ReceiptPreviewModal
          isOpen={!!selectedReceiptExpense}
          onClose={() => setSelectedReceiptExpense(null)}
          receiptUrl={selectedReceiptExpense.receiptUrl}
          expenseTitle={selectedReceiptExpense.title}
          amount={selectedReceiptExpense.amount}
          currency={tripCurrency}
          payerName={selectedReceiptExpense.paidBy}
          category={selectedReceiptExpense.category}
        />
      )}

      {/* Real-Time Crew Chat Drawer */}
      <CrewChatDrawer
        isOpen={showCrewChat}
        onClose={() => setShowCrewChat(false)}
        tripId={params.id}
        tripName={displayTripName}
        currentUser={{
          id: user?.id || 'user-me',
          name: user?.fullName || 'You',
          role: currentRole,
        }}
        members={members}
      />

      {/* Real-Time Live Activity Feed & Push Notifications Drawer */}
      <LiveActivityFeedDrawer
        tripId={params.id}
        isOpen={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
        currentUser={user}
      />
    </div>
  );
}

export default function TripWorkspacePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Trip Workspace...</div>}>
      <TripWorkspaceContent params={params} />
    </Suspense>
  );
}
