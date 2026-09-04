'use client';

import React from 'react';
import { SectionShell } from './SectionShell';
import { GoldenEagle } from '../GoldenEagle';
import { SavingsPlanBenefitsStrip } from '../SavingsPlanFeatures';
import { FIXED_TERM_SAVINGS_DATA } from '../SavingsPlanCarousel';

export function FixedTermSavingsSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(180deg, #030B17 0%, #07152B 100%)',
          padding: '40px 16px',
        }}
        aria-label="Fixed-Term Savings Plan"
      >
        {/* 5 Features Strip */}
        <SavingsPlanBenefitsStrip />

        <div
          style={{
            background: 'linear-gradient(180deg, #07152B 0%, #030B17 100%)',
            borderRadius: 24,
            padding: '24px 18px 20px',
            border: '1px solid rgba(255, 211, 77, 0.16)',
            boxShadow: '0 8px 36px rgba(0, 0, 0, 0.55)',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          {/* Header */}
          <h2
            style={{
              textAlign: 'center',
              color: '#FFD34D',
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '0 0 20px',
            }}
          >
            FIXED-TERM SAVINGS PLAN
          </h2>

          {/* Table */}
          <div style={{ width: '100%', marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 14,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ color: '#FFD34D', fontSize: 14, fontWeight: 800 }}>
                Deposit(USDC)
              </span>
              <span style={{ color: '#FFD34D', fontSize: 14, fontWeight: 800, textAlign: 'right' }}>
                Daily Interest Rate(%)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FIXED_TERM_SAVINGS_DATA.map((row, idx) => (
                <div
                  key={row.deposit}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '13px 0',
                    borderBottom:
                      idx < FIXED_TERM_SAVINGS_DATA.length - 1
                        ? '1px solid rgba(255, 255, 255, 0.05)'
                        : 'none',
                  }}
                >
                  <span style={{ color: '#FFD34D', fontSize: 14, fontWeight: 800 }}>
                    {row.deposit}
                  </span>
                  <span style={{ color: '#FFD34D', fontSize: 14, fontWeight: 800, textAlign: 'right' }}>
                    {row.rate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Golden Eagle Emblem */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 12px' }}>
            <GoldenEagle width={260} height={92} />
          </div>

          {/* Terms & Conditions */}
          <p
            style={{
              textAlign: 'center',
              color: '#FFD34D',
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Terms and Conditions Apply
          </p>
        </div>
      </section>
    </SectionShell>
  );
}
