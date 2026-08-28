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
} from 'lucide-react';

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
  const [soundEnabled, setSoundEnabled] = useState(true);
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

    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }

    // Set up real-time BroadcastChannel listener
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

    // Set up local custom event listener
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

    // Trigger in-app live toast
    setLiveToast(newEvent);
    setTimeout(() => {
      setLiveToast((current) => (current?.id === newEvent.id ? null : current));
    }, 4500);

    // Browser Web Notification (if permission granted)
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
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
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

  const getEventBadge = (type: TripActivityEvent['type']) => {
    switch (type) {
      case 'SCHEDULE_CHANGE':
        return {
          icon: <Calendar className="w-4 h-4 text-sky-400" />,
          bg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          label: 'Schedule Updated',
        };
      case 'NEW_EXPENSE':
        return {
          icon: <Wallet className="w-4 h-4 text-emerald-400" />,
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          label: 'Bill Logged',
        };
      case 'DOC_UPLOAD':
        return {
          icon: <FileText className="w-4 h-4 text-teal-400" />,
          bg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
          label: 'Vault Document',
        };
      case 'EMERGENCY_UPDATE':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
          bg: 'bg-red-500/20 text-red-400 border-red-500/30',
          label: 'Emergency SOS',
        };
      default:
        return {
          icon: <Users className="w-4 h-4 text-slate-400" />,
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'Crew Update',
        };
    }
  };

  return (
    <>
      {/* 1. Floating Live In-App Toast Alert (Pops up automatically for all travelers) */}
      {liveToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[70] w-full max-w-sm animate-in slide-in-from-top-3 duration-200">
          <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 text-white shadow-2xl backdrop-blur-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                {getEventBadge(liveToast.type).icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">{liveToast.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">{liveToast.description}</p>
                <p className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                  by {liveToast.actorName} • {liveToast.timeFormatted || 'Just now'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLiveToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Slide-out Activity Feed Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">Live Activity Feed</h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Real-time collaboration audit log</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!pushEnabled && (
                  <button
                    type="button"
                    onClick={handleRequestPush}
                    title="Enable browser notifications"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Enable Push
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
              {[
                { id: 'ALL', label: 'All Activities' },
                { id: 'SCHEDULE', label: '📅 Schedule' },
                { id: 'EXPENSE', label: '💳 Spending' },
                { id: 'SAFETY', label: '🛡️ Safety & Vault' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Event Timeline List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No activity yet</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    When anyone edits the itinerary, logs expenses, or uploads travel vouchers, updates will sync here in real time.
                  </p>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const badge = getEventBadge(evt.type);
                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {evt.timeFormatted || new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white">{evt.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{evt.description}</p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/50">
                        <span>Updated by <strong className="text-emerald-400 font-semibold">{evt.actorName}</strong></span>
                        <span className="flex items-center gap-1 text-emerald-400">
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
              <span>{filteredEvents.length} events logged in this trip</span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(`tripsync_activity_log_${tripId}`);
                  setEvents([]);
                }}
                className="text-[11px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
