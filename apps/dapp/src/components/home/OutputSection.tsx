'use client';

import React from 'react';
import { SectionShell } from './SectionShell';

// Fictional masked output addresses
const OUTPUT_ROWS = [
  { address: '0x3a8f...d921', quantity: '12,847.34' },
  { address: '0x7c1e...44ab', quantity: '7,523.81' },
  { address: '0xf04b...9c17', quantity: '23,291.55' },
  { address: '0x2d5a...7f3e', quantity: '4,891.20' },
  { address: '0x9b3c...12fa', quantity: '18,748.06' },
  { address: '0x6e7d...c581', quantity: '3,634.44' },
  { address: '0x1a2f...8b0d', quantity: '31,112.77' },
  { address: '0xd983...550c', quantity: '9,009.90' },
  { address: '0x5f4a...23ee', quantity: '2,764.15' },
  { address: '0x8c6b...91f2', quantity: '45,403.61' },
];

export function OutputSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#0A213B 0%,#061C35 100%)',
          padding: '48px 16px 48px',
        }}
        aria-label="Output Records"
      >
        <div style={{
          background: 'linear-gradient(160deg,#00152B 0%,#0A213B 100%)',
          borderRadius: 28,
          padding: '32px 20px',
          border: '1px solid rgba(255,211,77,0.12)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(28px, 8.5vw, 40px)',
              color: '#FFD34D',
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}>
              Output
            </h2>
            <p style={{ color: '#8F98A6', fontSize: 14, margin: 0 }}>
              Illustrative output records — demo data
            </p>
          </div>

          {/* Table */}
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,211,77,0.12)',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              background: 'rgba(255,211,77,0.07)',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,211,77,0.1)',
              gap: 16,
            }}>
              <span style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Address</span>
              <span style={{ color: '#FFD34D', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Quantity (USDC)</span>
            </div>

            {OUTPUT_ROWS.map((row, i) => (
              <div
                key={row.address}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  padding: '16px 20px',
                  borderBottom: i < OUTPUT_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <span style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 'clamp(13px, 3.8vw, 16px)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em',
                }}>
                  {row.address}
                </span>
                <span style={{
                  color: '#FFD34D',
                  fontSize: 'clamp(14px, 4vw, 18px)',
                  fontWeight: 800,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}>
                  {row.quantity}
                </span>
              </div>
            ))}
          </div>

          <p style={{
            color: '#8F98A6',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 1.6,
          }}>
            All addresses are fictional and shown for illustrative purposes only.
            This does not represent real on-chain balances.
          </p>
        </div>
      </section>
    </SectionShell>
  );
}
