'use client';

import React from 'react';
import Image from 'next/image';
import { SectionShell } from './SectionShell';

export function Web3BenefitsSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#00152B 0%,#100D43 100%)',
          padding: '56px 20px 56px',
          width: '100%',
        }}
        aria-label="Web3 Benefits and Own Your Data"
      >
        {/* Label */}
        <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          The Web3 Advantage
        </p>

        <h2 style={{
          fontWeight: 900,
          fontSize: 'clamp(28px, 8.5vw, 44px)',
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}>
          What are the benefits of <span style={{ color: '#FFD34D' }}>Web3.0?</span>
        </h2>

        <h3 style={{
          fontWeight: 900,
          fontSize: 'clamp(22px, 7vw, 36px)',
          color: '#FFD34D',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '0 0 20px',
        }}>
          Own Your Data
        </h3>

        <p style={{
          color: 'rgba(255,255,255,0.78)',
          fontSize: 'clamp(15px, 4.2vw, 19px)',
          lineHeight: 1.7,
          margin: '0 0 32px',
          maxWidth: 480,
        }}>
          In Web3, you are in control of your own digital identity, assets, and data.
          No corporation can freeze your account, censor your transactions, or
          harvest your personal information without consent.
        </p>

        {/* Large illustration */}
        <div
          className="anim-float-slow"
          style={{ width: '100%', maxWidth: 380, margin: '0 auto 36px' }}
        >
          <Image
            src="/images/web3-benefits.png"
            alt="Own Your Data - Web3 illustration"
            width={380}
            height={320}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Benefits list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              icon: '👤',
              title: 'Self-Sovereign Identity',
              text: 'Your wallet address is your identity. No KYC required to interact with open protocols.',
            },
            {
              icon: '💾',
              title: 'Data Portability',
              text: 'Your on-chain history is public and permanent. Move between dApps freely with no data lock-in.',
            },
            {
              icon: '🌍',
              title: 'Censorship Resistance',
              text: 'Blockchain protocols operate without geographic restrictions and cannot be shut down by any single authority.',
            },
            {
              icon: '🔓',
              title: 'Permissionless Access',
              text: 'Anyone with an internet connection and a compatible wallet can access open Web3 protocols.',
            },
          ].map((item) => (
            <div key={item.title} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '20px 16px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,211,77,0.09)',
            }}>
              <span style={{ fontSize: 30, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <div>
                <div style={{ color: '#FFD34D', fontSize: 'clamp(15px, 4.2vw, 18px)', fontWeight: 700, marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(13px, 3.8vw, 16px)', lineHeight: 1.6 }}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SectionShell>
  );
}
