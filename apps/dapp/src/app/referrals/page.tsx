'use client';

import React from 'react';
import { Users, Copy, Share2 } from 'lucide-react';

export default function ReferralsPage() {
  return (
    <div className="space-y-6 pt-2">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Referral Network</h2>
        <p className="text-xs text-slate-500">Earn network distribution share metrics.</p>
      </div>

      <div className="card-glass rounded-2xl p-4 space-y-4">
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Your Invitation Code</label>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-sm text-teal-primary font-bold tracking-widest flex-1">
              BSPC-792B185
            </div>
            <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-center">
            <div className="text-[9px] text-slate-400">Direct Referrals</div>
            <div className="text-base font-bold text-slate-100 mt-1">8 Members</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-center">
            <div className="text-[9px] text-slate-400">Total Downline</div>
            <div className="text-base font-bold text-slate-100 mt-1">32 Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
