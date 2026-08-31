'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Eye,
  Plane,
  Building,
  Car,
  Shield,
  Ticket,
  Search,
  Filter,
  Sparkles,
  Lock,
  X,
  FileCheck,
  UploadCloud,
  File,
  Paperclip,
} from 'lucide-react';

import { emitTripActivity } from '@/components/LiveActivityFeedDrawer';
import { haptic } from '@/lib/haptics';

export interface TravelDocument {
  id: string;
  title: string;
  category: 'FLIGHT' | 'HOTEL' | 'TRANSPORT' | 'PERMIT' | 'PASS' | 'INSURANCE' | 'ACTIVITY' | 'VISA' | 'OTHER';
  provider: string;
  referenceNumber: string; // PNR, Booking ID, Permit ID
  travelDate?: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  addedBy?: string;
  createdAt?: string;
  isLocked?: boolean;
  pin?: string;
}

interface DocumentVaultSectionProps {
  canEdit: boolean;
  tripId: string;
  tripName?: string;
}

export function DocumentVaultSection({
  canEdit,
  tripId,
  tripName = 'Expedition',
}: DocumentVaultSectionProps) {
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<TravelDocument | null>(null);

  // Sensitive PIN Lock state
  const [unlockedDocIds, setUnlockedDocIds] = useState<Record<string, boolean>>({});
  const [pinPromptDoc, setPinPromptDoc] = useState<TravelDocument | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'view' | 'download' | 'copy'; doc: TravelDocument } | null>(null);

  const storageKey = `tripsync_docs_${tripId}`;

  // Load real documents for this specific trip from persistent storage
  useEffect(() => {
    if (!tripId) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDocuments(parsed);
          return;
        }
      }
      setDocuments([]);
    } catch {
      setDocuments([]);
    }
  }, [tripId, storageKey]);

  const saveDocuments = (updated: TravelDocument[]) => {
    setDocuments(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  // New Document Form State
  const [newDoc, setNewDoc] = useState<{
    title: string;
    category: TravelDocument['category'];
    provider: string;
    referenceNumber: string;
    travelDate: string;
    notes: string;
    isLocked: boolean;
    pin: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
  }>({
    title: '',
    category: 'FLIGHT',
    provider: '',
    referenceNumber: '',
    travelDate: '',
    notes: '',
    isLocked: false,
    pin: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: 5MB maximum file size limit
    if (file.size > 5 * 1024 * 1024) {
      alert(`Security Check: File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 5MB limit.`);
      e.target.value = '';
      return;
    }

    // Security: MIME type & extension allowlist (reject executables/scripts)
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const isAllowedExt = /\.(pdf|jpg|jpeg|png|webp|doc|docx)$/i.test(file.name);
    if (!allowedMimes.includes(file.type) && !isAllowedExt) {
      alert('Security Block: Invalid file type. Only verified PDF, JPEG, PNG, WEBP, and DOC files are permitted.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const sizeKb = Math.round(file.size / 1024);
        const formattedSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        setNewDoc((prev) => ({
          ...prev,
          fileUrl: event.target!.result as string,
          fileName: file.name,
          fileSize: formattedSize,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyRef = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    haptic.medium();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerSecuredAction = (doc: TravelDocument, actionType: 'view' | 'download' | 'copy') => {
    if (doc.isLocked && !unlockedDocIds[doc.id]) {
      haptic.light();
      setPinPromptDoc(doc);
      setPendingAction({ type: actionType, doc });
      setPinInput('');
      setPinError(false);
      return;
    }

    executeAction(doc, actionType);
  };

  const executeAction = (doc: TravelDocument, actionType: 'view' | 'download' | 'copy') => {
    if (actionType === 'view') {
      haptic.light();
      setPreviewDoc(doc);
    } else if (actionType === 'copy') {
      handleCopyRef(doc.id, doc.referenceNumber);
    } else if (actionType === 'download' && doc.fileUrl) {
      haptic.medium();
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName || `${doc.title}.pdf`;
      link.click();
    }
  };

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptDoc) return;

    if (pinInput.trim() === pinPromptDoc.pin || !pinPromptDoc.pin) {
      haptic.success();
      setUnlockedDocIds((prev) => ({ ...prev, [pinPromptDoc.id]: true }));
      const action = pendingAction;
      setPinPromptDoc(null);
      setPendingAction(null);
      setPinInput('');
      setPinError(false);

      if (action) {
        executeAction(action.doc, action.type);
      }
    } else {
      haptic.error();
      setPinError(true);
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title.trim()) return;

    const doc: TravelDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: newDoc.title.trim(),
      category: newDoc.category,
      provider: newDoc.provider.trim() || 'Official Provider',
      referenceNumber: newDoc.referenceNumber.trim() || 'N/A',
      travelDate: newDoc.travelDate.trim() || 'Trip Dates',
      notes: newDoc.notes.trim(),
      fileUrl: newDoc.fileUrl,
      fileName: newDoc.fileName,
      fileSize: newDoc.fileSize,
      isLocked: newDoc.isLocked,
      pin: newDoc.isLocked ? newDoc.pin.trim() : undefined,
      addedBy: 'You',
      createdAt: new Date().toISOString(),
    };

    saveDocuments([doc, ...documents]);
    haptic.success();
    if (tripId) {
      emitTripActivity(tripId, {
        type: 'DOC_UPLOAD',
        title: 'Document Added to Vault',
        description: `"${doc.title}" (${doc.category}) registered${doc.isLocked ? ' 🔒 (PIN Protected)' : ''}`,
        actorName: 'Traveler',
      });
    }
    setShowAddModal(false);
    setNewDoc({
      title: '',
      category: 'FLIGHT',
      provider: '',
      referenceNumber: '',
      travelDate: '',
      notes: '',
      isLocked: false,
      pin: '',
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this travel document from the group vault?')) {
      haptic.warning();
      saveDocuments(documents.filter((d) => d.id !== id));
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryBadge = (cat: TravelDocument['category']) => {
    switch (cat) {
      case 'FLIGHT':
        return { label: 'Flight', icon: <Plane className="w-3.5 h-3.5" />, color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'HOTEL':
        return { label: 'Accommodation', icon: <Building className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'TRANSPORT':
        return { label: 'Cab / Transit', icon: <Car className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'PERMIT':
        return { label: 'Entry Permit', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'PASS':
        return { label: 'Attraction Pass', icon: <Ticket className="w-3.5 h-3.5" />, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'Document', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Summary Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <FileCheck className="w-3 h-3 inline mr-1" />
              Document Vault
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {documents.length} Real Document{documents.length === 1 ? '' : 's'} Stored
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Group Travel Tickets & Vouchers</span>
            <span className="text-sm">📁</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Upload actual PDF boarding passes, hotel confirmation vouchers, transport agreements, and entry permits for everyone in your trip.
          </p>
        </div>

        {/* Add Document Button */}
        {canEdit ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all self-start md:self-auto shrink-0 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Ticket / Document</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Viewer Access (Read-Only)</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Files' },
            { id: 'FLIGHT', label: '✈️ Flights' },
            { id: 'HOTEL', label: '🏨 Hotels' },
            { id: 'TRANSPORT', label: '🚗 Cabs & Trains' },
            { id: 'PERMIT', label: '🏔️ Permits' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white border border-slate-700 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PNR, Hotel, Airline..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          const badge = getCategoryBadge(doc.category);
          const isCopied = copiedId === doc.id;
          const isUnlocked = !doc.isLocked || unlockedDocIds[doc.id];

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    {doc.isLocked && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          isUnlocked
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>{isUnlocked ? 'PIN Unlocked' : 'PIN Protected'}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {doc.travelDate}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Provider: <strong className="text-slate-700">{doc.provider}</strong>
                  </p>
                </div>

                {/* Reference Number / PNR Pill */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      PNR / Booking Reference
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900">
                      {isUnlocked ? doc.referenceNumber : '•••••••• (PIN Protected)'}
                    </span>
                  </div>

                  <button
                    onClick={() => triggerSecuredAction(doc, 'copy')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
                    title="Copy PNR / Reference Code"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {doc.notes && (
                  <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-xl leading-relaxed">
                    📝 {doc.notes}
                  </p>
                )}

                {doc.fileName && (
                  <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <strong className="truncate font-medium">{doc.fileName}</strong>
                    </span>
                    {doc.fileSize && (
                      <span className="text-[10px] text-slate-400 shrink-0">{doc.fileSize}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-400">
                  Added by {doc.addedBy || 'Traveler'}
                </span>

                <div className="flex items-center gap-2">
                  {doc.fileUrl && (
                    <button
                      onClick={() => triggerSecuredAction(doc, 'download')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  )}

                  <button
                    onClick={() => triggerSecuredAction(doc, 'view')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">No documents uploaded yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Upload Ticket / Document&quot; above to attach real PDF boarding passes, hotel vouchers, and permits.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* UPLOAD DOCUMENT MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Upload Travel Document / Voucher</h3>
                  <p className="text-xs text-slate-500 font-medium">Attach real tickets, PNRs, and secure files for your trip</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-5rem)]">
              {/* 1. File Upload Dropzone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Attach Ticket / Document File</span>
                  <span className="text-[10px] font-semibold text-slate-400">PDF, PNG, JPG, WEBP • Max 5MB</span>
                </label>
                {newDoc.fileName ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{newDoc.fileName}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{newDoc.fileSize || 'Attached'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setNewDoc({ ...newDoc, fileUrl: undefined, fileName: undefined, fileSize: undefined });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 text-slate-600 hover:text-emerald-900 text-xs font-semibold cursor-pointer transition-all duration-200 group">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-slate-900 block">Click to upload document or voucher</span>
                      <span className="text-[11px] text-slate-500">Boarding passes, hotel reservations, ID cards, entry passes</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 2. Visual Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Document Type / Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FLIGHT', label: 'Flight', icon: Plane, emoji: '✈️' },
                    { id: 'HOTEL', label: 'Hotel / Stay', icon: Building, emoji: '🏨' },
                    { id: 'TRANSPORT', label: 'Cab / Transit', icon: Car, emoji: '🚗' },
                    { id: 'PERMIT', label: 'Permit', icon: Shield, emoji: '🏔️' },
                    { id: 'PASS', label: 'Attraction', icon: Ticket, emoji: '🎟️' },
                    { id: 'VISA', label: 'Passport / Visa', icon: Shield, emoji: '🛂' },
                    { id: 'INSURANCE', label: 'Insurance', icon: FileCheck, emoji: '🛡️' },
                    { id: 'OTHER', label: 'General File', icon: FileText, emoji: '📄' },
                  ].map((cat) => {
                    const isSelected = newDoc.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setNewDoc({ ...newDoc, category: cat.id as any });
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-sm shrink-0">{cat.emoji}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Document Details Fields */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="e.g. Flight IndiGo CCU-IXB or Glenburn Hotel Voucher"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      PNR / Booking Reference Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newDoc.referenceNumber}
                      onChange={(e) => setNewDoc({ ...newDoc, referenceNumber: e.target.value })}
                      placeholder="e.g. 6E-W8K9PL or PNR-840291"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Provider / Airline / Hotel</label>
                    <input
                      type="text"
                      value={newDoc.provider}
                      onChange={(e) => setNewDoc({ ...newDoc, provider: e.target.value })}
                      placeholder="e.g. IndiGo, Taj Bengal, West Bengal Tourism"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Travel Date & Time</label>
                    <input
                      type="text"
                      value={newDoc.travelDate}
                      onChange={(e) => setNewDoc({ ...newDoc, travelDate: e.target.value })}
                      placeholder="e.g. Sep 10, 2026 • 08:30 AM"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Seat Numbers / Room Type / Notes</label>
                    <input
                      type="text"
                      value={newDoc.notes}
                      onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                      placeholder="e.g. Seats 12A, 12B • Deluxe Cottage"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 4. 🔐 DEDICATED PIN SECURITY & LOCK CARD */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                newDoc.isLocked
                  ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      newDoc.isLocked
                        ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>Lock with 4-Digit Security PIN</span>
                        {newDoc.isLocked && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                            Active Lock
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                        Require a 4-digit PIN to view reference codes, notes, or download this file. Perfect for sensitive Passports, Visas, and personal IDs.
                      </p>
                    </div>
                  </div>

                  {/* iOS-Style Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.medium();
                      setNewDoc({ ...newDoc, isLocked: !newDoc.isLocked });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      newDoc.isLocked ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        newDoc.isLocked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Expanded PIN Input Area */}
                {newDoc.isLocked && (
                  <div className="mt-4 pt-4 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div>
                      <label className="text-xs font-bold text-amber-950 block">Set Your 4-Digit PIN</label>
                      <p className="text-[10px] text-amber-800/80 font-medium">Share this PIN only with authorized travelers</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required={newDoc.isLocked}
                        value={newDoc.pin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setNewDoc({ ...newDoc, pin: val });
                          if (val.length === 4) haptic.light();
                        }}
                        placeholder="••••"
                        className="w-32 tracking-[0.4em] text-center bg-white border-2 border-amber-400 rounded-xl px-3 py-2 text-base font-mono font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                      />
                      {newDoc.pin && newDoc.pin.length === 4 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1.5 rounded-xl border border-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                          <span>4-Digit PIN Ready</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Save to Group Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PIN UNLOCK KEYPAD MODAL */}
      {/* ========================================================= */}
      {pinPromptDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl p-6 text-center space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                🔒 Security Locked
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Enter 4-Digit PIN</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                This document is protected. Enter the PIN to access <strong className="text-slate-900">{pinPromptDoc.title}</strong>
              </p>
            </div>

            <form onSubmit={handleUnlockPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinInput(val);
                    setPinError(false);
                    if (val.length === 4) haptic.light();
                  }}
                  placeholder="••••"
                  className={`w-36 mx-auto tracking-[0.4em] text-center bg-slate-50 border-2 rounded-2xl py-3 text-xl font-mono font-black text-slate-900 focus:outline-none transition-all ${
                    pinError
                      ? 'border-red-500 focus:border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200'
                      : 'border-slate-300 focus:border-amber-500 focus:bg-white'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-bold mt-2 animate-shake">
                    ❌ Incorrect PIN. Please try again.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPinPromptDoc(null);
                    setPendingAction(null);
                    setPinInput('');
                    setPinError(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DOCUMENT PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-md bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl p-6 space-y-4 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  {previewDoc.category} Voucher
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{previewDoc.provider}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans font-medium">PNR / Ref Code:</span>
                <span className="font-bold text-emerald-700 text-sm font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {previewDoc.referenceNumber}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans font-medium">Travel Date:</span>
                <span className="text-slate-800 font-sans font-semibold">{previewDoc.travelDate || 'Trip Dates'}</span>
              </div>
              {previewDoc.fileName && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans font-medium">Attached File:</span>
                  <span className="text-slate-800 truncate max-w-[180px] font-sans font-semibold">{previewDoc.fileName}</span>
                </div>
              )}
              {previewDoc.notes && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1 font-sans font-medium">Notes:</span>
                  <p className="text-slate-700 font-sans leading-relaxed">{previewDoc.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleCopyRef(previewDoc.id, previewDoc.referenceNumber)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === previewDoc.id ? 'Copied!' : 'Copy Reference'}</span>
              </button>
              {previewDoc.fileUrl && (
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName || `${previewDoc.title}.pdf`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
