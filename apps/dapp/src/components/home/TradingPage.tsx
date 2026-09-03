'use client';

import React from 'react';
import Link from 'next/link';
import { Coins, CreditCard, Users, ChevronRight } from 'lucide-react';

interface PopularCoin {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  color: string;
  bgColor: string;
  iconText: string;
}

const POPULAR_COINS: PopularCoin[] = [
  { symbol: 'DOGE', name: 'Dogecoin', price: '0.1420', change: '+2.4%', isPositive: true, color: '#E1B303', bgColor: '#FEF9C3', iconText: 'Ð' },
  { symbol: 'DOT', name: 'Polkadot', price: '7.84', change: '+1.8%', isPositive: true, color: '#E6007A', bgColor: '#FCE7F3', iconText: 'P' },
  { symbol: 'XRP', name: 'Ripple', price: '0.5840', change: '-0.6%', isPositive: false, color: '#23292F', bgColor: '#E2E8F0', iconText: 'X' },
  { symbol: 'LTC', name: 'Litecoin', price: '72.50', change: '+0.9%', isPositive: true, color: '#345D9D', bgColor: '#DBEAFE', iconText: 'Ł' },
  { symbol: 'ETH', name: 'Ethereum', price: '2,645.10', change: '+3.1%', isPositive: true, color: '#627EEA', bgColor: '#E0E7FF', iconText: 'Ξ' },
  { symbol: 'BTC', name: 'Bitcoin', price: '64,250.00', change: '+1.5%', isPositive: true, color: '#F7931A', bgColor: '#FFEDD5', iconText: '₿' },
];

export function TradingPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-4 text-slate-100 select-none pb-24">
      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Total Trading Volume */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
              <Coins className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Trading Volume</div>
              <div className="text-lg font-black text-white tracking-tight">$5,158,043,846</div>
            </div>
          </div>
        </div>

        {/* Open Interest */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md">
              <CreditCard className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Open Interest</div>
              <div className="text-lg font-black text-white tracking-tight">$3,337,658,287</div>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Users</div>
              <div className="text-lg font-black text-white tracking-tight">324,482</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Popular Currency Section ───────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-center text-amber-400 font-extrabold text-lg tracking-wide uppercase">
          Popular Currency
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {POPULAR_COINS.map((coin) => (
            <div key={coin.symbol} className="flex items-center gap-2.5 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner"
                style={{ backgroundColor: coin.bgColor, color: coin.color }}
              >
                {coin.iconText}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-slate-400 truncate">{coin.name}</div>
                <div className="font-bold text-xs text-white uppercase truncate">{coin.symbol}</div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-bold ${coin.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {coin.change}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">${coin.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Banner 1: BLOCKCHAIN DIGITAL CURRENCY ───────────────── */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-2xl p-5 text-slate-950 shadow-xl flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 z-10 max-w-[65%]">
          <div className="text-xs font-black uppercase tracking-wider text-slate-950">
            BLOCKCHAIN
          </div>
          <div className="text-base font-extrabold leading-tight">
            DIGITAL CURRENCY
          </div>
          <div className="text-[11px] text-slate-800 font-medium pt-1">
            Open a new pattern of future
          </div>
        </div>

        {/* 3D Graphic */}
        <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl rotate-12 shadow-2xl flex items-center justify-center text-white font-black text-xs text-center border-2 border-white/40 p-2">
            Block chain
          </div>
        </div>
      </div>

      {/* ── Liquidity Saving Bar ───────────────────────────────── */}
      <Link
        href="/pledges"
        className="bg-slate-900/90 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-4 flex items-center justify-between shadow-lg group transition-all"
      >
        <span className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
          Liquidity saving to earn USDC
        </span>
        <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </div>
      </Link>

      {/* ── Banner 2: Saving Plan reward 3 million ETH ──────────── */}
      <div className="bg-amber-400 rounded-2xl p-5 text-slate-950 shadow-xl flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Saving Plan reward
          </div>
          <div className="text-xl font-black text-slate-950 tracking-tight">
            3 million ETH
          </div>
        </div>

        {/* Storestand Graphic */}
        <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl border-2 border-amber-300 shadow-xl flex items-center justify-center text-amber-400 font-black text-2xl">
            Ξ
          </div>
        </div>
      </div>

      {/* ── Our Advantage Section ──────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h2 className="text-center text-amber-400 font-extrabold text-lg tracking-wide uppercase">
          Our advantage
        </h2>

        <div className="text-xs font-bold text-amber-400">
          01. What are the rules of futures trading?
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 space-y-2.5 leading-relaxed font-normal">
          <p className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              Participate in the transaction by estimating the current transaction to the next price trend (ups and downs), and the range of ups and downs is not calculated during the settlement, and only the results of the ups and downs are settled in revenue.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              The profit percentage settled at different delivery times is different, and the profit will be accurately displayed in the trading interface.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
