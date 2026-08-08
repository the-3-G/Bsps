'use client';

import React from 'react';
import { SectionShell } from './SectionShell';

export function HelpCenterSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#00152B 0%,#032C5C 100%)',
          padding: '0 0 0',
        }}
        aria-label="Help Center"
      >
        {/* Yellow/Gold banner */}
        <div style={{
          background: 'linear-gradient(135deg,#FFD34D 0%,#E6C45F 100%)',
          padding: '40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 200,
        }}>
          <div>
            <p style={{
              color: 'rgba(0,21,43,0.5)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 8px',
            }}>
              Support Resources
            </p>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(30px, 9vw, 44px)',
              color: '#00152B',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              margin: '0 0 12px',
            }}>
              Help Center
            </h2>
            <p style={{ color: 'rgba(0,21,43,0.65)', fontSize: 'clamp(13px, 3.8vw, 16px)', lineHeight: 1.5, margin: 0 }}>
              Tutorials, guides, and customer support for all users.
            </p>
          </div>

          {/* Icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(0,21,43,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            flexShrink: 0,
          }}>
            🎓
          </div>
        </div>

        {/* Tutorial / Video placeholder card */}
        <div style={{ padding: '24px 16px 40px' }}>
          <div style={{
            background: 'linear-gradient(160deg,#0A213B,#061C35)',
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(255,211,77,0.14)',
            maxWidth: 600,
            margin: '0 auto',
          }}>
            {/* Video placeholder */}
            <div style={{
              background: 'linear-gradient(160deg,#032C5C,#100D43)',
              aspectRatio: '16/9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,211,77,0.08) 0%, transparent 70%)',
              }} />

              {/* Play button */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#FFD34D,#C9A227)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(255,211,77,0.4)',
                position: 'relative',
                zIndex: 1,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#00152B">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>

              <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <p style={{ color: '#FFD34D', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>
                  BSP Getting Started Guide
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                  Video tutorial placeholder
                </p>
              </div>
            </div>

            {/* Card content */}
            <div style={{ padding: '20px 20px' }}>
              <h3 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 18, margin: '0 0 10px' }}>
                How to Get Started with BSP
              </h3>
              <p style={{ color: '#8F98A6', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
                Learn how to connect your wallet, navigate the BSP portal, and understand
                how decentralized savings works in this introductory tutorial.
              </p>

              {/* Topics */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Wallet Setup', 'First Deposit', 'Interest Rules', 'Security Best Practices', 'Customer Support'].map((t) => (
                  <span key={t} style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    background: 'rgba(255,211,77,0.08)',
                    border: '1px solid rgba(255,211,77,0.2)',
                    color: '#FFD34D',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionShell>
  );
}
