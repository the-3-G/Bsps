'use client';

import React from 'react';
import { SectionShell } from './SectionShell';
import { DemoDataBadge } from './GoldBadge';

// Fictional masked addresses for demo
const POOL_ACTIVITY = [
  { region: 'Asia Pacific', address: '0x3a8f...d921', output: '2,847.34 USDC' },
  { region: 'Europe',       address: '0x7c1e...44ab', output: '1,523.81 USDC' },
  { region: 'North America',address: '0xf04b...9c17', output: '3,291.55 USDC' },
  { region: 'South America',address: '0x2d5a...7f3e', output: '891.20 USDC' },
  { region: 'Middle East',  address: '0x9b3c...12fa', output: '1,748.06 USDC' },
  { region: 'Africa',       address: '0x6e7d...c581', output: '634.44 USDC' },
  { region: 'Asia Pacific', address: '0x1a2f...8b0d', output: '4,112.77 USDC' },
  { region: 'Europe',       address: '0xd983...550c', output: '2,009.90 USDC' },
  { region: 'Oceania',      address: '0x5f4a...23ee', output: '764.15 USDC' },
  { region: 'North America',address: '0x8c6b...91f2', output: '5,403.61 USDC' },
];

// Inline SVG mining/computing illustration
function ComputingIllustration() {
  return (
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 200, height: 'auto' }}>
      {/* Server racks */}
      <rect x="20" y="30" width="60" height="100" rx="8" fill="#0A213B" stroke="#FFD34D" strokeWidth="1.5" />
      <rect x="28" y="40" width="44" height="8" rx="2" fill="#032C5C" />
      <rect x="28" y="52" width="44" height="8" rx="2" fill="#032C5C" />
      <rect x="28" y="64" width="44" height="8" rx="2" fill="#032C5C" />
      <rect x="28" y="76" width="44" height="8" rx="2" fill="#032C5C" />
      <circle cx="62" cy="44" r="2.5" fill="#4ade80" />
      <circle cx="62" cy="56" r="2.5" fill="#FFD34D" />
      <circle cx="62" cy="68" r="2.5" fill="#4ade80" />
      <circle cx="62" cy="80" r="2.5" fill="#FFD34D" />

      {/* Second rack */}
      <rect x="90" y="50" width="50" height="80" rx="8" fill="#0A213B" stroke="#E6C45F" strokeWidth="1.5" />
      <rect x="98" y="60" width="34" height="7" rx="2" fill="#032C5C" />
      <rect x="98" y="71" width="34" height="7" rx="2" fill="#032C5C" />
      <rect x="98" y="82" width="34" height="7" rx="2" fill="#032C5C" />
      <circle cx="124" cy="63" r="2" fill="#4ade80" />
      <circle cx="124" cy="74" r="2" fill="#FFD34D" />
      <circle cx="124" cy="85" r="2" fill="#4ade80" />

      {/* Connecting lines (data flow) */}
      <line x1="80" y1="70" x2="90" y2="90" stroke="#FFD34D" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
      <line x1="140" y1="90" x2="170" y2="60" stroke="#E6C45F" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

      {/* Floating coin */}
      <circle cx="170" cy="50" r="18" fill="url(#coin-grad)" />
      <text x="170" y="55" textAnchor="middle" fill="#00152B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">BSP</text>
      <defs>
        <radialGradient id="coin-grad">
          <stop offset="0%" stopColor="#FFD34D" />
          <stop offset="100%" stopColor="#C9A227" />
        </radialGradient>
      </defs>

      {/* Node dots */}
      <circle cx="160" cy="110" r="5" fill="#FFD34D" opacity="0.7" />
      <circle cx="175" cy="130" r="3.5" fill="#E6C45F" opacity="0.5" />
    </svg>
  );
}

export function ComputingPoolSection() {
  return (
    <SectionShell>
      <section
        style={{ background: 'linear-gradient(160deg,#00152B 0%,#032C5C 100%)' }}
        aria-label="Computing Pool"
      >
        {/* Gold Banner */}
        <div style={{
          background: 'linear-gradient(135deg,#FFD34D 0%,#E6C45F 100%)',
          padding: '32px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 240,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              color: '#00152B',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 8px',
            }}>
              Public Network Activity
            </p>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(32px, 10vw, 48px)',
              color: '#00152B',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '0 0 12px',
            }}>
              Computing Pool
            </h2>
            <p style={{ color: 'rgba(0,21,43,0.65)', fontSize: 'clamp(13px, 3.8vw, 17px)', lineHeight: 1.55, margin: 0 }}>
              Public blockchain network activity shown for educational and transparency purposes.
            </p>
            <div style={{ marginTop: 16 }}>
              <DemoDataBadge label="DEMO DATA — NOT REAL BALANCES" />
            </div>
          </div>

          {/* Illustration */}
          <div
            className="anim-float-slow"
            style={{ width: 140, flexShrink: 0 }}
          >
            <ComputingIllustration />
          </div>
        </div>

        {/* Activity list */}
        <div style={{ padding: '24px 16px 40px' }}>
          <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Public Chain Activity Records
          </p>

          {POOL_ACTIVITY.map((record, i) => (
            <div
              key={i}
              style={{
                padding: '18px 0',
                borderBottom: i < POOL_ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ color: '#8F98A6', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>
                  {record.region}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'monospace' }}>
                  {record.address}
                </div>
              </div>
              <div style={{
                color: '#FFD34D',
                fontSize: 'clamp(15px, 4vw, 18px)',
                fontWeight: 800,
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}>
                {record.output}
              </div>
            </div>
          ))}

          <p style={{ color: '#8F98A6', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
            Addresses are fictional and masked for demonstration purposes only.
            No real user data is displayed.
          </p>
        </div>
      </section>
    </SectionShell>
  );
}
