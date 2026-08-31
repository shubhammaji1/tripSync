'use client';

import React, { useState } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface UPISettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromUser: string;
  toUser: string;
  amount: number;
  tripName: string;
  defaultUpiId?: string;
  onMarkSettled?: () => void;
}

export function UPISettlementModal({
  isOpen,
  onClose,
  fromUser,
  toUser,
  amount,
  tripName,
  defaultUpiId,
  onMarkSettled,
}: UPISettlementModalProps) {
  const [upiId, setUpiId] = useState(
    defaultUpiId || `${toUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`
  );
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [settled, setSettled] = useState(false);
  const [activeTab, setActiveTab] = useState<'app' | 'qr'>('app');

  if (!isOpen) return null;

  const note = `TripSync - ${tripName}`;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiUrl)}`;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    haptic.medium();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUrl);
    haptic.medium();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSettleConfirmation = () => {
    haptic.success();
    setSettled(true);
    if (onMarkSettled) {
      onMarkSettled();
    }
    setTimeout(() => {
      onClose();
      setSettled(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-md bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[calc(90vh-1rem)]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white border-b border-slate-100 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              <span>Instant Group Settlement</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">Settle Group Debt</h3>
            <p className="text-xs text-slate-500 font-medium">
              <span className="text-slate-800 font-bold">{fromUser}</span> pays{' '}
              <span className="text-emerald-700 font-bold">{toUser}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Hero Amount Banner */}
          <div className="py-4 px-5 text-center bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Settlement Amount</span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-800 mt-0.5 tracking-tight flex items-center justify-center gap-1">
              <span className="text-emerald-600 font-mono">₹</span>
              <span>{amount.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">{note}</p>
          </div>

          {/* View Switcher: Mobile Deep-Link vs Dynamic QR */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('app');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'app'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Pay via UPI App</span>
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('qr');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* Payee UPI ID Input / Verification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Recipient UPI ID / VPA</span>
              <span className="text-slate-400 text-[10px] font-semibold">Tap to Edit</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="recipient@okaxis"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-20"
              />
              <button
                type="button"
                onClick={handleCopyUpiId}
                className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: 1-Tap Mobile UPI App Buttons */}
          {activeTab === 'app' && (
            <div className="space-y-3 pt-1">
              {/* Primary Direct UPI Trigger */}
              <a
                href={upiUrl}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Launch UPI App (GPay / PhonePe / Paytm)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Individual App Fallbacks */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <a
                  href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all flex flex-col items-center gap-1 cursor-pointer hover:border-emerald-300"
                >
                  <span className="text-base">🟢</span>
                  <span className="text-[11px]">Google Pay</span>
                </a>
                <a
                  href={`phonepe://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all flex flex-col items-center gap-1 cursor-pointer hover:border-purple-300"
                >
                  <span className="text-base">🟣</span>
                  <span className="text-[11px]">PhonePe</span>
                </a>
                <a
                  href={`paytmmp://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all flex flex-col items-center gap-1 cursor-pointer hover:border-sky-300"
                >
                  <span className="text-base">🔵</span>
                  <span className="text-[11px]">Paytm</span>
                </a>
              </div>
            </div>
          )}

          {/* Tab 2: Dynamic QR Code for In-Person Scanning */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`UPI QR Code to pay ${toUser}`}
                  width={180}
                  height={180}
                  className="rounded-xl aspect-square"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium text-center">
                Scan with Google Pay, PhonePe, Paytm, or any banking app camera.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions - Always Visible & Padded */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Payment Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleSettleConfirmation}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              settled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            {settled ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Marked Settled!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Mark as Settled</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
