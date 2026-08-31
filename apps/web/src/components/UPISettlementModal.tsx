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

// 🟢 Official Google Pay Logo Component
function GooglePayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

// 🟣 Official PhonePe Logo Component
function PhonePeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#5F259F" />
      <path
        d="M26.2 14.5h-8.4c-.6 0-1.1.5-1.1 1.1v15.8c0 .6.5 1.1 1.1 1.1h2.2c.6 0 1.1-.5 1.1-1.1v-4.1h4.4c3.9 0 6.6-2.5 6.6-6s-2.7-3.8-5.3-3.8zm-.2 6.7h-4.2v-3.7h4.2c1.8 0 2.9.8 2.9 1.8 0 1.1-1.1 1.9-2.9 1.9z"
        fill="#FFFFFF"
      />
      <path
        d="M23.5 32.5l-4.5-6h-1.8v7.2c0 .6.5 1.1 1.1 1.1h2.2c.6 0 1.1-.5 1.1-1.1v-1.2h1.9z"
        fill="#FFFFFF"
        opacity="0.95"
      />
    </svg>
  );
}

// 🔵 Official Paytm Logo Component
function PaytmLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      <text
        x="6"
        y="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="16"
        fontWeight="900"
        letterSpacing="-0.5px"
      >
        <tspan fill="#002970">Pay</tspan>
        <tspan fill="#00BAF2">tm</tspan>
      </text>
    </svg>
  );
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

              {/* Individual App Quick Buttons with Proper Brand Logos */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                {/* Google Pay */}
                <a
                  href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm group"
                >
                  <div className="w-7 h-7 flex items-center justify-center transition-transform group-hover:scale-110">
                    <GooglePayLogo className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800">Google Pay</span>
                </a>

                {/* PhonePe */}
                <a
                  href={`phonepe://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-3 rounded-2xl bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 text-slate-800 font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm group"
                >
                  <div className="w-7 h-7 flex items-center justify-center transition-transform group-hover:scale-110">
                    <PhonePeLogo className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-extrabold text-purple-900">PhonePe</span>
                </a>

                {/* Paytm */}
                <a
                  href={`paytmmp://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(toUser)}&am=${amount}&cu=INR`}
                  className="p-3 rounded-2xl bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 text-slate-800 font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm group"
                >
                  <div className="w-7 h-7 flex items-center justify-center transition-transform group-hover:scale-110">
                    <PaytmLogo className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800">Paytm</span>
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
