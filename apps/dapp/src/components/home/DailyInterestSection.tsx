'use client';

import React from 'react';
import Image from 'next/image';
import { SectionShell } from './SectionShell';

const RULES = [
  {
    number: '01',
    icon: '⚡',
    title: 'Flexible',
    body: 'Withdraw or deposit at any time with no lock-up periods. Interest is calculated daily based on your current balance and settled automatically by the smart contract.',
  },
  {
    number: '02',
    icon: '🔐',
    title: 'Asset Safety',
    body: 'Your assets are held in non-custodial smart contracts auditable on the public blockchain. No centralized authority holds your funds. Your private keys remain under your sole control.',
  },
  {
    number: '03',
    icon: '💸',
    title: 'Fees',
    body: 'The protocol charges no platform fees for flexible savings operations. Standard network gas fees apply when executing on-chain transactions. Rates shown are illustrative and for educational reference only.',
  },
];

export function DailyInterestSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#00152B 0%,#061C35 100%)',
          padding: '56px 16px 56px',
          width: '100%',
        }}
        aria-label="Daily Interest Rule"
      >
        {/* Section Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#FFD34D', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            How It Works
          </p>
          <h2 style={{
            fontWeight: 900,
            fontSize: 'clamp(32px, 9.5vw, 46px)',
            color: '#FFFFFF',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Daily Interest Rule
          </h2>
        </div>

        {/* Editorial rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {RULES.map((rule, i) => (
            <div
              key={rule.number}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 24,
                padding: '36px 0',
                borderBottom: i < RULES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* Large icon area */}
              <div style={{
                width: 110,
                height: 110,
                borderRadius: 24,
                background: 'linear-gradient(135deg,rgba(255,211,77,0.12),rgba(255,211,77,0.04))',
                border: '1.5px solid rgba(255,211,77,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 40, lineHeight: 1 }}>{rule.icon}</span>
                <span style={{ color: 'rgba(255,211,77,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                  {rule.number}
                </span>
              </div>

              {/* Text */}
              <div style={{ flex: 1, paddingTop: 4 }}>
                <h3 style={{
                  fontWeight: 800,
                  fontSize: 'clamp(22px, 6.5vw, 30px)',
                  color: '#FFD34D',
                  lineHeight: 1.15,
                  margin: '0 0 12px',
                }}>
                  {rule.title}
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 'clamp(15px, 4.2vw, 18px)',
                  lineHeight: 1.68,
                  margin: 0,
                }}>
                  {rule.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Safety illustration */}
        <div style={{
          marginTop: 48,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div className="anim-float-slow" style={{ width: '100%', maxWidth: 340 }}>
            <Image
              src="/images/daily-interest.png"
              alt="Asset safety illustration"
              width={340}
              height={260}
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#8F98A6',
          fontSize: 12,
          marginTop: 24,
          lineHeight: 1.6,
        }}>
          Educational content only. Not financial advice. Terms and conditions apply.
        </p>
      </section>
    </SectionShell>
  );
}
