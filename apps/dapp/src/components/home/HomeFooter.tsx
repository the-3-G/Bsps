'use client';

import React from 'react';
import Link from 'next/link';

export function HomeFooter() {
  return (
    <footer
      style={{
        background: 'linear-gradient(180deg,#00152B 0%,#000D1A 100%)',
        borderTop: '1px solid rgba(255,211,77,0.1)',
        padding: '40px 24px calc(40px + env(safe-area-inset-bottom))',
      }}
      aria-label="Site footer"
    >
      {/* BSP mark */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 28,
        gap: 8,
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#FFD34D,#C9A227)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 16,
          color: '#00152B',
          marginBottom: 4,
        }}>
          BSP
        </div>
        <span style={{ fontWeight: 900, fontSize: 26, color: '#FFD34D', letterSpacing: '-0.02em' }}>BSP</span>
        <p style={{ color: '#8F98A6', fontSize: 13, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          Blockchain Savings Portal<br />
          <span style={{ fontSize: 11, color: 'rgba(143,152,166,0.7)' }}>Educational Demo Platform</span>
        </p>
      </div>

      {/* Nav links */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 28,
      }}>
        {[
          { label: 'BSP',              href: '/' },
          { label: 'Terms',            href: '/' },
          { label: 'Privacy',          href: '/' },
          { label: 'Help Center',      href: '/' },
          { label: 'Customer Service', href: '/' },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{
              color: '#8F98A6',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#FFD34D';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,211,77,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#8F98A6';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />

      {/* Disclaimer */}
      <p style={{
        color: 'rgba(143,152,166,0.6)',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 1.7,
        margin: '0 auto',
        maxWidth: 480,
      }}>
        All content on this portal is for educational and illustrative purposes only.
        Not financial advice. Digital assets carry risk. Always conduct your own research.
      </p>
      <p style={{ color: 'rgba(143,152,166,0.4)', fontSize: 10, textAlign: 'center', marginTop: 10 }}>
        &copy; 2026 BSP Blockchain Savings Portal. All rights reserved.
      </p>
    </footer>
  );
}
