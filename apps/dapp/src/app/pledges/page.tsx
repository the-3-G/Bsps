'use client';

import React from 'react';
import { Layers, Flame, ArrowRight } from 'lucide-react';

export default function PledgesPage() {
  return (
    <div className="space-y-6 pt-2">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Pledges</h2>
        <p className="text-xs text-slate-500">Decentralized pool staking leases.</p>
      </div>

      <div className="card-glass rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-xs font-bold text-slate-100">Tier A validation</div>
              <div className="text-[9px] text-slate-400">Node allocation active</div>
            </div>
          </div>
          <span className="bg-teal-950 text-teal-400 text-[9px] font-bold px-2 py-0.5 rounded border border-teal-800">
            Mining Yield
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400 text-[9px]">Pledged Base</div>
            <div className="font-bold text-slate-200 mt-0.5">10,000.00 USDC</div>
          </div>
          <div>
            <div className="text-slate-400 text-[9px]">Accumulated Yield</div>
            <div className="font-bold text-green-400 mt-0.5">+452.80 USDC</div>
          </div>
          <div>
            <div className="text-slate-400 text-[9px]">Validation Term</div>
            <div className="font-bold text-slate-200 mt-0.5">90 Days</div>
          </div>
          <div>
            <div className="text-slate-400 text-[9px]">Release Date</div>
            <div className="font-bold text-slate-200 mt-0.5">2026-11-05</div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono bg-slate-950 rounded border border-slate-850 p-2 break-all">
          Tx Hash: 0x8d5c412ae2c78b27357492baee41378d38e21a4f0b2f5c7e7b6d19a2c3a5e8c1
        </div>
      </div>
    </div>
  );
}
