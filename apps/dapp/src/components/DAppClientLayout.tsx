'use client';

import React, { useState, useEffect } from 'react';
import { Web3Provider, useWeb3 } from '../context/Web3Context';
import { Menu, Share2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CustomerServiceModal } from './CustomerServiceModal';
import { ChatDrawer } from './ChatDrawer';
import { SideDrawer } from './SideDrawer';
import { ConfirmAuthorizationModal } from './ConfirmAuthorizationModal';
import { DailyCheckInModal } from './DailyCheckInModal';
import { CheckInFloatingButton, CustomerServiceFloatingButton } from './FloatingActions';

// Routes that show the authenticated top tabs navigation
const AUTH_ROUTES = ['/dashboard', '/assets', '/pledges', '/referrals', '/account', '/withdraw'];

const HEADER_NAV_ITEMS = [
  { label: 'Home',      href: '/' },
  { label: 'NFT',       href: '/assets' },
  { label: 'Pool Data', href: '/dashboard' },
  { label: 'Plan',      href: '/pledges' },
  { label: 'Loan',      href: '/loan' },
  { label: 'Account',   href: '/referrals' },
];

function DAppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { connectWallet, isConnected, address } = useWeb3();
  const [headerState, setHeaderState] = useState<'guest' | 'voucher_requested'>('guest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isConfirmAuthOpen, setIsConfirmAuthOpen] = useState(false);
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sync headerState when wallet is connected
  useEffect(() => {
    if (isConnected || address) {
      setHeaderState('voucher_requested');
    }
  }, [isConnected, address]);

  // Scroll-aware sticky header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleHeaderButtonClick = async () => {
    if (!isConnected && !address) {
      setIsConfirmAuthOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  const handleConfirmAuth = async () => {
    setIsConfirmAuthOpen(false);
    try {
      await connectWallet();
      setIsChatOpen(true);
    } catch (err) {
      console.warn('In-page connect warning:', err);
    } finally {
      setHeaderState('voucher_requested');
    }
  };

  const handleOpenChat = () => {
    setHeaderState('voucher_requested');
    setIsChatOpen(true);
    setHasUnreadChat(false);
  };

  const headerBtnLabel = 'Receive Voucher';

  return (
    <>
      {/* ── STICKY HEADER ────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '64px',
          paddingTop: 'env(safe-area-inset-top)',
          background: scrolled ? 'rgba(0, 23, 46, 0.96)' : 'rgba(0, 23, 46, 0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,211,77,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        {/* Left Group: Hamburger + BSP wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            id="menu-open-btn"
            onClick={() => setIsSideDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255,211,77,0.06)',
              border: '1px solid rgba(255,211,77,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <Menu size={20} color="#FFD34D" />
          </button>

          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontWeight: 900,
              fontSize: 22,
              color: '#FFD34D',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>BSP</span>
          </Link>
        </div>

        {/* Center Group: Desktop Navigation Links */}
        <nav
          className="hidden md:flex"
          style={{
            alignItems: 'center',
            gap: 24,
          }}
        >
          {HEADER_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#FFD34D' : '#8F98A6',
                  transition: 'color 0.2s',
                  padding: '6px 0',
                  borderBottom: active ? '2px solid #FFD34D' : '2px solid transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Group: Share + Login/Voucher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            id="share-btn"
            aria-label="Share"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255,211,77,0.06)',
              border: '1px solid rgba(255,211,77,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Share2 size={18} color="#FFD34D" />
          </button>

          <button
            id="header-action-btn"
            onClick={handleHeaderButtonClick}
            style={{
              height: 38,
              padding: '0 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
              color: '#00172E',
              fontWeight: 800,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              letterSpacing: '-0.01em',
              flexShrink: 0,
            }}
          >
            {headerBtnLabel}
          </button>
        </div>
      </header>

      {/* ── TOP TAB NAV (auth routes only) ──────────────── */}
      <DAppTopTabs />

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* ── FLOATING ACTIONS ─────────────────────────────── */}
      <FloatingActions
        hasUnreadChat={hasUnreadChat}
        onOpenChat={handleOpenChat}
        onOpenCheckIn={() => setIsDailyCheckInOpen(true)}
      />

      {/* ── MODALS / DRAWERS ─────────────────────────────── */}
      <CustomerServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenChat={handleOpenChat}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialSource={headerState === 'voucher_requested' ? 'receive_voucher' : 'general_support'}
      />

      <SideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        headerState={headerState}
        onLoginTap={() => setIsConfirmAuthOpen(true)}
        onOpenChat={handleOpenChat}
        onOpenCheckIn={() => setIsDailyCheckInOpen(true)}
      />

      <DailyCheckInModal
        isOpen={isDailyCheckInOpen}
        onClose={() => setIsDailyCheckInOpen(false)}
        onConnectWallet={() => setIsConfirmAuthOpen(true)}
      />

      <ConfirmAuthorizationModal
        isOpen={isConfirmAuthOpen}
        onClose={() => setIsConfirmAuthOpen(false)}
        onConfirm={handleConfirmAuth}
      />
    </>
  );
}

function FloatingActions({
  hasUnreadChat,
  onOpenChat,
  onOpenCheckIn,
}: {
  hasUnreadChat: boolean;
  onOpenChat: () => void;
  onOpenCheckIn: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-end',
      }}
    >
      <CheckInFloatingButton onClick={onOpenCheckIn} />
      <CustomerServiceFloatingButton
        hasUnread={hasUnreadChat}
        onClick={onOpenChat}
      />
    </div>
  );
}

function DAppTopTabs() {
  const pathname = usePathname();
  if (!AUTH_ROUTES.includes(pathname)) return null;

  const tabs = [
    { label: 'Pool Data', href: '/dashboard' },
    { label: 'Plan',      href: '/pledges' },
    { label: 'Account',   href: '/referrals' },
    { label: 'Transfer',  href: '/withdraw' },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#00152B',
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 14,
              fontWeight: active ? 800 : 500,
              color: active ? '#FFD34D' : '#8F98A6',
              textDecoration: 'none',
              padding: '9px 10px',
              borderRadius: 20,
              background: active
                ? 'linear-gradient(180deg, #0F2642 0%, #0B1E34 100%)'
                : 'transparent',
              border: active
                ? '1px solid rgba(255,211,77,0.2)'
                : '1px solid transparent',
              boxShadow: active ? '0 2px 10px rgba(0,0,0,0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DAppClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <DAppLayoutInner>{children}</DAppLayoutInner>
    </Web3Provider>
  );
}
