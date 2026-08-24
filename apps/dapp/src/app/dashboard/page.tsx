'use client';

import React from 'react';

export default function DashboardPage() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#00152B' }}>
      {/* Pool Data Card */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #0A213B 0%, #0D1E33 100%)',
          borderRadius: 20,
          padding: '28px 24px',
          border: '1px solid rgba(255,211,77,0.12)',
        }}>
          {/* Title */}
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#00E6CC',
            marginBottom: 28,
            lineHeight: 1.2,
          }}>
            Pool data
          </h2>

          {/* Divider */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, rgba(255,211,77,0.2), transparent)',
            marginBottom: 24,
          }} />

          {/* Total dividend data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(255,211,77,0.15) 0%, rgba(255,211,77,0.05) 100%)',
              border: '1px solid rgba(255,211,77,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#FFD34D" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#FFD34D" strokeWidth="1.8" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#FFD34D" strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#FFD34D" strokeWidth="1.8" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#8F98A6',
                marginBottom: 4,
              }}>Total dividend data</div>
              <div style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
              }}>3,649,453 ETH</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

          {/* Participant */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(255,211,77,0.15) 0%, rgba(255,211,77,0.05) 100%)',
              border: '1px solid rgba(255,211,77,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="#FFD34D" strokeWidth="1.8" />
                <path d="M8 12h8M12 8v8" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#8F98A6',
                marginBottom: 4,
              }}>Participant</div>
              <div style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
              }}>1,383,269</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

          {/* User revenue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(255,211,77,0.15) 0%, rgba(255,211,77,0.05) 100%)',
              border: '1px solid rgba(255,211,77,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#FFD34D" strokeWidth="1.8" />
                <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#8F98A6',
                marginBottom: 4,
              }}>User revenue</div>
              <div style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
              }}>8,315,653,435 USDC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 40 }} />
    </div>
  );
}
