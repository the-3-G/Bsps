'use client';

import React from 'react';
import './globals.css';
import { Web3Provider, useWeb3 } from '../context/Web3Context';
import { LayoutDashboard, Wallet, Layers, Users, Landmark, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-slate-900 m-0 p-0 text-slate-100 flex justify-center items-center">
        <Web3Provider>
          {/* Mobile-first constraints viewport wrapper */}
          <div className="w-full max-w-md min-h-screen bg-slate-950 border-x border-slate-800 shadow-2xl flex flex-col relative pb-20">
            <DAppHeader />
            <main className="flex-1 p-4 overflow-y-auto">
              {children}
            </main>
            <DAppBottomNav />
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}

function DAppHeader() {
  const { isConnected, address, chainId, disconnectWallet } = useWeb3();

  return (
    <header className="px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-teal-650 rounded-full flex items-center justify-center font-bold text-xs text-white">
          B
        </div>
        <span className="font-bold text-sm tracking-wide">BSPC DApp</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Network indicator */}
        <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded font-semibold text-slate-300 border border-slate-700">
          {chainId === 1 ? 'Ethereum Mainnet' : 'Sepolia Testnet'}
        </span>

        {/* Demo Indicator */}
        <span className="bg-amber-900/60 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-800">
          DEMO DATA
        </span>

        {isConnected ? (
          <button
            onClick={disconnectWallet}
            className="text-[10px] bg-red-950/40 hover:bg-red-900/40 text-red-400 font-semibold px-2.5 py-1 rounded border border-red-900/60 transition-all"
          >
            {address?.slice(0, 4)}...{address?.slice(-4)}
          </button>
        ) : (
          <Link
            href="/connect"
            className="text-[10px] bg-teal-primary hover:bg-teal-hover text-white font-bold px-3 py-1 rounded transition-all"
          >
            Connect
          </Link>
        )}
      </div>
    </header>
  );
}

function DAppBottomNav() {
  const pathname = usePathname();
  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Assets', href: '/assets', icon: Wallet },
    { label: 'Pledges', href: '/pledges', icon: Layers },
    { label: 'Referrals', href: '/referrals', icon: Users },
    { label: 'Withdraw', href: '/withdraw', icon: Landmark },
  ];

  return (
    <nav className="fixed bottom-0 max-w-md w-full border-t border-slate-800 bg-slate-900/90 backdrop-blur-md flex justify-around py-2 z-55">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 select-none">
            <Icon className={`w-5 h-5 ${active ? 'text-teal-primary' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-semibold ${active ? 'text-teal-primary font-bold' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
