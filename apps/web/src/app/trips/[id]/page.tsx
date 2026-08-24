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
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth, canForRole } from '@/lib/auth-context';
import { TripRole } from '@tripsync/types';
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

type ActiveTab = 'overview' | 'itinerary' | 'expenses' | 'tasks' | 'emergency' | 'analytics' | 'members';

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

const INITIAL_MEMBERS: MemberState[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Rahul Sharma', role: TripRole.OWNER, phone: '+91 98765 43210' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Shubham Verma', role: TripRole.ADMIN, phone: '+91 98765 43211' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Priya Patel', role: TripRole.MEMBER, phone: '+91 98765 43212' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Amit Kumar', role: TripRole.MEMBER, phone: '+91 98765 43213' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Sneha Reddy', role: TripRole.MEMBER, phone: '+91 98765 43214' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Arjun Mehta', role: TripRole.MEMBER, phone: '+91 98765 43215' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Ananya Sen', role: TripRole.VIEWER, phone: '+91 98765 43299' },
];

function TripWorkspaceContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  // Persona impersonation removed - there is no more "demo session"; every
  // logged-in user is a real authenticated account. This flag was previously
  // used to switch between hardcoded demo trip data and the real API - now
  // it's fixed at true only for the seeded sample trip ID, false for every
  // real trip.
  const isDemoSession = params.id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const [tripDetails, setTripDetails] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Members list with dynamic roles
  const [members, setMembers] = useState<MemberState[]>(INITIAL_MEMBERS);

  // Role is derived from this trip's real member list matched against the
  // logged-in user - never from a client-chosen persona. (The member list
  // itself is still seeded/local-storage-backed pending the real
  // GET /trips/:id/members wiring - see TODO further down.) The backend
  // re-checks every mutation regardless of what `can()` returns here.
  const myMembership = members.find((m) => m.id === user?.id);
  const currentRole: TripRole = myMembership?.role ?? TripRole.VIEWER;
  const can = (permission: Parameters<typeof canForRole>[1]) => canForRole(currentRole, permission);

  const [membersReady, setMembersReady] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TripRole>(TripRole.MEMBER);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<{ id: string; name: string; phone: string; relationship: string }[]>([]);
  const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', phone: '', relationship: '' });
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoSession || typeof window === 'undefined') return;

    try {
      const storedTrips = JSON.parse(localStorage.getItem('tripsync_trips') || '[]');
      const selectedTrip = Array.isArray(storedTrips)
        ? storedTrips.find((trip) => trip.id === params.id)
        : null;
      setTripDetails(selectedTrip || null);
    } catch {
      setTripDetails(null);
    }
  }, [isDemoSession, params.id]);

  useEffect(() => {
    if (isDemoSession) return;

    api.getTripById(params.id).then((trip) => {
      setTripDetails(trip);
      const apiMembers = (trip.members || []).map((member: any) => ({
        id: member.userId || member.user?.id,
        name: member.user?.fullName || member.user?.email || 'Trip Member',
        role: member.role,
        phone: member.user?.phone || '',
      }));
      if (apiMembers.length) setMembers(apiMembers);

      const apiDays = (trip.days || []).map((day: any) => ({
        id: day.id,
        num: day.dayNumber,
        date: day.date,
        label: day.title || `Day ${day.dayNumber}`,
      }));
      if (apiDays.length) setTripDays(apiDays);

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
      setEmergencyContacts((trip.emergencyContacts || []).map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
      })));
    }).catch(() => {
      // Local-only trips continue using their local fallback state.
    });
  }, [isDemoSession, params.id]);

  // Itinerary state
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [tripDays, setTripDays] = useState<TripDayState[]>([]);
  const [tripDaysReady, setTripDaysReady] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayLabel, setNewDayLabel] = useState('');
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
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
    locationName: 'Darjeeling Mall',
    estimatedCost: 1000,
    responsibleMemberId: INITIAL_MEMBERS[0].id,
  });
  const [activitiesReady, setActivitiesReady] = useState(false);

  // Expense & Split state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expensesReady, setExpensesReady] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([
    {
      id: 'exp-1',
      title: 'Summit Hermon Hotel Advance Booking',
      paidBy: 'Rahul Sharma',
      amount: 6000,
      category: 'ACCOMMODATION',
      date: '2026-09-10',
      split: '6 members (₹1,000 each)',
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
    },
  ]);

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 1800,
    category: 'FOOD',
    paidById: INITIAL_MEMBERS[0].id,
    splitType: 'EQUAL',
  });

  // Settled debts local state
  const [settledDebtIds, setSettledDebtIds] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const tripMembersKey = `tripsync_trip_members_${params.id}`;
    if (!isDemoSession) {
      const owner = user
        ? { id: user.id, name: user.fullName || user.email, role: TripRole.OWNER, phone: user.phone || '' }
        : { id: 'owner-current-user', name: 'Trip Owner', role: TripRole.OWNER, phone: '' };

      let savedMembers: MemberState[] = [];
      try {
        const storedMembers = JSON.parse(localStorage.getItem(tripMembersKey) || '[]');
        if (Array.isArray(storedMembers)) savedMembers = storedMembers;
      } catch {
        savedMembers = [];
      }

      const seededMemberIds = new Set(INITIAL_MEMBERS.map((member) => member.id));
      savedMembers = savedMembers.filter((member) => !seededMemberIds.has(member.id));

      const savedOwner = savedMembers.find((member) => member.role === TripRole.OWNER);
      const restoredMembers = savedOwner
        ? savedMembers
        : [owner, ...savedMembers.filter((member) => member.id !== owner.id)];
      setMembers(restoredMembers);
      localStorage.setItem(tripMembersKey, JSON.stringify(restoredMembers));
      setMembersReady(true);
      setSettledDebtIds({});
      return;
    }

    const stored = localStorage.getItem(tripMembersKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          setMembersReady(true);
          return;
        }
      } catch (error) {
        console.warn('Failed to restore trip members:', error);
      }
    }

    setMembers(INITIAL_MEMBERS);
    localStorage.setItem(tripMembersKey, JSON.stringify(INITIAL_MEMBERS));
    setMembersReady(true);
  }, [isDemoSession, params.id, user]);

  useEffect(() => {
    if (!membersReady) return;
    localStorage.setItem(`tripsync_trip_members_${params.id}`, JSON.stringify(members));
  }, [members, membersReady, params.id]);

  useEffect(() => {
    if (isDemoSession) {
      setExpensesReady(true);
      return;
    }

    try {
      const storedExpenses = JSON.parse(localStorage.getItem(`tripsync_expenses_${params.id}`) || '[]');
      setExpensesList(Array.isArray(storedExpenses) ? storedExpenses : []);
    } catch {
      setExpensesList([]);
    }
    setExpensesReady(true);
  }, [isDemoSession, params.id]);

  useEffect(() => {
    if (!expensesReady) return;
    localStorage.setItem(`tripsync_expenses_${params.id}`, JSON.stringify(expensesList));
  }, [expensesList, expensesReady, params.id]);

  useEffect(() => {
    if (isDemoSession) {
      setActivitiesReady(true);
      return;
    }

    try {
      const storedActivities = JSON.parse(localStorage.getItem(`tripsync_activities_${params.id}`) || '[]');
      setActivitiesList(Array.isArray(storedActivities) ? storedActivities : []);
    } catch {
      setActivitiesList([]);
    }
    setActivitiesReady(true);
  }, [isDemoSession, params.id]);

  useEffect(() => {
    if (!activitiesReady) return;
    localStorage.setItem(`tripsync_activities_${params.id}`, JSON.stringify(activitiesList));
  }, [activitiesList, activitiesReady, params.id]);

  const [tasksReady, setTasksReady] = useState(false);

  useEffect(() => {
    if (isDemoSession) {
      setTasksReady(true);
      return;
    }

    try {
      const storedTasks = JSON.parse(localStorage.getItem(`tripsync_tasks_${params.id}`) || '[]');
      setTasks(Array.isArray(storedTasks) ? storedTasks : []);
    } catch {
      setTasks([]);
    }
    setTasksReady(true);
  }, [isDemoSession, params.id]);

  useEffect(() => {
    if (!tasksReady) return;
    localStorage.setItem(`tripsync_tasks_${params.id}`, JSON.stringify(tasks));
  }, [params.id, tasks, tasksReady]);

  useEffect(() => {
    const savedDays = localStorage.getItem(`tripsync_trip_days_${params.id}`);
    if (savedDays) {
      try {
        const parsedDays = JSON.parse(savedDays);
        if (Array.isArray(parsedDays) && parsedDays.length > 0) {
          setTripDays(parsedDays);
          setTripDaysReady(true);
          return;
        }
      } catch {
        localStorage.removeItem(`tripsync_trip_days_${params.id}`);
      }
    }

    if (!isDemoSession && tripDetails?.days?.length) return;
    setTripDays([]);
    setTripDaysReady(true);
  }, [isDemoSession, params.id, tripDetails]);

  useEffect(() => {
    if (!tripDaysReady) return;
    localStorage.setItem(`tripsync_trip_days_${params.id}`, JSON.stringify(tripDays));
  }, [params.id, tripDays, tripDaysReady]);

  useEffect(() => {
    const stored = localStorage.getItem(`tripsync_emergency_contacts_${params.id}`);
    if (stored) {
      try {
        setEmergencyContacts(JSON.parse(stored));
      } catch {
        setEmergencyContacts([]);
      }
    }
  }, [params.id]);

  useEffect(() => {
    localStorage.setItem(`tripsync_emergency_contacts_${params.id}`, JSON.stringify(emergencyContacts));
  }, [emergencyContacts, params.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const showPermissionWarning = (actionName: string) => {
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
    } catch {
      setActivitiesList((current) => [...current, newAct]);
    }
    setShowAddActivityModal(false);
    setNewActivity({
      title: '',
      description: '',
      startTime: '10:00',
      endTime: '12:00',
      locationName: 'Darjeeling Mall',
      estimatedCost: 1000,
      responsibleMemberId: INITIAL_MEMBERS[0].id,
    });
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
    const newEntry = {
      id: 'exp-' + Date.now(),
      paidById: payerId,
      title: newExpense.title || 'Group Expense',
      paidBy: payer,
      amount: Number(newExpense.amount),
      category: newExpense.category,
      date: tripDetails?.startDate || new Date().toISOString().slice(0, 10),
      participants: members.map((member) => ({
        userId: member.id,
        shareAmount: Number(newExpense.amount) / Math.max(1, members.length),
      })),
      split: `${members.length} members (₹${Math.round(Number(newExpense.amount) / Math.max(1, members.length))} each)`,
    };
    try {
      const validMembers = members.filter((member) => /^[0-9a-f-]{36}$/i.test(member.id));
      const amount = Number(newExpense.amount);
      const saved = await api.createExpense(params.id, {
        title: newEntry.title,
        amount,
        currency: tripCurrency,
        category: newExpense.category,
        splitType: newExpense.splitType,
        date: newEntry.date,
        participants: validMembers.map((member) => ({
          userId: member.id,
          shareAmount: Math.round((amount / validMembers.length) * 100) / 100,
        })),
      });
      setExpensesList((current) => [{ ...newEntry, id: saved.id || newEntry.id }, ...current]);
    } catch {
      setExpensesList((current) => [newEntry, ...current]);
    }
    setShowAddExpenseModal(false);
    setNewExpense({
      title: '',
      amount: 1800,
      category: 'FOOD',
      paidById: user?.id || members[0]?.id || '',
      splitType: 'EQUAL',
    });
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
      } catch {
        // Keep optimistic state when the API is unavailable.
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
    } catch {
      setTasks((current) => [localTask, ...current]);
    }
    setNewTask({ title: '', dueDate: '', priority: 'MEDIUM', assignedToId: '' });
  };

  const handleMemberRoleChange = (memberId: string, newRole: TripRole) => {
    if (!can('MANAGE_ROLES')) {
      showPermissionWarning('change member roles');
      return;
    }

    // Admins cannot change Owner's role
    const targetMember = members.find((m) => m.id === memberId);
    if (targetMember?.role === TripRole.OWNER && currentRole !== TripRole.OWNER) {
      setActionAlert('Security Violation: Only the Trip Owner can modify ownership privileges.');
      setTimeout(() => setActionAlert(null), 4000);
      return;
    }

    setMembers(
      members.map((m) => {
        if (m.id === memberId) {
          return { ...m, role: newRole };
        }
        return m;
      })
    );

    setActionAlert(`Updated ${targetMember?.name}'s role to ${newRole}.`);
    setTimeout(() => setActionAlert(null), 3000);
  };

  const handleRemoveMember = (memberId: string) => {
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

    setMembers(members.filter((m) => m.id !== memberId));
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

    try {
      const invitation = await api.inviteMember(params.id, { email, role: newMemberRole });
      setMembers((current) => [
        ...current,
        {
          id: invitation.id || `invite-${Date.now()}`,
          name: email.split('@')[0].replace(/[._-]/g, ' '),
          role: newMemberRole,
          phone: email,
        },
      ]);
      setNewMemberEmail('');
      setNewMemberRole(TripRole.MEMBER);
      setLastInviteLink(invitation.inviteLink);
      setInviteStatus(`Invitation created for ${email}. Share the password setup link with them.`);
      await navigator.clipboard?.writeText(invitation.inviteLink);
      setActionAlert(`Invitation link copied for ${email}.`);
    } catch (error: any) {
      setInviteStatus(error.message || 'Unable to create invitation.');
    }
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleAddEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmergencyContact.name.trim() || !newEmergencyContact.phone.trim() || !newEmergencyContact.relationship.trim()) {
      setEmergencyStatus('Enter a name, phone number, and relationship.');
      return;
    }

    const newContact = { id: `emergency-${Date.now()}`, ...newEmergencyContact };
    try {
      const saved = await api.createEmergencyContact(params.id, newEmergencyContact);
      setEmergencyContacts((current) => [...current, { ...newContact, id: saved.id || newContact.id }]);
    } catch {
      setEmergencyContacts((current) => [...current, newContact]);
    }
    setNewEmergencyContact({ name: '', phone: '', relationship: '' });
    setEmergencyStatus('Emergency contact saved.');
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
    } catch {
      // Keep the day available locally for local-only trips.
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
      } catch {
        // Continue removing the local view when the API is unavailable.
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

  const categoryChartData = isDemoSession ? [
    { name: 'Hotel', value: 6000, color: '#22c55e' },
    { name: 'Food & Dining', value: 3200, color: '#0ea5e9' },
    { name: 'Transport & Cab', value: 2400, color: '#f59e0b' },
  ] : [];

  const memberSpendingData = isDemoSession ? [
    { name: 'Rahul S.', paid: 6000, share: 1933 },
    { name: 'Priya P.', paid: 3200, share: 1933 },
    { name: 'Shubham V.', paid: 2400, share: 1933 },
    { name: 'Amit K.', paid: 0, share: 1933 },
    { name: 'Sneha R.', paid: 0, share: 1933 },
    { name: 'Arjun M.', paid: 0, share: 1933 },
  ] : [];

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
    <div className="min-h-full pb-16">
      {/* ========================================================= */}
      {/* INTERACTIVE RBAC ROLE SIMULATOR BANNER */}
      {/* ========================================================= */}
      <div className="bg-slate-950 text-white border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Active RBAC Persona:</span>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                    currentRole === 'OWNER'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : currentRole === 'ADMIN'
                      ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
                      : currentRole === 'MEMBER'
                      ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-purple-400/20 text-purple-300 border border-purple-400/40'
                  }`}
                >
                  {user?.fullName || 'Traveler'} • {currentRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentRole === 'OWNER' && '👑 Full Access: Manage all settings, roles, delete trip, full CRUD.'}
                {currentRole === 'ADMIN' && '🛡️ Admin Access: Manage itinerary, expenses, tasks & members. Trip deletion locked.'}
                {currentRole === 'MEMBER' && '👥 Traveler Access: Log group expenses, suggest activities, resolve tasks.'}
                {currentRole === 'VIEWER' && '👁️ Read-Only Mode: View schedules & emergency info. All mutation actions disabled.'}
              </p>
            </div>
          </div>
        </div>
      </div>

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
              <div className="flex items-center gap-2 mb-2">
                {isDemoSession && <>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                    🏔️ Mountain Expedition
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    🌤️ 18°C Sunny in Darjeeling
                  </span>
                </>}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {displayTripName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 mt-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>{displayDestination}</span>
                <span>•</span>
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{displayDates}</span>
              </p>
            </div>

            {/* Quick Spend Counter */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
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

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 sm:gap-2 mt-8 overflow-x-auto no-scrollbar border-b border-white/10 pb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'itinerary', label: 'Itinerary', icon: Calendar },
              { id: 'expenses', label: 'Expenses & Splits', icon: Wallet },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'emergency', label: '🆘 Emergency Mode', icon: ShieldAlert, highlight: true },
              { id: 'analytics', label: 'Analytics', icon: PieChartIcon },
              { id: 'members', label: `Members (${members.length})`, icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all ${
                    tab.highlight
                      ? isActive
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'text-red-400 hover:text-white hover:bg-red-950/60'
                      : isActive
                      ? 'bg-white text-slate-900 shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            {/* Day Selector Pills & Action */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 overflow-x-auto">
                {tripDays.map((d) => (
                  <button
                    key={d.num}
                    onClick={() => setSelectedDay(d.num)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDay === d.num
                        ? 'bg-brand-600 text-white shadow-md'
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

              <div className="flex items-center gap-2">
                {can('EDIT_TRIP') && (
                  <form onSubmit={handleAddDay} className="flex items-center gap-1.5">
                    <input
                      type="date"
                      required
                      value={newDayDate}
                      onChange={(event) => setNewDayDate(event.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                      aria-label="New itinerary day date"
                    />
                    <input
                      value={newDayLabel}
                      onChange={(event) => setNewDayLabel(event.target.value)}
                      placeholder="Day title"
                      className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                      aria-label="New itinerary day title"
                    />
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      <Plus className="h-3.5 w-3.5" />
                      Add day
                    </button>
                  </form>
                )}
                {can('EDIT_TRIP') && tripDays.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteDay}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete day
                  </button>
                )}
                {can('ADD_ACTIVITY') ? (
                  <button
                    onClick={() => setShowAddActivityModal(true)}
                    disabled={tripDays.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Activity</span>
                  </button>
                ) : (
                  <button
                    onClick={() => showPermissionWarning('add activities (Viewer role is read-only)')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Add Activity (Read-Only)</span>
                  </button>
                )}
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
                    <div key={act.id} className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 ring-4 ring-white" />
                      <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {act.time}
                          </span>
                          <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                            {act.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mt-1">{act.title}</h3>
                        <p className="text-xs text-slate-600 mt-1">{act.description}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                          <span>📍 {act.location}</span>
                          <span>👤 {act.responsible}</span>
                          <span>💰 Est: ₹{act.cost.toLocaleString()}</span>
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
                        {can('ADD_EXPENSE') ? (
                          <button
                            onClick={() => setSettledDebtIds({ ...settledDebtIds, [dt.id]: !isSettled })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                              isSettled
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/10 hover:bg-brand-500 text-slate-200 hover:text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isSettled ? 'Settled' : 'Mark Paid'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {debtTransfers.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-slate-400">No outstanding settlements.</p>
                )}
              </div>
            </div>

            {/* Expense Log Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                Logged Expenses ({expensesList.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Title & Category</th>
                      <th className="pb-3">Paid By</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Split Details</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesList.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5">
                          <p className="font-bold text-slate-900">{exp.title}</p>
                          <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-slate-700">{exp.paidBy}</td>
                        <td className="py-3.5 text-slate-500">{exp.date}</td>
                        <td className="py-3.5 text-slate-600">{exp.split}</td>
                        <td className="py-3.5 text-right font-extrabold text-slate-900">
                          ₹{exp.amount.toLocaleString()}
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
              <form onSubmit={handleAddTask} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Task</label>
                  <input required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Task to complete" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Assignee</label>
                  <select value={newTask.assignedToId} onChange={(event) => setNewTask({ ...newTask, assignedToId: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Unassigned</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Due date</label>
                  <input type="date" value={newTask.dueDate} onChange={(event) => setNewTask({ ...newTask, dueDate: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Priority</label>
                  <select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                  </select>
                </div>
                <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Add task</button>
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
        {/* 5. EMERGENCY MODE TAB */}
        {/* ========================================================= */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            {/* Alert Banner */}
            <div className="bg-red-600 text-white rounded-2xl p-6 shadow-xl border-2 border-red-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <ShieldAlert className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                    Emergency Safety Dashboard
                  </h2>
                  <p className="text-xs sm:text-sm text-red-100">
                    High-contrast, offline-ready emergency contact information for Darjeeling trip.
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hospital */}
              <div className="bg-white rounded-2xl p-5 border-2 border-red-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-red-100 text-red-700 font-bold">🏥</span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Darjeeling Sadar District Hospital</h3>
                      <p className="text-xs text-slate-500 font-medium">24/7 Casualty, Ambulance & Blood Bank</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded">
                    PRIMARY
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  Located near Bhanu Bhakta Sarani & Raj Bhavan, Darjeeling.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href="tel:+913542252218"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call: +91 354 225 2218</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard('+913542252218')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText === '+913542252218' ? 'Copied!' : 'Copy Phone'}</span>
                  </button>
                </div>
              </div>

              {/* Police */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-100 text-blue-700 font-bold">👮</span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Tourist Police & Chowrasta Station</h3>
                      <p className="text-xs text-slate-500 font-medium">Mountain Safety & Lost Documents</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  Assistance booth located right at Chowrasta Mall Center.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href="tel:+913542254422"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call: +91 354 225 4422</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard('+913542254422')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText === '+913542254422' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Accommodation */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold">🏨</span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Summit Hermon Hotel Front Desk</h3>
                      <p className="text-xs text-slate-500 font-medium">Group Accommodation & Driver Desk</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  Address: Bhanu Sarani, Darjeeling. Booking ID: SH-2026-DARJ-8941
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href="tel:+913542256789"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Desk: +91 354 225 6789</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard('Summit Hermon Hotel, Bhanu Sarani, Darjeeling 734101')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Address</span>
                  </button>
                </div>
              </div>

              {/* Insurance */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-100 text-purple-700 font-bold">🛡️</span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Group Travel Insurance</h3>
                      <p className="text-xs text-slate-500 font-medium">Policy #BA-TRIP-998822 (Bajaj Allianz)</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  Emergency Medical Evacuation & Hospital Cashless Assistance active.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href="tel:18002095858"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Toll-Free: 1800 209 5858</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard('BA-TRIP-998822')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Policy #</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-base text-slate-900">Personal Emergency Contacts</h3>
              <form onSubmit={handleAddEmergencyContact} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Name</label>
                  <input required value={newEmergencyContact.name} onChange={(event) => setNewEmergencyContact({ ...newEmergencyContact, name: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Emergency contact name" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Phone</label>
                  <input required type="tel" value={newEmergencyContact.phone} onChange={(event) => setNewEmergencyContact({ ...newEmergencyContact, phone: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Relationship</label>
                  <input required value={newEmergencyContact.relationship} onChange={(event) => setNewEmergencyContact({ ...newEmergencyContact, relationship: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Parent, partner..." />
                </div>
                <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Save contact</button>
              </form>
              {emergencyStatus && <p className="mt-3 text-sm text-emerald-700">{emergencyStatus}</p>}
              {emergencyContacts.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                      <span><strong>{contact.name}</strong> <span className="text-slate-500">({contact.relationship})</span></span>
                      <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="font-semibold text-red-700">{contact.phone}</a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Travelers Phone Sheet */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                All Travelers Emergency Phone Directory
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {members.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{p.name}</p>
                      <p className="text-slate-400 text-[11px]">{p.phone}</p>
                    </div>
                    <a
                      href={`tel:${p.phone.replace(/\s+/g, '')}`}
                      className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
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
                  Member Paid vs Equal Share (₹1,933)
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberSpendingData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                      <Bar dataKey="paid" fill="#22c55e" radius={[4, 4, 0, 0]} name="Paid" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Rahul, Priya, and Shubham fronted the costs for hotel, cabs, and meals.
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

              {can('INVITE_MEMBERS') ? (
                <button
                  onClick={() => lastInviteLink && copyToClipboard(lastInviteLink)}
                  disabled={!lastInviteLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedText === lastInviteLink ? 'Link Copied!' : 'Copy Latest Invite Link'}</span>
                </button>
              ) : (
                <button
                  onClick={() => showPermissionWarning('invite new members')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Invite Locked (Admins Only)</span>
                </button>
              )}
            </div>

            <form onSubmit={handleAddMember} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_200px_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Member email</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="name@example.com"
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
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  Add member
                </button>
              </div>

              {inviteStatus && (
                <p className="mt-3 text-sm text-emerald-700">{inviteStatus}</p>
              )}
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center">
                              {p.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-500">Joined via Invitation</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{p.phone}</td>
                        <td className="py-3.5 px-4">
                          {canEditThisRole && !isOwner ? (
                            <select
                              value={p.role}
                              onChange={(e) => handleMemberRoleChange(p.id, e.target.value as TripRole)}
                              className="px-2 py-1 rounded-lg border border-slate-300 font-bold text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                              <option value={TripRole.ADMIN}>ADMIN (Co-Organizer)</option>
                              <option value={TripRole.MEMBER}>MEMBER (Active Traveler)</option>
                              <option value={TripRole.VIEWER}>VIEWER (Read-Only Guest)</option>
                            </select>
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
        )}
      </div>

      {/* Modal: Add Activity */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Activity to Day {selectedDay}</h3>
            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batasia Loop War Memorial"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newActivity.startTime}
                    onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newActivity.endTime}
                    onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Name</label>
                <input
                  type="text"
                  placeholder="e.g. Batasia Loop, Darjeeling"
                  value={newActivity.locationName}
                  onChange={(e) => setNewActivity({ ...newActivity, locationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={newActivity.estimatedCost}
                  onChange={(e) => setNewActivity({ ...newActivity, estimatedCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Group Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tea Estate Lunch & Snacks"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="FOOD">FOOD & DINING</option>
                    <option value="ACCOMMODATION">HOTEL</option>
                    <option value="TRANSPORT">CAB & TRANSPORT</option>
                    <option value="ACTIVITIES">TICKETS & ENTRY</option>
                    <option value="SHOPPING">SHOPPING</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paid By</label>
                <select
                  value={newExpense.paidById}
                  onChange={(e) => setNewExpense({ ...newExpense, paidById: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {members.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Split equally among all {members.length} active travelers (₹{Math.round(newExpense.amount / members.length)} per person).
              </p>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow"
                >
                  Save & Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
