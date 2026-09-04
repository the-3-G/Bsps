'use client';

import React, { useState, useRef } from 'react';
import { GoldenEagle } from './GoldenEagle';

export interface SavingsPlanRow {
  deposit: string;
  rate: string;
  minAmount?: number;
  maxAmount?: number;
}

export const FIXED_TERM_SAVINGS_DATA: SavingsPlanRow[] = [
  { deposit: '1-59,999', rate: '1.7%', minAmount: 1, maxAmount: 59999 },
  { deposit: '60,000-199,999', rate: '2.1%', minAmount: 60000, maxAmount: 199999 },
  { deposit: '200,000-599,999', rate: '2.7%', minAmount: 200000, maxAmount: 599999 },
  { deposit: '600,000-999,999', rate: '3.3%', minAmount: 600000, maxAmount: 999999 },
  { deposit: '1,000,000-2,999,999', rate: '3.9%', minAmount: 1000000, maxAmount: 2999999 },
  { deposit: '3,000,000-6,999,999', rate: '5.7%', minAmount: 3000000, maxAmount: 6999999 },
  { deposit: '7,000,000-9,999,999', rate: '7.3%', minAmount: 7000000, maxAmount: 9999999 },
  { deposit: '10,000,000-999,999,999', rate: '11%', minAmount: 10000000, maxAmount: 999999999 },
];

export const FLEXIBLE_SAVINGS_DATA: SavingsPlanRow[] = [
  { deposit: '1-9,999', rate: '0.7%', minAmount: 1, maxAmount: 9999 },
  { deposit: '10,000-99,999', rate: '0.9%', minAmount: 10000, maxAmount: 99999 },
  { deposit: '100,000-299,999', rate: '1.1%', minAmount: 100000, maxAmount: 299999 },
  { deposit: '300,000-499,999', rate: '1.3%', minAmount: 300000, maxAmount: 499999 },
  { deposit: '500,000-999,999', rate: '1.5%', minAmount: 500000, maxAmount: 999999 },
  { deposit: '1,000,000-2,999,999', rate: '1.7%', minAmount: 1000000, maxAmount: 2999999 },
  { deposit: '3,000,000-4,999,999', rate: '1.98%', minAmount: 3000000, maxAmount: 4999999 },
  { deposit: '5,000,000-999,999,999', rate: '2.7%', minAmount: 5000000, maxAmount: 999999999 },
];

interface SavingsPlanCarouselProps {
  onSelectTier?: (planType: 'fixed' | 'flexible', row: SavingsPlanRow, index: number) => void;
  defaultSlide?: number;
}

export function SavingsPlanCarousel({ onSelectTier, defaultSlide = 0 }: SavingsPlanCarouselProps) {
  const [activeSlide, setActiveSlide] = useState<number>(defaultSlide);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 40) {
      // Swiped Left -> go to slide 1
      setActiveSlide(1);
    } else if (distance < -40) {
      // Swiped Right -> go to slide 0
      setActiveSlide(0);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const plans = [
    {
      type: 'fixed' as const,
      title: 'FIXED-TERM SAVINGS PLAN',
      data: FIXED_TERM_SAVINGS_DATA,
    },
    {
      type: 'flexible' as const,
      title: 'FLEXIBLE SAVINGS PLAN',
      data: FLEXIBLE_SAVINGS_DATA,
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 8px',
        boxSizing: 'border-box',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Main Outer Card Container ── */}
      <div
        style={{
          background: 'linear-gradient(180deg, #07152B 0%, #030B17 100%)',
          borderRadius: 24,
          padding: 0,
          border: '1px solid rgba(255, 211, 77, 0.16)',
          boxShadow: '0 8px 36px rgba(0, 0, 0, 0.55)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Slide Carousel Track */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${activeSlide * 100}%)`,
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
            willChange: 'transform',
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.type}
              style={{
                flex: '0 0 100%',
                width: '100%',
                minWidth: '100%',
                maxWidth: '100%',
                padding: '24px 20px 14px',
                boxSizing: 'border-box',
              }}
            >
              {/* Plan Title */}
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
                {plan.title}
              </h2>

              {/* Table Container */}
              <div
                style={{
                  width: '100%',
                  marginBottom: 20,
                }}
              >
                {/* Table Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 14,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span
                    style={{
                      color: '#FFD34D',
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Deposit(USDC)
                  </span>
                  <span
                    style={{
                      color: '#FFD34D',
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      textAlign: 'right',
                    }}
                  >
                    Daily Interest Rate(%)
                  </span>
                </div>

                {/* Table Rows */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {plan.data.map((row, idx) => (
                    <div
                      key={row.deposit}
                      onClick={() => onSelectTier?.(plan.type, row, idx)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '13px 0',
                        borderBottom:
                          idx < plan.data.length - 1
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : 'none',
                        cursor: onSelectTier ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (onSelectTier) e.currentTarget.style.background = 'rgba(255,211,77,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (onSelectTier) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          color: '#FFD34D',
                          fontSize: 14,
                          fontWeight: 800,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {row.deposit}
                      </span>
                      <span
                        style={{
                          color: '#FFD34D',
                          fontSize: 14,
                          fontWeight: 800,
                          textAlign: 'right',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {row.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Golden Eagle Emblem */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 10,
                  marginBottom: 14,
                }}
              >
                <GoldenEagle width={260} height={92} />
              </div>

              {/* Terms and Conditions Apply */}
              <p
                style={{
                  textAlign: 'center',
                  color: '#FFD34D',
                  fontSize: 13,
                  fontWeight: 600,
                  margin: '0 0 10px',
                  letterSpacing: '0.01em',
                }}
              >
                Terms and Conditions Apply
              </p>
            </div>
          ))}
        </div>

        {/* ── Carousel Pagination Dots ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            paddingBottom: 18,
            paddingTop: 2,
          }}
        >
          {plans.map((_, idx) => {
            const isActive = activeSlide === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: isActive ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: isActive ? '#00D2FF' : '#2A3C54',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isActive ? '0 0 8px rgba(0, 210, 255, 0.6)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
