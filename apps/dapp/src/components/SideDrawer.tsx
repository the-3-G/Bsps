'use client';

import React from 'react';
import Link from 'next/link';
import { X, Home, Image, TrendingUp, Cpu, FileText, UserCheck, MessageSquare, Ticket } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  headerState: 'guest' | 'login_selected' | 'voucher_requested';
  onLoginTap: () => void;
  onOpenChat: () => void;
}

export function SideDrawer({ isOpen, onClose, headerState, onLoginTap, onOpenChat }: SideDrawerProps) {
  if (!isOpen) return null;

  const menuItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'NFT', href: '/assets', icon: Image },
    { label: 'Trading', href: '/dashboard', icon: TrendingUp },
    { label: 'Pool Data', href: '/pledges', icon: Cpu },
    { label: 'Loan', href: '/withdraw', icon: FileText },
    { label: 'Paper', href: '/referrals', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-55 flex justify-start bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-4/5 max-w-xs bg-slate-950 border-r border-slate-800 h-full flex flex-col p-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center font-bold text-xs text-slate-950">
              BSP
            </div>
            <span className="font-bold text-sm text-slate-100">BSP Protocol</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                <Icon className="w-4 h-4 text-slate-400" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-900">
            {headerState === 'guest' ? (
              <button
                onClick={() => {
                  onClose();
                  onLoginTap();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Account Login
                </div>
                <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded">Tap</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenChat();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Customer Service
                </div>
                <Ticket className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-500 text-center">
          BSP Validation Protocol &copy; 2026
        </div>
      </div>
    </div>
  );
}
