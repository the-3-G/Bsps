'use client';

import React from 'react';
import Image from 'next/image';
import { SectionShell } from './SectionShell';

export function DappsSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#100D43 0%,#032C5C 100%)',
          padding: '56px 20px 48px',
          width: '100%',
        }}
        aria-label="What are dApps?"
      >
        {/* Label */}
        <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Web3 Education
        </p>

        <h2 style={{
          fontWeight: 900,
          fontSize: 'clamp(32px, 9.5vw, 46px)',
          color: '#FFD34D',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          margin: '0 0 20px',
        }}>
          What are dApps?
        </h2>

        <p style={{
          color: 'rgba(255,255,255,0.82)',
          fontSize: 'clamp(16px, 4.5vw, 20px)',
          lineHeight: 1.7,
          margin: '0 0 36px',
          maxWidth: 480,
        }}>
          Decentralized applications (dApps) are software programs that run on a blockchain or peer-to-peer network
          rather than on centralized servers controlled by a single company.
        </p>

        <p style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 'clamp(14px, 4vw, 18px)',
          lineHeight: 1.7,
          margin: '0 0 36px',
          maxWidth: 480,
        }}>
          Unlike traditional apps, dApps have no single point of failure, are resistant to censorship,
          and allow users to interact directly without intermediaries. Your data and assets remain
          under your control at all times.
        </p>

        {/* Large illustration */}
        <div
          className="anim-float-slow"
          style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}
        >
          <Image
            src="/images/dapps.png"
            alt="dApps ecosystem illustration"
            width={420}
            height={320}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Feature bullets */}
        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '🚫', label: 'No Central Authority',   text: 'dApps operate without any single controlling entity' },
            { icon: '🔗', label: 'Smart Contract Powered', text: 'Rules are enforced automatically by code, not humans' },
            { icon: '👁️', label: 'Transparent',            text: 'All transactions are visible on the public blockchain' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '18px 16px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <div>
                <div style={{ color: '#FFD34D', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.55 }}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SectionShell>
  );
}
