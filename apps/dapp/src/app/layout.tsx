'use client';

import React, { useState } from 'react';
import './globals.css';
import { Web3Provider } from '../context/Web3Context';
import { LayoutDashboard, Wallet, Layers, Users, Landmark, Menu, Headset } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CustomerServiceModal } from '../components/CustomerServiceModal';
import { ChatDrawer } from '../components/ChatDrawer';
import { SideDrawer } from '../components/SideDrawer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [headerState, setHeaderState] = useState<'guest' | 'login_selected' | 'voucher_requested'>('guest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  const handleHeaderButtonClick = () => {
    if (headerState === 'guest') {
      setHeaderState('login_selected');
    } else if (headerState === 'login_selected') {
      setIsModalOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  const handleOpenChat = () => {
    setHeaderState('voucher_requested');
    setIsChatOpen(true);
    setHasUnreadChat(false);
  };

  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-slate-900 m-0 p-0 text-slate-100 flex justify-center items-center">
        <Web3Provider>
          {/* Mobile-first constraints viewport wrapper */}
          <div className="w-full max-w-md min-h-screen bg-slate-950 border-x border-slate-800 shadow-2xl flex flex-col relative pb-20">
            {/* DApp Header */}
            <header className="px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex justify-between items-center sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSideDrawerOpen(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-full flex items-center justify-center font-bold text-xs text-slate-950">
                    B
                  </div>
                  <span className="font-bold text-sm tracking-wide text-slate-100">BSP Protocol</span>
                </div>
              </div>

              {/* Gold Action Button */}
              <button
                onClick={handleHeaderButtonClick}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                {headerState === 'guest'
                  ? 'Login'
                  : headerState === 'login_selected'
                  ? 'Receive Voucher'
                  : 'Open Chat'}
              </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto">{children}</main>

            {/* Floating Customer Service Button */}
            <button
              onClick={handleOpenChat}
              className="fixed bottom-20 right-4 z-40 p-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-2xl transition-all border-2 border-slate-950 flex items-center justify-center group"
            >
              <Headset className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {hasUnreadChat && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-slate-950 rounded-full animate-ping" />
              )}
            </button>

            {/* Bottom Navigation */}
            <DAppBottomNav />

            {/* Customer Service Modal */}
            <CustomerServiceModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onOpenChat={handleOpenChat}
            />

            {/* Customer Service Real-Time Chat Drawer */}
            <ChatDrawer
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              initialSource={headerState === 'login_selected' ? 'receive_voucher' : 'general_support'}
            />

            {/* Side Navigation Drawer */}
            <SideDrawer
              isOpen={isSideDrawerOpen}
              onClose={() => setIsSideDrawerOpen(false)}
              headerState={headerState}
              onLoginTap={() => setHeaderState('login_selected')}
              onOpenChat={handleOpenChat}
            />
          </div>
        </Web3Provider>
      </body>
    </html>
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
    <nav className="fixed bottom-0 max-w-md w-full border-t border-slate-800 bg-slate-900/95 backdrop-blur-md flex justify-around py-2 z-35">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 select-none">
            <Icon className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-semibold ${active ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
