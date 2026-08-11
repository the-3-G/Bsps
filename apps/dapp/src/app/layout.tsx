'use client';

import React, { useState, useEffect, useRef } from 'react';
import './globals.css';
import { Web3Provider } from '../context/Web3Context';
import { LayoutDashboard, Wallet, Layers, Users, Landmark, Share2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CustomerServiceModal } from '../components/CustomerServiceModal';
import { ChatDrawer } from '../components/ChatDrawer';
import { SideDrawer } from '../components/SideDrawer';

import { useWeb3 } from '../context/Web3Context';

// Routes that show the authenticated bottom navigation
const AUTH_ROUTES = ['/dashboard', '/assets', '/pledges', '/referrals', '/withdraw'];

function DAppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { connectWallet, isConnected, address } = useWeb3();
  const [headerState, setHeaderState] = useState<'guest' | 'login_selected' | 'voucher_requested'>('guest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sync headerState when wallet is connected
  useEffect(() => {
    if (isConnected || address) {
      setHeaderState('login_selected');
    }
  }, [isConnected, address]);

  // Scroll-aware sticky header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleHeaderButtonClick = async () => {
    if (headerState === 'guest') {
      try {
        await connectWallet();
        setHeaderState('login_selected');
      } catch (err) {
        console.warn('In-page connect error:', err);
        router.push('/connect');
      }
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

  const headerBtnLabel =
    headerState === 'guest' ? 'Login' :
    headerState === 'login_selected' ? 'Receive Voucher' : 'Open Chat';

  return (
    <>
      {/* ── STICKY HEADER ────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '86px',
          paddingTop: 'env(safe-area-inset-top)',
          background: '#00172E',
          borderBottom: '1px solid rgba(255,211,77,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        {/* Left Group: Hamburger + BSP wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            id="menu-open-btn"
            onClick={() => setIsSideDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(3,44,92,0.6)',
              border: '1px solid rgba(255,211,77,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4.5,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'block', width: 18, height: 2, background: '#FFD34D', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 13, height: 2, background: '#FFD34D', borderRadius: 2, alignSelf: 'flex-start', marginLeft: 3 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: '#FFD34D', borderRadius: 2 }} />
          </button>

          <span style={{
            fontWeight: 800,
            fontSize: 32,
            color: '#FFD34D',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>BSP</span>
        </div>

        {/* Right Group: Share + Login/Voucher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            id="share-btn"
            aria-label="Share"
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: 'rgba(255,211,77,0.06)',
              border: '1px solid rgba(255,211,77,0.35)',
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
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              background: '#FFD34D',
              color: '#00172E',
              fontWeight: 800,
              fontSize: headerBtnLabel === 'Receive Voucher' ? 12 : 14,
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

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* ── FLOATING ACTIONS ─────────────────────────────── */}
      <FloatingActions
        hasUnreadChat={hasUnreadChat}
        onOpenChat={handleOpenChat}
      />

      {/* ── AUTH BOTTOM NAV (dashboard routes only) ──────── */}
      <DAppBottomNav />

      {/* ── MODALS / DRAWERS ─────────────────────────────── */}
      <CustomerServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenChat={handleOpenChat}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialSource={headerState === 'login_selected' ? 'receive_voucher' : 'general_support'}
      />

      <SideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        headerState={headerState}
        onLoginTap={() => setHeaderState('login_selected')}
        onOpenChat={handleOpenChat}
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
        right: 14,
        bottom: 'calc(18px + env(safe-area-inset-bottom))',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-end',
      }}
    >
      {/* Check-In button */}
      <button
        id="checkin-btn"
        aria-label="Daily Check-In"
        title="Check-In"
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#FFD34D 0%,#C9A227 100%)',
          color: '#00152B',
          border: '1.5px solid rgba(0,21,43,0.2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          fontSize: 9,
          fontWeight: 800,
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>✓</span>
        <span>CHECK</span>
      </button>

      {/* Customer Service Chat button */}
      <button
        id="cs-chat-btn"
        aria-label="Customer Service Chat"
        onClick={onOpenChat}
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#0A213B 0%,#032C5C 100%)',
          border: '1.5px solid #FFD34D',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {hasUnreadChat && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid #00152B',
          }} />
        )}
      </button>
    </div>
  );
}

/* ============================================================
   BOTTOM NAV — only shown on authenticated app routes
   ============================================================ */
function DAppBottomNav() {
  const pathname = usePathname();
  if (!AUTH_ROUTES.includes(pathname)) return null;

  const navItems = [
    { label: 'Home',      href: '/dashboard',  icon: LayoutDashboard },
    { label: 'Assets',    href: '/assets',     icon: Wallet },
    { label: 'Pledges',   href: '/pledges',    icon: Layers },
    { label: 'Referrals', href: '/referrals',  icon: Users },
    { label: 'Withdraw',  href: '/withdraw',   icon: Landmark },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid rgba(255,211,77,0.12)',
        background: 'rgba(0,21,43,0.97)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: 8,
        paddingLeft: 4,
        paddingRight: 4,
        zIndex: 35,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              paddingBottom: 8,
              textDecoration: 'none',
              color: active ? '#FFD34D' : '#8F98A6',
              userSelect: 'none',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
