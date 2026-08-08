'use client';

import React from 'react';
import { SectionShell } from './SectionShell';
import { DemoDataBadge } from './GoldBadge';

const FEATURES = [
  {
    icon: '🔍',
    label: 'Transparency',
    desc: 'All activity recorded on public blockchain',
  },
  {
    icon: '🔒',
    label: 'Security',
    desc: 'Non-custodial, your keys stay with you',
  },
  {
    icon: '🌐',
    label: 'Global Access',
    desc: 'Open to participants worldwide, 24/7',
  },
  {
    icon: '⛓️',
    label: 'Decentralization',
    desc: 'No single point of control or failure',
  },
  {
    icon: '🛡️',
    label: 'Tamper-Proof',
    desc: 'Immutable smart contract rules',
  },
];

const SAVINGS_ROWS = [
  { deposit: '500 – 999 USDC',   rate: '3.2% – 4.8%' },
  { deposit: '1,000 – 4,999',    rate: '4.8% – 6.5%' },
  { deposit: '5,000 – 9,999',    rate: '6.5% – 8.2%' },
  { deposit: '10,000 – 49,999',  rate: '8.2% – 10.0%' },
  { deposit: '50,000+',          rate: '10.0% – 12.5%' },
];

// Inline SVG BSP emblem
function BspEmblem() {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 140, height: 140 }}>
      <circle cx="90" cy="90" r="85" stroke="#FFD34D" strokeWidth="4" opacity="0.4" />
      <circle cx="90" cy="90" r="66" stroke="#E6C45F" strokeWidth="2" opacity="0.3" />
      <polygon points="90,20 110,70 164,70 120,102 138,155 90,123 42,155 60,102 16,70 70,70"
        fill="url(#gold-grad)" opacity="0.9" />
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD34D" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
      </defs>
      <text x="90" y="98" textAnchor="middle" fill="#00152B" fontSize="22" fontWeight="900" fontFamily="Inter,sans-serif">BSP</text>
    </svg>
  );
}

export function FlexibleSavingsSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#061C35 0%,#0A213B 100%)',
          padding: '48px 16px 40px',
        }}
        aria-label="Flexible Savings Plan"
      >
        <div style={{
          background: 'linear-gradient(160deg,#0A213B 0%,#061C35 100%)',
          borderRadius: 28,
          padding: '36px 20px',
          border: '1px solid rgba(255,211,77,0.15)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              FLEXIBLE SAVINGS PLAN
            </p>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(30px, 9vw, 44px)',
              color: '#FFD34D',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}>
              Flexible Savings Plan
            </h2>
            <DemoDataBadge />
          </div>

          {/* Feature Grid 3 + 2 */}
          <div style={{ marginBottom: 32 }}>
            {/* Row 1: 3 items */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              {FEATURES.slice(0, 3).map((f) => (
                <FeatureCell key={f.label} icon={f.icon} label={f.label} desc={f.desc} />
              ))}
            </div>
            {/* Row 2: 2 items centered */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 280, margin: '0 auto' }}>
              {FEATURES.slice(3).map((f) => (
                <FeatureCell key={f.label} icon={f.icon} label={f.label} desc={f.desc} />
              ))}
            </div>
          </div>

          {/* Savings Table */}
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,211,77,0.15)',
            marginBottom: 32,
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(255,211,77,0.08)',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,211,77,0.12)',
            }}>
              <span style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Deposit (USDC)
              </span>
              <span style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>
                Illustrative Rate
              </span>
            </div>

            {SAVINGS_ROWS.map((row, i) => (
              <div
                key={row.deposit}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  padding: '18px 20px',
                  borderBottom: i < SAVINGS_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                <span style={{ color: '#CBD5E1', fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 500 }}>
                  {row.deposit}
                </span>
                <span style={{ color: '#FFD34D', fontSize: 'clamp(15px, 4.2vw, 19px)', fontWeight: 700, textAlign: 'right' }}>
                  {row.rate}
                </span>
              </div>
            ))}
          </div>

          {/* BSP Emblem */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div className="anim-float-med">
              <BspEmblem />
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
            Terms and Conditions Apply. Rates shown are illustrative and educational only.
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
      padding: '20px 12px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>
      <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
      <span style={{ color: '#8F98A6', fontSize: 11, lineHeight: 1.4 }}>{desc}</span>
    </div>
  );
}
