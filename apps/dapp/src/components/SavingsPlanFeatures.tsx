import React from 'react';

export function TransparencyIcon({ size = 26, color = '#FFD34D' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* 3-tier podium */}
      <path d="M11 16 H21 V26 H11 Z" />
      <path d="M4 20 H11 V26 H4 Z" />
      <path d="M21 22 H28 V26 H21 Z" />
      {/* Star over podium center */}
      <path
        d="M16 5.5 L17.5 9.5 L21.5 9.5 L18.2 12 L19.5 16 L16 13.5 L12.5 16 L13.8 12 L10.5 9.5 L14.5 9.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function SecurityIcon({ size = 26, color = '#FFD34D' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Shield */}
      <path d="M16 4 L26 8 V16 C26 22 16 27 16 27 C16 27 6 22 6 16 V8 L16 4 Z" />
      {/* Inner Lock / Person Keyhole */}
      <circle cx="16" cy="14" r="2.5" />
      <path d="M14 16.5 L13 21 H19 L18 16.5 Z" />
    </svg>
  );
}

export function GlobalAccessIcon({ size = 26, color = '#FFD34D' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Globe */}
      <circle cx="16" cy="16" r="11" />
      {/* Longitude Ellipse */}
      <ellipse cx="16" cy="16" rx="5.5" ry="11" />
      {/* Equator & Latitudes */}
      <path d="M5 16 H27" />
      <path d="M7.5 10.5 Q16 13 24.5 10.5" />
      <path d="M7.5 21.5 Q16 19 24.5 21.5" />
    </svg>
  );
}

export function DecentralizationIcon({ size = 26, color = '#FFD34D' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Transmitter Base */}
      <path d="M11 26 L16 16 L21 26" />
      <path d="M13 22 H19" />
      <circle cx="16" cy="16" r="1.5" fill={color} />
      {/* Signal Waves */}
      <path d="M12 12 C14.2 9.8 17.8 9.8 20 12" />
      <path d="M9 8.5 C12.8 4.7 19.2 4.7 23 8.5" />
      <path d="M6.5 5.5 C11.7 0.3 20.3 0.3 25.5 5.5" />
    </svg>
  );
}

export function TamperProofIcon({ size = 26, color = '#FFD34D' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Chip Body */}
      <rect x="9" y="9" width="14" height="14" rx="2" />
      {/* Center Core */}
      <rect x="13" y="13" width="6" height="6" rx="1" />
      {/* Top & Bottom Pins */}
      <path d="M12 5 V9 M16 5 V9 M20 5 V9" />
      <path d="M12 23 V27 M16 23 V27 M20 23 V27" />
      {/* Left & Right Pins */}
      <path d="M5 12 H9 M5 16 H9 M5 20 H9" />
      <path d="M23 12 H27 M23 16 H27 M23 20 H27" />
    </svg>
  );
}

export const BENEFIT_ITEMS = [
  { icon: TransparencyIcon, label: 'Transparency' },
  { icon: SecurityIcon, label: 'Security' },
  { icon: GlobalAccessIcon, label: 'Global access' },
  { icon: DecentralizationIcon, label: 'Decentralization' },
  { icon: TamperProofIcon, label: 'Tamper-proof' },
];

export function SavingsPlanBenefitsStrip() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4,
        width: '100%',
        maxWidth: 480,
        margin: '0 auto 20px',
        padding: '0 8px',
      }}
    >
      {BENEFIT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(255, 211, 77, 0.05)',
                border: '1px solid rgba(255, 211, 77, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
              }}
            >
              <Icon size={24} color="#FFD34D" />
            </div>
            <span
              style={{
                color: '#8F98A6',
                fontSize: 10,
                fontWeight: 500,
                lineHeight: 1.2,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
