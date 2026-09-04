'use client';

import React from 'react';

export function CheckInFloatingButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      id="checkin-btn"
      onClick={onClick}
      aria-label="Daily Check-In"
      style={{
        width: 48,
        height: 52,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
        transition: 'transform 0.15s ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="46" height="50" viewBox="0 0 46 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Parchment Scroll */}
        <path
          d="M8 8 C8 5.5, 10.5 4, 14 4 H36 C39.5 4, 42 5.5, 42 8 V38 C42 41, 39.5 43, 36 43 H14 C10.5 43, 8 41, 8 38 Z"
          fill="#FFEBAA"
          stroke="#DAA520"
          strokeWidth="1.5"
        />
        {/* Scroll Rolled Ends */}
        <path d="M6 6 Q8 2 12 4 L10 10 Q6 8 6 6 Z" fill="#F3D078" />
        <path d="M38 4 Q42 2 44 6 L40 10 Q38 6 38 4 Z" fill="#F3D078" />
        <path d="M6 38 Q8 42 12 40 L10 34 Q6 36 6 38 Z" fill="#F3D078" />
        <path d="M38 40 Q42 42 44 38 L40 34 Q38 38 38 40 Z" fill="#F3D078" />

        {/* Text lines inside scroll */}
        <line x1="14" y1="12" x2="34" y2="12" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="14" y1="17" x2="30" y2="17" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="14" y1="22" x2="32" y2="22" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Red Wax Seal Badge */}
        <circle cx="10" cy="36" r="6" fill="#E53E3E" stroke="#FFD700" strokeWidth="1" />
        <circle cx="10" cy="36" r="4" fill="#C53030" />

        {/* Quill Pen across */}
        <path d="M34 16 L44 32 L40 33 L32 18 Z" fill="#718096" />
        <path d="M44 32 L46 36 L42 34 Z" fill="#2D3748" />

        {/* Blue/Dark "check-in" Banner at bottom */}
        <rect x="4" y="37" width="40" height="11" rx="3" fill="#1A365D" stroke="#FFD700" strokeWidth="0.8" />
        <text
          x="24"
          y="45.5"
          textAnchor="middle"
          fill="#FFD700"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="Inter, -apple-system, sans-serif"
          letterSpacing="0.02em"
        >
          check-in
        </text>
      </svg>
    </button>
  );
}

export function CustomerServiceFloatingButton({
  hasUnread = false,
  onClick,
}: {
  hasUnread?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      id="cs-chat-btn"
      onClick={onClick}
      aria-label="Customer Service Chat"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #FFD34D 0%, #F5C538 100%)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'transform 0.15s ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#00152B">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM6 9H18V11H6V9ZM14 14H6V12H14V14ZM18 8H6V6H18V8Z" />
      </svg>
      {hasUnread && (
        <span
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#EF4444',
            border: '2px solid #00152B',
          }}
        />
      )}
    </button>
  );
}
