'use client';

import React from 'react';
import { Ticket, MessageSquare, X } from 'lucide-react';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export function CustomerServiceModal({ isOpen, onClose, onOpenChat }: CustomerServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Receive Voucher</h2>
            <p className="text-[11px] text-amber-400 font-semibold">Special Staking Allocation</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          Please contact customer service to receive your voucher. Our support team will guide you through your voucher eligibility and activation.
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onOpenChat();
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg"
          >
            <MessageSquare className="w-4 h-4" /> Contact Customer Service
          </button>
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
