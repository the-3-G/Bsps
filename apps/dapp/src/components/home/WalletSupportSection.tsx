'use client';

import React from 'react';
import { SectionShell } from './SectionShell';

// Wallet logos as clean wordmarks (text-based since official SVGs not available locally)
const WALLET_CATEGORIES = [
  {
    category: 'Mobile',
    wallets: [
      { name: 'Bitget Wallet', color: '#00C7BE', symbol: 'B' },
      { name: 'MetaMask',      color: '#F6851B', symbol: 'M' },
      { name: 'Coinbase',      color: '#0052FF', symbol: 'C' },
      { name: 'Trust Wallet',  color: '#3375BB', symbol: 'T' },
      { name: 'Opera Crypto',  color: '#FF1B2D', symbol: 'O' },
      { name: 'SafePal',       color: '#0068FF', symbol: 'S' },
      { name: 'Coin98',        color: '#F0B90B', symbol: '98' },
      { name: 'imToken',       color: '#1B5DEB', symbol: 'i' },
      { name: 'Status',        color: '#5B6FEE', symbol: 'S' },
    ],
  },
  {
    category: 'Hardware',
    wallets: [
      { name: 'Ledger',    color: '#000000', symbol: 'L' },
      { name: 'Trezor',    color: '#279B6B', symbol: 'T' },
      { name: 'Keystone',  color: '#1B3A6B', symbol: 'K' },
    ],
  },
  {
    category: 'Smart Contract',
    wallets: [
      { name: 'Safe Wallet', color: '#12FF80', symbol: 'S' },
      { name: 'Argent',      color: '#FF875B', symbol: 'A' },
    ],
  },
  {
    category: 'Other',
    wallets: [
      { name: 'MyEtherWallet', color: '#02A9F4', symbol: 'E' },
      { name: 'MyCrypto',      color: '#007896', symbol: 'C' },
    ],
  },
];

function WalletMark({ name, color, symbol }: { name: string; color: string; symbol: string }) {
  return (
    <div
      className="logo-wall-item"
      style={{ flexDirection: 'column', gap: 8, minHeight: 80 }}
    >
      {/* Brand mark circle */}
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        background: color === '#000000' ? '#1a1a1a' : `${color}22`,
        border: `1.5px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color === '#000000' ? '#ffffff' : color,
        fontWeight: 900,
        fontSize: symbol.length > 1 ? 14 : 20,
        letterSpacing: '-0.02em',
      }}>
        {symbol}
      </div>
      <span style={{
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: 600,
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {name}
      </span>
    </div>
  );
}

export function WalletSupportSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#0A213B 0%,#061C35 100%)',
          padding: '48px 16px 48px',
        }}
        aria-label="Blockchain Wallet Support"
      >
        {/* Large navy panel */}
        <div style={{
          background: 'linear-gradient(160deg,#00152B 0%,#0A213B 100%)',
          borderRadius: 28,
          padding: '32px 20px',
          border: '1px solid rgba(255,211,77,0.12)',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Compatible Wallet Examples
            </p>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(24px, 7.5vw, 36px)',
              color: '#FFFFFF',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
            }}>
              Blockchain wallets with dApp support
            </h2>
            <p style={{ color: '#8F98A6', fontSize: 'clamp(13px, 3.8vw, 16px)', lineHeight: 1.6, margin: 0 }}>
              BSP is compatible with industry-standard Web3 wallets that support dApp browsing.
              No partnership or endorsement is implied.
            </p>
          </div>

          {/* Categories */}
          {WALLET_CATEGORIES.map((cat) => (
            <div key={cat.category} style={{ marginBottom: 28 }}>
              {/* Category label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}>
                <div style={{ height: 1, flex: 1, background: 'rgba(255,211,77,0.15)' }} />
                <span style={{
                  color: '#FFD34D',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {cat.category}
                </span>
                <div style={{ height: 1, flex: 1, background: 'rgba(255,211,77,0.15)' }} />
              </div>

              {/* Wallet grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}>
                {cat.wallets.map((w) => (
                  <WalletMark key={w.name} name={w.name} color={w.color} symbol={w.symbol} />
                ))}
              </div>
            </div>
          ))}

          <p style={{
            color: '#8F98A6',
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 1.6,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 16,
          }}>
            Wallet compatibility list is for illustrative reference. Always verify dApp browser support in your wallet app.
          </p>
        </div>
      </section>
    </SectionShell>
  );
}
