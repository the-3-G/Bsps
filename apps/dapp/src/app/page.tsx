'use client';

import React from 'react';
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';
import { ShieldCheck, ArrowRight, Wallet } from 'lucide-react';

export default function LandingPage() {
  const { isConnected } = useWeb3();

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 pt-10">
      <div className="p-4 bg-teal-950/40 rounded-full text-teal-primary border border-teal-800">
        <ShieldCheck className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">BSPC Validation Protocol</h1>
        <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          Secure, non-custodial decentralized portal for validating nodes and staking assets.
        </p>
      </div>

      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-left max-w-sm">
        <h3 className="text-xs font-bold text-slate-200">Security Gate Notice</h3>
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
          The validation dashboard requests cryptographic message signatures to register authorization.
          No transaction costs or gas are spent during validation setup.
        </p>
      </div>

      <div className="w-full max-w-[260px] pt-4">
        {isConnected ? (
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg"
          >
            Enter Protocol Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/connect"
            className="w-full inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg"
          >
            <Wallet className="w-4 h-4" /> Connect Bitget Wallet
          </Link>
        )}
      </div>
    </div>
  );
}
