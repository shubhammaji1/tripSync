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
} from 'lucide-react';

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSettleConfirmation = () => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>Instant Group Settlement</span>
            </div>
            <h3 className="text-xl font-black text-white">Settle Group Debt</h3>
            <p className="text-xs text-slate-400">
              <span className="text-slate-300 font-semibold">{fromUser}</span> owes{' '}
              <span className="text-emerald-400 font-bold">{toUser}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Pill */}
        <div className="px-6 pt-5 pb-2 text-center bg-slate-950/50 border-b border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settlement Amount</span>
          <div className="text-3xl sm:text-4xl font-black text-white mt-0.5 tracking-tight flex items-center justify-center gap-1">
            <span className="text-emerald-400 font-mono">₹</span>
            <span>{amount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">{note}</p>
        </div>

        {/* View Switcher: Mobile Deep-Link vs Dynamic QR */}
        <div className="p-6 space-y-5">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('app')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'app'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay via UPI App</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'qr'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* Payee UPI ID Input / Verification */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>Recipient UPI ID / VPA</span>
              <span className="text-slate-500 text-[10px]">Editable</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="recipient@okaxis"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleCopyUpiId}
                className="absolute right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: 1-Tap Mobile UPI App Buttons */}
          {activeTab === 'app' && (
            <div className="space-y-3">
              {/* Primary Direct UPI Trigger */}
              <a
                href={upiUrl}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all text-center"
              >
                <Smartphone className="w-4 h-4" />
                <span>Launch UPI App (GPay / PhonePe / Paytm)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Individual App Fallbacks */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <a
                  href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-base">🟢</span>
                  <span className="text-[11px]">Google Pay</span>
                </a>
                <a
                  href={`phonepe://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-base">🟣</span>
                  <span className="text-[11px]">PhonePe</span>
                </a>
                <a
                  href={`paytmmp://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-base">🔵</span>
                  <span className="text-[11px]">Paytm</span>
                </a>
              </div>
            </div>
          )}

          {/* Tab 2: Dynamic QR Code for In-Person Scanning */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`UPI QR Code to pay ${toUser}`}
                  width={200}
                  height={200}
                  className="rounded-xl aspect-square"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Scan with Google Pay, PhonePe, Paytm, or any banking app camera.
              </p>
            </div>
          )}

          {/* Footer Action: Settle Confirmation */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <button
              onClick={handleCopyLink}
              className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Payment Link'}</span>
            </button>

            <button
              onClick={handleSettleConfirmation}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                settled
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              {settled ? (
                <>
                  <Check className="w-4 h-4" />
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
    </div>
  );
}
