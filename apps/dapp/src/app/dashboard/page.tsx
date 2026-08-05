'use client';

import React from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ShieldCheck, Info, UserCheck, Layers, Landmark } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { isConnected, address, chainId } = useWeb3();

  return (
    <div className="space-y-6 pt-2">
      {/* Wallet Info Status */}
      <div className="card-glass rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Validation Node Status</div>
          <span className="bg-emerald-950 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-800">
            Connected
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-350">Address:</div>
          <div className="font-mono text-xs text-slate-205 font-bold truncate">
            {address || '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'}
          </div>
        </div>
      </div>

      {/* Asset Balances */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Asset Balances</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="card-glass rounded-xl p-3 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold">Staked USDC</div>
            <div className="text-sm font-bold text-slate-100">12,450.00 USDC</div>
            <span className="text-[9px] text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-900/60 font-semibold inline-block">
              ✓ On-chain verified
            </span>
          </div>

          <div className="card-glass rounded-xl p-3 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold">Mining Rewards</div>
            <div className="text-sm font-bold text-slate-100">842.10 USDC</div>
            <span className="text-[9px] text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/60 font-semibold inline-block">
              Platform record
            </span>
          </div>
        </div>
      </div>

      {/* Pledge Allocation Summary */}
      <div className="card-glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Layers className="w-4 h-4 text-teal-primary" />
          <h3 className="text-xs font-bold text-slate-200">Active Pool Lease</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-[9px] text-slate-400">Pledged Tier</div>
            <div className="text-sm font-bold text-teal-primary">Tier A</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">Mining APR</div>
            <div className="text-sm font-bold text-green-400">18.5%</div>
          </div>
        </div>
      </div>

      {/* Referral Summary */}
      <div className="card-glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-purple-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Affiliate Network</div>
            <div className="text-[10px] text-slate-500 mt-0.5">8 direct subordinates</div>
          </div>
        </div>
        <Link
          href="/referrals"
          className="bg-slate-850 hover:bg-slate-800 text-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-800"
        >
          View Tree
        </Link>
      </div>

      {/* Security Warning Notice */}
      <div className="bg-amber-950/40 border border-amber-900/60 rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold text-amber-300">Security & Signatures Notice</h4>
          <p className="text-[10px] text-amber-400/80 leading-relaxed">
            The protocol validation console will never ask you to input your private seed phrases or wallet passwords. All interactions are signed locally via your Bitget Wallet software.
          </p>
        </div>
      </div>
    </div>
  );
}
