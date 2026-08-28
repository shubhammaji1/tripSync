'use client';

import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Receipt, ExternalLink } from 'lucide-react';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  expenseTitle: string;
  amount: number;
  currency?: string;
  payerName?: string;
  category?: string;
}

export function ReceiptPreviewModal({
  isOpen,
  onClose,
  receiptUrl,
  expenseTitle,
  amount,
  currency = '₹',
  payerName,
  category,
}: ReceiptPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 md:p-8 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[calc(100vh-4rem)] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white truncate max-w-xs sm:max-w-md">
                {expenseTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {currency}
                {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} • Paid by{' '}
                <strong className="text-emerald-400">{payerName || 'Traveler'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Link */}
            <a
              href={receiptUrl}
              download={`receipt-${expenseTitle.toLowerCase().replace(/\s+/g, '-')}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Download Receipt"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Image Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/60 flex items-center justify-center min-h-[350px]">
          <div
            className="transition-transform duration-200 origin-center flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt={`Receipt for ${expenseTitle}`}
              className="max-h-[60vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-800 bg-white"
            />
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px]">
            Zoom: {Math.round(zoomLevel * 100)}% • Rotation: {rotation}°
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
