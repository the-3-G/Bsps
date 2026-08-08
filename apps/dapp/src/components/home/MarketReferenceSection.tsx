'use client';

import React, { useState } from 'react';
import { SectionShell } from './SectionShell';
import { DemoDataBadge } from './GoldBadge';

interface ExchangeData {
  name: string;
  logo: string;
  refValue: string;
  currency: string;
  rows: Array<{
    asset: string;
    volume: string;
    liquidity: string;
  }>;
}

const EXCHANGES: ExchangeData[] = [
  {
    name: 'Huobi',
    logo: '🔵',
    refValue: '2.47B',
    currency: 'USDT',
    rows: [
      { asset: 'Bitcoin (BTC)', volume: '$892.4M', liquidity: 'High' },
      { asset: 'Ethereum (ETH)', volume: '$441.2M', liquidity: 'High' },
      { asset: 'USDC', volume: '$213.8M', liquidity: 'Very High' },
    ],
  },
  {
    name: 'OKX',
    logo: '⚫',
    refValue: '3.12B',
    currency: 'USDT',
    rows: [
      { asset: 'Bitcoin (BTC)', volume: '$1.04B', liquidity: 'Very High' },
      { asset: 'Ethereum (ETH)', volume: '$622.7M', liquidity: 'High' },
      { asset: 'USDC', volume: '$318.4M', liquidity: 'Very High' },
    ],
  },
  {
    name: 'Binance',
    logo: '🟡',
    refValue: '8.31B',
    currency: 'USDT',
    rows: [
      { asset: 'Bitcoin (BTC)', volume: '$2.81B', liquidity: 'Very High' },
      { asset: 'Ethereum (ETH)', volume: '$1.54B', liquidity: 'Very High' },
      { asset: 'USDC', volume: '$876.2M', liquidity: 'Very High' },
    ],
  },
];

export function MarketReferenceSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#00152B 0%,#061C35 100%)',
          padding: '48px 16px 48px',
        }}
        aria-label="Market Reference"
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <DemoDataBadge label="MARKET REFERENCE — DEMO DATA" />
          <h2 style={{
            fontWeight: 900,
            fontSize: 'clamp(28px, 8.5vw, 42px)',
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: '16px 0 8px',
          }}>
            Market Reference
          </h2>
          <p style={{ color: '#8F98A6', fontSize: 'clamp(14px, 4vw, 18px)', margin: 0 }}>
            Illustrative exchange data for educational reference only.
            Does not imply partnership.
          </p>
        </div>

        {/* Exchange Accordion Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600, margin: '0 auto' }}>
          {EXCHANGES.map((ex, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={ex.name}
                style={{
                  background: 'linear-gradient(160deg,#0A213B,#061C35)',
                  border: `1px solid ${isOpen ? 'rgba(255,211,77,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'border-color 0.25s',
                  boxShadow: isOpen ? '0 4px 32px rgba(255,211,77,0.08)' : 'none',
                }}
              >
                {/* Collapsed row (always visible) */}
                <button
                  id={`exchange-${ex.name.toLowerCase()}-btn`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    minHeight: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 22px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Logo placeholder */}
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      flexShrink: 0,
                    }}>
                      {ex.logo}
                    </div>
                    <div>
                      <div style={{ color: '#FFFFFF', fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 800, lineHeight: 1.1 }}>
                        {ex.name}
                      </div>
                      <div style={{ color: '#8F98A6', fontSize: 13, marginTop: 4 }}>
                        Reference exchange — demo data
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ color: '#FFD34D', fontSize: 'clamp(20px, 6vw, 28px)', fontWeight: 900, lineHeight: 1 }}>
                          ${ex.refValue}
                        </span>
                        <span style={{ color: '#8F98A6', fontSize: 12 }}>{ex.currency} 24h ref vol.</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,211,77,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="#FFD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
                  <div className="accordion-inner">
                    <div style={{
                      borderTop: '1px solid rgba(255,211,77,0.12)',
                      margin: '0 20px',
                    }} />

                    {/* Table header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      padding: '16px 22px 10px',
                      gap: 8,
                    }}>
                      {['Currency', '24h Volume', 'Liquidity'].map(h => (
                        <span key={h} style={{ color: '#FFD34D', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {h}
                        </span>
                      ))}
                    </div>

                    {ex.rows.map((row, ri) => (
                      <div
                        key={row.asset}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          padding: '14px 22px',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          gap: 8,
                          background: ri % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        }}
                      >
                        <span style={{ color: '#FFFFFF', fontSize: 'clamp(13px, 3.8vw, 17px)', fontWeight: 600 }}>{row.asset}</span>
                        <span style={{ color: '#FFD34D', fontSize: 'clamp(13px, 3.8vw, 17px)', fontWeight: 700 }}>{row.volume}</span>
                        <span style={{
                          color: '#4ade80',
                          fontSize: 'clamp(12px, 3.5vw, 15px)',
                          fontWeight: 600,
                          background: 'rgba(74,222,128,0.08)',
                          padding: '2px 8px',
                          borderRadius: 999,
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 'fit-content',
                        }}>
                          {row.liquidity}
                        </span>
                      </div>
                    ))}

                    <div style={{ height: 20 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p style={{
          textAlign: 'center',
          color: '#8F98A6',
          fontSize: 12,
          marginTop: 24,
          maxWidth: 400,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}>
          All figures shown are illustrative demo data for educational purposes only.
          BSP has no affiliation with or endorsement from any listed exchange.
        </p>
      </section>
    </SectionShell>
  );
}
