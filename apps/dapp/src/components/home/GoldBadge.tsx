'use client';
import React from 'react';

export function DemoDataBadge({ label = 'DEMO / ILLUSTRATIVE DATA' }: { label?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 14px',
        borderRadius: 999,
        background: 'rgba(255,211,77,0.10)',
        border: '1px solid rgba(255,211,77,0.35)',
        color: '#FFD34D',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

export function GoldBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 16px',
        borderRadius: 999,
        background: 'linear-gradient(135deg,#FFD34D,#E6C45F)',
        color: '#00152B',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}
