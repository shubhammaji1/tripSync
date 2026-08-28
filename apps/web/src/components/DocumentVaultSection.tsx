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
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  const handleCopyRef = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      addedBy: 'You',
      createdAt: new Date().toISOString(),
    };

    saveDocuments([doc, ...documents]);
    if (tripId) {
      emitTripActivity(tripId, {
        type: 'DOC_UPLOAD',
        title: 'Document Added to Vault',
        description: `"${doc.title}" (${doc.category}) registered with ref ${doc.referenceNumber}`,
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
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this travel document from the group vault?')) {
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

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>

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
                      {doc.referenceNumber}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyRef(doc.id, doc.referenceNumber)}
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
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName || `${doc.title}.pdf`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}

                  <button
                    onClick={() => setPreviewDoc(doc)}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-white">Upload Ticket or Voucher</h3>
                <p className="text-xs text-slate-400">Attach real files & reference numbers for your crew</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* File Upload Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Attach File (PDF, Image, Voucher)</label>
                {newDoc.fileName ? (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{newDoc.fileName}</p>
                        <p className="text-[10px] text-slate-400">{newDoc.fileSize}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewDoc({ ...newDoc, fileUrl: undefined, fileName: undefined, fileSize: undefined })}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 hover:bg-emerald-950/20 text-slate-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer transition-colors">
                    <UploadCloud className="w-6 h-6 text-emerald-400" />
                    <span>Click to select PDF or image ticket from your phone/laptop</span>
                    <input
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="e.g. Flight IndiGo CCU-IXB or Glenburn Hotel Voucher"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FLIGHT">✈️ Flight Boarding Pass</option>
                    <option value="HOTEL">🏨 Hotel Voucher</option>
                    <option value="TRANSPORT">🚗 Cab / Train Ticket</option>
                    <option value="PERMIT">🏔️ Entry Permit</option>
                    <option value="PASS">🎟️ Attraction Pass</option>
                    <option value="OTHER">📄 General Document</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">PNR / Reference Code *</label>
                  <input
                    type="text"
                    required
                    value={newDoc.referenceNumber}
                    onChange={(e) => setNewDoc({ ...newDoc, referenceNumber: e.target.value })}
                    placeholder="e.g. 6E-W8K9PL or PNR 840291"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Provider / Airline / Hotel</label>
                  <input
                    type="text"
                    value={newDoc.provider}
                    onChange={(e) => setNewDoc({ ...newDoc, provider: e.target.value })}
                    placeholder="e.g. Air India or Taj Hotel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Travel Date / Time</label>
                  <input
                    type="text"
                    value={newDoc.travelDate}
                    onChange={(e) => setNewDoc({ ...newDoc, travelDate: e.target.value })}
                    placeholder="e.g. Sep 10, 2026 • 08:30 AM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Notes / Seat Numbers / Instructions</label>
                <textarea
                  rows={2}
                  value={newDoc.notes}
                  onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                  placeholder="e.g. Seats 12A, 12B. Driver contact: Ramesh +91 98320 11223"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Save to Group Vault
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl p-6 space-y-4 my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  {previewDoc.category} Voucher
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400">{previewDoc.provider}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">PNR / Ref:</span>
                <span className="font-bold text-emerald-400">{previewDoc.referenceNumber}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Travel Date:</span>
                <span className="text-slate-300">{previewDoc.travelDate || 'Trip Dates'}</span>
              </div>
              {previewDoc.fileName && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">File:</span>
                  <span className="text-slate-300 truncate max-w-[180px] font-sans">{previewDoc.fileName}</span>
                </div>
              )}
              {previewDoc.notes && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="text-slate-300 font-sans leading-relaxed">{previewDoc.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleCopyRef(previewDoc.id, previewDoc.referenceNumber)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === previewDoc.id ? 'Copied' : 'Copy Reference'}</span>
              </button>
              {previewDoc.fileUrl && (
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName || `${previewDoc.title}.pdf`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
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
