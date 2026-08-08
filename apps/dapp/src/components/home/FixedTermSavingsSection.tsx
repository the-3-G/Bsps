'use client';

import React from 'react';
import { SectionShell } from './SectionShell';
import { DemoDataBadge } from './GoldBadge';

const FEATURES = [
  { icon: '🏦', label: 'Stable Returns',   desc: 'Fixed illustrative rate locked for term' },
  { icon: '📋', label: 'Clear Terms',      desc: 'Smart contract enforced conditions' },
  { icon: '⏱️', label: 'Time-Locked',      desc: 'Choose 30, 90, or 180 day terms' },
  { icon: '🔑', label: 'Self-Custody',     desc: 'Your keys, your assets, always' },
  { icon: '📊', label: 'On-Chain Records', desc: 'Fully auditable public ledger' },
];

const TERM_ROWS = [
  { deposit: '500 – 999 USDC',   term30: '4.5%', term90: '6.2%',  term180: '8.8%'  },
  { deposit: '1,000 – 4,999',    term30: '6.2%', term90: '8.8%',  term180: '11.5%' },
  { deposit: '5,000 – 9,999',    term30: '8.8%', term90: '11.5%', term180: '14.2%' },
  { deposit: '10,000 – 49,999',  term30: '11.5%',term90: '14.2%', term180: '17.0%' },
  { deposit: '50,000+',          term30: '14.2%',term90: '17.0%', term180: '20.0%' },
];

// BSP emblem variant for fixed-term
function BspEmblemFixed() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 150, height: 150 }}>
      <circle cx="100" cy="100" r="94" stroke="#FFD34D" strokeWidth="3" opacity="0.3" />
      <circle cx="100" cy="100" r="74" stroke="#E6C45F" strokeWidth="1.5" opacity="0.2" />
      <circle cx="100" cy="100" r="54" fill="rgba(255,211,77,0.08)" stroke="#FFD34D" strokeWidth="1" opacity="0.3" />
      {/* Diamond */}
      <polygon points="100,30 140,100 100,170 60,100"
        fill="url(#g2)" opacity="0.85" />
      <polygon points="100,54 124,100 100,146 76,100"
        fill="#00152B" opacity="0.6" />
      <text x="100" y="107" textAnchor="middle" fill="#FFD34D" fontSize="18" fontWeight="900" fontFamily="Inter,sans-serif">BSP</text>
      <defs>
        <linearGradient id="g2" x1="60" y1="30" x2="140" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD34D" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FixedTermSavingsSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#100D43 0%,#061C35 100%)',
          padding: '48px 16px 40px',
        }}
        aria-label="Fixed-Term Savings Plan"
      >
        <div style={{
          background: 'linear-gradient(160deg,#0A213B 0%,#100D43 100%)',
          borderRadius: 28,
          padding: '36px 20px',
          border: '1px solid rgba(255,211,77,0.18)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.45)',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              FIXED-TERM SAVINGS PLAN
            </p>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(28px, 8.5vw, 42px)',
              color: '#FFD34D',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}>
              Fixed-Term Savings Plan
            </h2>
            <DemoDataBadge />
          </div>

          {/* Feature Grid 3 + 2 */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              {FEATURES.slice(0, 3).map((f) => (
                <FeatureCell key={f.label} icon={f.icon} label={f.label} desc={f.desc} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 280, margin: '0 auto' }}>
              {FEATURES.slice(3).map((f) => (
                <FeatureCell key={f.label} icon={f.icon} label={f.label} desc={f.desc} />
              ))}
            </div>
          </div>

          {/* Fixed-Term Table */}
          <p style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Fixed-Term Savings Plan
          </p>
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,211,77,0.15)',
            marginBottom: 32,
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              background: 'rgba(255,211,77,0.08)',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,211,77,0.12)',
              gap: 8,
            }}>
              <span style={{ color: '#FFD34D', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Deposit (USDC)
              </span>
              {['30d', '90d', '180d'].map(h => (
                <span key={h} style={{ color: '#FFD34D', fontSize: 12, fontWeight: 700, textAlign: 'right', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {h}
                </span>
              ))}
            </div>

            {TERM_ROWS.map((row, i) => (
              <div
                key={row.deposit}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '16px 16px',
                  borderBottom: i < TERM_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#CBD5E1', fontSize: 'clamp(12px, 3.5vw, 15px)', fontWeight: 500 }}>
                  {row.deposit}
                </span>
                {[row.term30, row.term90, row.term180].map((val, vi) => (
                  <span key={vi} style={{ color: '#FFD34D', fontSize: 'clamp(13px, 3.8vw, 17px)', fontWeight: 700, textAlign: 'right' }}>
                    {val}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Emblem */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div className="anim-float-med">
              <BspEmblemFixed />
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{
            textAlign: 'center',
            color: '#8F98A6',
            fontSize: 12,
            lineHeight: 1.6,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 16,
            marginTop: 0,
          }}>
            Terms and Conditions Apply. All rates are illustrative and for educational reference only.
            Not financial advice. Past performance does not guarantee future results.
          </p>
        </div>
      </section>
    </SectionShell>
  );
}

function FeatureCell({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{
      background: 'rgba(255,211,77,0.05)',
      border: '1px solid rgba(255,211,77,0.12)',
      borderRadius: 16,
      padding: '20px 10px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ fontSize: 30, lineHeight: 1 }}>{icon}</span>
      <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
      <span style={{ color: '#8F98A6', fontSize: 10, lineHeight: 1.4 }}>{desc}</span>
    </div>
  );
}
