'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Pin,
  Sparkles,
  Users,
  Smile,
  Shield,
  Clock,
  Radio,
  CheckCheck,
  Megaphone,
  Trash2,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  isAnnouncement?: boolean;
  avatarLetter?: string;
}

interface CrewChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  currentUser: { id: string; name: string; role?: string };
  members: Array<{ id: string; name: string; role: string }>;
}

export function CrewChatDrawer({
  isOpen,
  onClose,
  tripId,
  tripName,
  currentUser,
  members,
}: CrewChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [asAnnouncement, setAsAnnouncement] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const storageKey = `tripsync_chat_${tripId}`;

  // Load real messages for this specific trip from persistent storage
  useEffect(() => {
    if (!tripId) return;

    const loadMessages = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          }
        } else {
          // Clean empty state - NO mock static data
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
    };

    loadMessages();

    // 1. Setup real-time BroadcastChannel for instantaneous sync across all tabs/windows
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`tripsync_realtime_chat_${tripId}`);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_CHAT_MESSAGE') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === event.data.message.id)) return prev;
            return [...prev, event.data.message];
          });
        } else if (event.data?.type === 'CLEAR_CHAT_MESSAGES') {
          setMessages([]);
        }
      };
    }

    // 2. Storage event listener for multi-tab fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      broadcastChannelRef.current?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [tripId, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const saveAndBroadcastMessages = (updated: ChatMessage[], newMsg?: ChatMessage) => {
    setMessages(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    if (newMsg && broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'NEW_CHAT_MESSAGE',
        message: newMsg,
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role || 'MEMBER',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      isAnnouncement: asAnnouncement,
      avatarLetter: (currentUser.name || 'U').trim()[0]?.toUpperCase() || 'U',
    };

    const updated = [...messages, newMsg];
    saveAndBroadcastMessages(updated, newMsg);
    setInputText('');
    setAsAnnouncement(false);
  };

  const sendQuickChip = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role || 'MEMBER',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      avatarLetter: (currentUser.name || 'U').trim()[0]?.toUpperCase() || 'U',
    };

    const updated = [...messages, newMsg];
    saveAndBroadcastMessages(updated, newMsg);
  };

  const handleClearChat = () => {
    if (confirm('Clear chat history for this trip?')) {
      saveAndBroadcastMessages([]);
      broadcastChannelRef.current?.postMessage({ type: 'CLEAR_CHAT_MESSAGES' });
    }
  };

  // Find latest announcement
  const pinnedAnnouncement = messages.filter((m) => m.isAnnouncement).slice(-1)[0];

  const quickChips = [
    '🚕 Cab has arrived!',
    '📍 Reached destination',
    '☕ Quick Chai stop (10 min)',
    '💳 Bill paid & split logged',
    '🎒 Ready in hotel lobby',
    '📸 View photos shared',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative z-10 w-full max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white truncate max-w-[200px]">
                  Crew Live Chat
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Realtime
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {tripName} • {members.length} Traveler{members.length === 1 ? '' : 's'} Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                title="Clear chat"
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Announcement Bar (if any) */}
        {pinnedAnnouncement && (
          <div className="p-3 bg-gradient-to-r from-amber-950/50 via-slate-950 to-amber-950/50 border-b border-amber-500/40 flex items-start gap-2.5 shrink-0">
            <Pin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-black uppercase tracking-wider">
                <span>Pinned Announcement</span>
                <span className="text-slate-400 font-medium">{pinnedAnnouncement.senderName}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-snug mt-0.5">
                {pinnedAnnouncement.content}
              </p>
            </div>
          </div>
        )}

        {/* Active Online Travelers Presence Bar */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-300">Connected:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {members.map((m, i) => (
              <span
                key={m.id || i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {m.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Real-Time Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/60">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isMe
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  {msg.avatarLetter || msg.senderName[0] || 'U'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[78%] rounded-2xl p-3 space-y-1 shadow-md ${
                    msg.isAnnouncement
                      ? 'bg-amber-950/80 border-2 border-amber-500/60 text-white'
                      : isMe
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span
                      className={`font-black ${
                        msg.isAnnouncement
                          ? 'text-amber-300'
                          : isMe
                          ? 'text-emerald-100'
                          : 'text-slate-300'
                      }`}
                    >
                      {msg.senderName}
                      {msg.isAnnouncement && ' 📌'}
                    </span>
                    <span
                      className={`text-[9px] ${
                        isMe ? 'text-emerald-200/80' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto border border-slate-700">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">No messages yet in this trip</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Start the conversation with your crew! Messages and pinned announcements sync instantly in real time.
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 1-Tap Quick Action Travel Chips */}
        <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendQuickChip(chip)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold whitespace-nowrap transition-colors border border-slate-700 active:scale-95 shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Real-time Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-2 shrink-0"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={asAnnouncement}
                onChange={(e) => setAsAnnouncement(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className={asAnnouncement ? 'text-amber-400 font-bold' : ''}>
                Pin as Announcement 📌
              </span>
            </label>
            <span className="text-[10px] text-slate-500">Realtime Sync Active</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={asAnnouncement ? 'Write pinned announcement...' : 'Message your travel crew in real time...'}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                asAnnouncement
                  ? 'bg-amber-950/30 border-amber-500/50 focus:border-amber-400'
                  : 'bg-slate-900 border-slate-700 focus:border-emerald-500'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
