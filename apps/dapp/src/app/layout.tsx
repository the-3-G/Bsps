'use client';

import React, { useState, useEffect, useRef } from 'react';
import './globals.css';
import { Web3Provider } from '../context/Web3Context';
import { LayoutDashboard, Wallet, Layers, Users, Landmark, Share2, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CustomerServiceModal } from '../components/CustomerServiceModal';
import { ChatDrawer } from '../components/ChatDrawer';
import { SideDrawer } from '../components/SideDrawer';
import { ConfirmAuthorizationModal } from '../components/ConfirmAuthorizationModal';

import { useWeb3 } from '../context/Web3Context';

// Routes that show the authenticated bottom navigation
const AUTH_ROUTES = ['/dashboard', '/assets', '/pledges', '/referrals', '/withdraw'];

const HEADER_NAV_ITEMS = [
  { label: 'Home',      href: '/' },
  { label: 'NFT',       href: '/assets' },
  { label: 'Pool Data', href: '/dashboard' },
  { label: 'Plan',      href: '/pledges' },
  { label: 'Loan',      href: '/loan' },
  { label: 'Paper',     href: '/referrals' },
];

function DAppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { connectWallet, isConnected, address } = useWeb3();
  const [headerState, setHeaderState] = useState<'guest' | 'voucher_requested'>('guest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isConfirmAuthOpen, setIsConfirmAuthOpen] = useState(false);
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
      />

      <ConfirmAuthorizationModal
        isOpen={isConfirmAuthOpen}
        onClose={() => setIsConfirmAuthOpen(false)}
        onConfirm={handleConfirmAuth}
      />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>BSP — Blockchain Savings Portal</title>
        <meta name="description" content="BSP is a decentralized digital asset savings and information portal built on Web3 technology." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-section-navy m-0 p-0 text-white flex flex-col">
        <Web3Provider>
          <DAppLayoutInner>{children}</DAppLayoutInner>
        </Web3Provider>
      </body>
    </html>
  );
}

import { CheckInFloatingButton, CustomerServiceFloatingButton } from '../components/FloatingActions';

/* ============================================================
   FLOATING ACTIONS — Check-In + Customer Service only
   ============================================================ */
function FloatingActions({
  hasUnreadChat,
  onOpenChat,
}: {
  hasUnreadChat: boolean;
  onOpenChat: () => void;
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
      {/* Check-In button */}
      <CheckInFloatingButton onClick={onOpenChat} />

      {/* Customer Service Chat button */}
      <CustomerServiceFloatingButton
        hasUnread={hasUnreadChat}
        onClick={onOpenChat}
      />
    </div>
  );
}

/* ============================================================
   TOP TAB NAV — shown on authenticated app routes
   (Pool Data | Plan | Account | Transfer)
   ============================================================ */
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
        gap: 0,
        padding: '12px 16px 10px',
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
              fontSize: 15,
              fontWeight: active ? 700 : 500,
              color: active ? '#FFFFFF' : '#8F98A6',
              textDecoration: 'none',
              padding: '8px 4px',
              borderRadius: 8,
              background: active
                ? 'rgba(255,255,255,0.06)'
                : 'transparent',
              border: active
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid transparent',
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
