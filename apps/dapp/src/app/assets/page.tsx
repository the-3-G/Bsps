'use client';

import React from 'react';
import { Wallet, CircleDollarSign } from 'lucide-react';

export default function AssetsPage() {
  return (
    <div className="space-y-6 pt-2">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Asset Holdings</h2>
        <p className="text-xs text-slate-500">Verified blockchain and pool ledger assets.</p>
      </div>

      <div className="space-y-3">
        <div className="card-glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-teal-primary rounded-xl">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">USD Coin (USDC)</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-100">12,450.00 USDC</div>
            <span className="text-[9px] text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-900/60 font-semibold inline-block mt-1">
              ✓ On-chain verified
            </span>
          </div>
        </div>

        <div className="card-glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-slate-350 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Ethereum (ETH)</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">Native Gas Asset</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-100">1.45 ETH</div>
            <span className="text-[9px] text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-900/60 font-semibold inline-block mt-1">
              ✓ On-chain verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
