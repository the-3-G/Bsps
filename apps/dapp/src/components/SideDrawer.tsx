'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Home, Image, TrendingUp, Cpu, FileText, UserCheck, MessageSquare } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  headerState: 'guest' | 'voucher_requested';
  onLoginTap: () => void;
  onOpenChat: () => void;
}

const MENU_ITEMS = [
  { label: 'Home',      href: '/',          icon: Home },
  { label: 'NFT',       href: '/assets',    icon: Image },
  { label: 'Trading',   href: '/dashboard', icon: TrendingUp },
  { label: 'Pool Data', href: '/pledges',   icon: Cpu },
  { label: 'Loan',      href: '/loan',      icon: FileText },

  { label: 'Paper',     href: '/referrals', icon: FileText },
];

export function SideDrawer({ isOpen, onClose, headerState, onLoginTap, onOpenChat }: SideDrawerProps) {
  const router = useRouter();
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          width: '83vw',
          maxWidth: 340,
          height: '100%',
          background: 'linear-gradient(160deg,#00152B 0%,#061C35 100%)',
          borderRight: '1px solid rgba(255,211,77,0.15)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '8px 0 48px rgba(0,0,0,0.6)',
          animation: 'slide-in-left 0.3s cubic-bezier(0.16,1,0.3,1) both',
          overflowY: 'auto',
        }}
      >
        {/* Top BSP Mark */}
        <div style={{
          padding: '48px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,211,77,0.1)',
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#FFD34D 0%,#C9A227 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 22,
            color: '#00152B',
            letterSpacing: '-0.02em',
            boxShadow: '0 4px 24px rgba(255,211,77,0.35)',
          }}>
            BSP
          </div>
          <span style={{
            fontWeight: 900,
            fontSize: 28,
            color: '#FFD34D',
            letterSpacing: '-0.02em',
          }}>
            BSP
          </span>
          <span style={{ color: '#8F98A6', fontSize: 13, fontWeight: 500 }}>
            Blockchain Savings Portal
          </span>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 16px',
                  borderRadius: 16,
                  textDecoration: 'none',
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 4,
                  background: 'transparent',
                  transition: 'background 0.2s, color 0.2s',
                  animationDelay: `${i * 0.05}s`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,211,77,0.07)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#FFD34D';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF';
                }}
              >
                {/* Icon area */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255,211,77,0.07)',
                  border: '1px solid rgba(255,211,77,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={22} color="#FFD34D" />
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,211,77,0.1)', margin: '12px 0' }} />

          {/* Account Login / Customer Service */}
          {headerState === 'guest' ? (
            <button
              onClick={() => {
                onClose();
                onLoginTap();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 16px',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg,rgba(255,211,77,0.12),rgba(255,211,77,0.06))',
                borderTop: '1px solid rgba(255,211,77,0.25)',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(255,211,77,0.15)',
                border: '1px solid rgba(255,211,77,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <UserCheck size={22} color="#FFD34D" />
              </div>
              <span style={{ flex: 1, color: '#FFD34D', fontSize: 18, fontWeight: 800 }}>
                Account Login
              </span>
              <ChevronRight size={18} color="#FFD34D" />
            </button>
          ) : (
            <button
              onClick={() => { onClose(); onOpenChat(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 16px',
                borderRadius: 16,
                border: '1px solid rgba(255,211,77,0.3)',
                cursor: 'pointer',
                background: 'rgba(255,211,77,0.06)',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(255,211,77,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageSquare size={22} color="#FFD34D" />
              </div>
              <span style={{ flex: 1, color: '#FFD34D', fontSize: 18, fontWeight: 800 }}>
                Customer Service
              </span>
              <ChevronRight size={18} color="#FFD34D" />
            </button>
          )}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,211,77,0.08)',
          color: '#8F98A6',
          fontSize: 12,
          textAlign: 'center',
        }}>
          BSP Blockchain Savings Portal &copy; 2026
          <br />
          <span style={{ color: 'rgba(143,152,166,0.5)', fontSize: 11 }}>Educational Demo Platform</span>
        </div>
      </div>

      {/* Inline keyframe for slide animation */}
      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
