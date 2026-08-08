'use client';

import React from 'react';
import { SectionShell } from './SectionShell';

// Inline SVG for smart contract visualization
function SmartContractSvg() {
  return (
    <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 360, height: 'auto' }}>
      {/* Document body */}
      <rect x="80" y="20" width="160" height="200" rx="14" fill="#0A213B" stroke="#FFD34D" strokeWidth="2" />
      {/* Document header line */}
      <rect x="80" y="20" width="160" height="44" rx="14" fill="#FFD34D" />
      <rect x="80" y="50" width="160" height="14" fill="#FFD34D" />
      <text x="160" y="48" textAnchor="middle" fill="#00152B" fontSize="13" fontWeight="900" fontFamily="Inter,sans-serif">
        SMART CONTRACT
      </text>

      {/* Code lines */}
      {[70, 88, 106, 124, 142, 160, 178].map((y, i) => (
        <rect key={i} x="100" y={y} width={60 + (i % 3) * 30} height="6" rx="3"
          fill={i % 2 === 0 ? 'rgba(255,211,77,0.4)' : 'rgba(255,255,255,0.15)'} />
      ))}

      {/* "Execute" arrows flowing out */}
      <path d="M240 90 L280 80 L280 100 Z" fill="#FFD34D" opacity="0.8" />
      <line x1="240" y1="90" x2="280" y2="90" stroke="#FFD34D" strokeWidth="2" />

      <path d="M240 140 L280 130 L280 150 Z" fill="#E6C45F" opacity="0.7" />
      <line x1="240" y1="140" x2="280" y2="140" stroke="#E6C45F" strokeWidth="2" />

      {/* Result nodes */}
      <circle cx="298" cy="90" r="14" fill="rgba(255,211,77,0.15)" stroke="#FFD34D" strokeWidth="1.5" />
      <text x="298" y="95" textAnchor="middle" fill="#FFD34D" fontSize="9" fontFamily="monospace">TX</text>

      <circle cx="298" cy="140" r="14" fill="rgba(230,196,95,0.12)" stroke="#E6C45F" strokeWidth="1.5" />
      <text x="298" y="145" textAnchor="middle" fill="#E6C45F" fontSize="9" fontFamily="monospace">✓</text>

      {/* Blockchain nodes around */}
      <circle cx="30" cy="100" r="20" fill="rgba(255,211,77,0.08)" stroke="#FFD34D" strokeWidth="1" opacity="0.7" />
      <text x="30" y="105" textAnchor="middle" fill="#FFD34D" fontSize="8" fontFamily="monospace">NODE</text>
      <line x1="50" y1="100" x2="80" y2="110" stroke="rgba(255,211,77,0.3)" strokeWidth="1" strokeDasharray="3 3" />

      <circle cx="30" cy="160" r="20" fill="rgba(255,211,77,0.08)" stroke="#E6C45F" strokeWidth="1" opacity="0.6" />
      <text x="30" y="165" textAnchor="middle" fill="#E6C45F" fontSize="8" fontFamily="monospace">NODE</text>
      <line x1="50" y1="160" x2="80" y2="150" stroke="rgba(230,196,95,0.3)" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
}

export function SmartContractsSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#100D43 0%,#061C35 100%)',
          padding: '56px 20px 56px',
          width: '100%',
        }}
        aria-label="Smart Contracts"
      >
        {/* Label */}
        <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Protocol Technology
        </p>

        <h2 style={{
          fontWeight: 900,
          fontSize: 'clamp(30px, 9.5vw, 46px)',
          color: '#FFD34D',
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
          margin: '0 0 24px',
        }}>
          SMART CONTRACT
        </h2>

        <p style={{
          color: 'rgba(255,255,255,0.82)',
          fontSize: 'clamp(16px, 4.5vw, 20px)',
          lineHeight: 1.7,
          margin: '0 0 24px',
          maxWidth: 480,
        }}>
          A smart contract is a self-executing program stored on a blockchain. When predetermined
          conditions are met, the contract executes automatically — no intermediaries, no manual
          processing, no trust required.
        </p>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 'clamp(14px, 4vw, 18px)',
          lineHeight: 1.7,
          margin: '0 0 40px',
          maxWidth: 480,
        }}>
          BSP's savings and interest distribution mechanisms are governed entirely by smart contracts
          deployed to the public blockchain. The rules are transparent, immutable, and enforced
          without human intervention.
        </p>

        {/* Large SVG illustration */}
        <div
          className="anim-float-slow"
          style={{ width: '100%', maxWidth: 400, margin: '0 auto 40px' }}
        >
          <SmartContractSvg />
        </div>

        {/* Key properties */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}>
          {[
            { icon: '⚙️', label: 'Self-Executing',   text: 'Runs automatically when conditions are met' },
            { icon: '🔒', label: 'Immutable',         text: 'Cannot be altered after deployment' },
            { icon: '👁️', label: 'Transparent',       text: 'Code is publicly readable on-chain' },
            { icon: '⚡', label: 'Trustless',         text: 'No need to trust a third party' },
          ].map((item) => (
            <div key={item.label} style={{
              padding: '18px 14px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,211,77,0.1)',
            }}>
              <span style={{ fontSize: 26, display: 'block', marginBottom: 8 }}>{item.icon}</span>
              <div style={{ color: '#FFD34D', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </section>
    </SectionShell>
  );
}
