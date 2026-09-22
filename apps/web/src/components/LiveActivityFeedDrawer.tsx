'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Calendar,
  Wallet,
  FileText,
  ShieldAlert,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  Plus,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

export interface TripActivityEvent {
  id: string;
  tripId: string;
  type: 'SCHEDULE_CHANGE' | 'NEW_EXPENSE' | 'DOC_UPLOAD' | 'EMERGENCY_UPDATE' | 'MEMBER_JOINED';
  title: string;
  description: string;
  actorName: string;
  timestamp: string;
  timeFormatted?: string;
}

// Global broadcast emitter for cross-tab / cross-device real-time sync
export function emitTripActivity(tripId: string, eventData: Omit<TripActivityEvent, 'id' | 'tripId' | 'timestamp'>) {
  if (typeof window === 'undefined') return;

  const newEvent: TripActivityEvent = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    tripId,
    timestamp: new Date().toISOString(),
    timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ...eventData,
  };

  // 1. Persist to trip event log
  try {
    const storageKey = `tripsync_activity_log_${tripId}`;
    const existing: TripActivityEvent[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = [newEvent, ...existing].slice(0, 50); // Keep latest 50 events
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to persist activity log:', err);
  }

  // 2. Broadcast to all active tabs/travelers
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`tripsync_channel_${tripId}`);
      channel.postMessage({ type: 'ACTIVITY_EVENT', event: newEvent });
      channel.close();
    }
  } catch (err) {
    console.warn('Failed to broadcast activity event:', err);
  }

  // 3. Dispatch local CustomEvent for current window
  window.dispatchEvent(new CustomEvent(`tripsync_local_event_${tripId}`, { detail: newEvent }));
}

interface LiveActivityFeedDrawerProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export function LiveActivityFeedDrawer({
  tripId,
  isOpen,
  onClose,
  currentUser,
}: LiveActivityFeedDrawerProps) {
  const [events, setEvents] = useState<TripActivityEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SCHEDULE' | 'EXPENSE' | 'SAFETY'>('ALL');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [liveToast, setLiveToast] = useState<TripActivityEvent | null>(null);

  // Load persisted activity events
  const loadEvents = () => {
    try {
      const storageKey = `tripsync_activity_log_${tripId}`;
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setEvents(saved);
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(`tripsync_channel_${tripId}`);
        channel.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'ACTIVITY_EVENT' && msg.data.event) {
            handleIncomingEvent(msg.data.event);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
    }

    const handleLocal = (e: any) => {
      if (e.detail) {
        handleIncomingEvent(e.detail);
      }
    };

    window.addEventListener(`tripsync_local_event_${tripId}`, handleLocal);

    return () => {
      if (channel) channel.close();
      window.removeEventListener(`tripsync_local_event_${tripId}`, handleLocal);
    };
  }, [tripId]);

  const handleIncomingEvent = (newEvent: TripActivityEvent) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === newEvent.id)) return prev;
      return [newEvent, ...prev];
    });

    setLiveToast(newEvent);
    setTimeout(() => {
      setLiveToast((current) => (current?.id === newEvent.id ? null : current));
    }, 4500);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newEvent.title, {
          body: `${newEvent.description} (by ${newEvent.actorName})`,
          icon: '/icon.svg',
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  };

  const handleRequestPush = async () => {
    haptic.medium();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
        haptic.success();
      }
    }
  };

  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'SCHEDULE') return e.type === 'SCHEDULE_CHANGE';
    if (activeFilter === 'EXPENSE') return e.type === 'NEW_EXPENSE';
    if (activeFilter === 'SAFETY') return e.type === 'EMERGENCY_UPDATE' || e.type === 'DOC_UPLOAD';
    return true;
  });

  const scheduleCount = events.filter((e) => e.type === 'SCHEDULE_CHANGE').length;
  const expenseCount = events.filter((e) => e.type === 'NEW_EXPENSE').length;
  const safetyCount = events.filter((e) => e.type === 'EMERGENCY_UPDATE' || e.type === 'DOC_UPLOAD').length;

  const getEventBadge = (type: TripActivityEvent['type']) => {
    switch (type) {
      case 'SCHEDULE_CHANGE':
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-sky-400" />,
          bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-400',
          label: 'Schedule Updated',
        };
      case 'NEW_EXPENSE':
        return {
          icon: <Wallet className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'Bill Logged',
        };
      case 'DOC_UPLOAD':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-teal-400" />,
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          dot: 'bg-teal-400',
          label: 'Vault Document',
        };
      case 'EMERGENCY_UPDATE':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
          label: 'Safety Alert',
        };
      default:
        return {
          icon: <Users className="w-3.5 h-3.5 text-purple-400" />,
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
          label: 'Crew Update',
        };
    }
  };

  return (
    <>
      {/* 1. Floating Live In-App Toast Alert (Pops up automatically for all active travelers) */}
      {liveToast && (
        <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-[70] w-full max-w-sm animate-in slide-in-from-top-3 duration-200 px-2 sm:px-0">
          <div className="p-4 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/80 text-white shadow-2xl backdrop-blur-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/40">
                {getEventBadge(liveToast.type).icon}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate">{liveToast.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                </div>
                <p className="text-xs text-slate-300 leading-snug line-clamp-2">{liveToast.description}</p>
                <p className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                  {liveToast.actorName} • {liveToast.timeFormatted || 'Just now'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setLiveToast(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Slide-out Activity Feed Drawer / Mobile Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-stretch sm:justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 text-white flex flex-col h-[85vh] sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 overflow-hidden">
            
            {/* Mobile Top Grab Bar */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">Crew Activity</h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Real-time trip updates</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!pushEnabled ? (
                  <button
                    type="button"
                    onClick={handleRequestPush}
                    title="Enable browser notifications"
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-[11px] font-bold border border-white/10 transition-colors cursor-pointer"
                  >
                    Alerts
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    ✓ Alerts On
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    onClose();
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
              {[
                { id: 'ALL', label: 'All', count: events.length },
                { id: 'SCHEDULE', label: '📅 Schedule', count: scheduleCount },
                { id: 'EXPENSE', label: '💳 Bills', count: expenseCount },
                { id: 'SAFETY', label: '🛡️ SOS & Vault', count: safetyCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setActiveFilter(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-black'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        activeFilter === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Event Timeline List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="py-12 sm:py-16 text-center space-y-4 px-4">
                  <div className="relative w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/80 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
                    <Compass className="w-8 h-8 animate-[spin_12s_linear_infinite]" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">All quiet on the expedition 🏕️</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Any time someone in your crew schedules a stop, logs an expense, or updates contacts, updates will stream right here.
                    </p>
                  </div>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const badge = getEventBadge(evt.type);
                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {evt.timeFormatted || new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="space-y-1 pl-1">
                        <h4 className="text-xs font-bold text-white leading-snug">{evt.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pl-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[9px]">
                            {evt.actorName[0]?.toUpperCase() || 'T'}
                          </span>
                          <span>by <strong className="text-emerald-400 font-semibold">{evt.actorName}</strong></span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Synced</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="text-[11px] font-semibold">{filteredEvents.length} updates logged</span>
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    haptic.warning();
                    localStorage.removeItem(`tripsync_activity_log_${tripId}`);
                    setEvents([]);
                  }}
                  className="text-[11px] text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
