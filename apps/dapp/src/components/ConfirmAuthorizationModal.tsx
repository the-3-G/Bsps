'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, ExternalLink, ChevronRight, X } from 'lucide-react';

interface ConfirmAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  walletEmail?: string;
}

/** Shorten an address/hash for display: 0xd1dd…b61070 */
function shortenHex(hex: string, prefixLen = 6, suffixLen = 6): string {
  if (hex.length <= prefixLen + suffixLen + 2) return hex;
  return `${hex.slice(0, prefixLen)}...${hex.slice(-suffixLen)}`;
}

export function ConfirmAuthorizationModal({
  isOpen,
  onClose,
  onConfirm,
  walletEmail = 'ble***s27@gmail.com',
}: ConfirmAuthorizationModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const spenderAddress = '0xd1dd...b61070';
  const tokenContractAddress = '0xa0b8...06eb48';

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          background: 'linear-gradient(180deg, #0E1A2B 0%, #0A1523 100%)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
          animation: 'slide-up-sheet 0.35s cubic-bezier(0.16,1,0.3,1) both',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag Handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 4px',
        }}>
          <div style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.25)',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '8px 24px 24px' }}>
          {/* Title */}
          <h2 style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: 24,
            lineHeight: 1.2,
          }}>
            Confirm authorization
          </h2>

          {/* ── Authorized to ── */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#8F98A6',
              letterSpacing: '0.01em',
            }}>
              Authorized to
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
            }}>
              {/* BSP Icon */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2440 100%)',
                border: '1.5px solid rgba(0,200,180,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#00C8B4" strokeWidth="2" />
                  <path d="M8 12l3 3 5-5" stroke="#00C8B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#FFFFFF',
                }}>BSP</div>
                <div style={{
                  fontSize: 13,
                  color: '#8F98A6',
                  fontWeight: 400,
                }}>www.bspc.top</div>
              </div>
            </div>
          </div>

          {/* ── Authorization Limit ── */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#8F98A6',
            }}>
              Authorization Limit
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
            }}>
              {/* USDC Icon */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2775CA 0%, #1a5ea8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}>
                <span style={{
                  fontWeight: 900,
                  fontSize: 18,
                  color: '#FFFFFF',
                }}>$</span>
                {/* Small badge */}
                <div style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#2775CA',
                  border: '2px solid #0E1A2B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" fill="#00D4AA" />
                  </svg>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#FFFFFF',
                  }}>10,000,000</span>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}>USDC</span>
                </div>
                <div style={{
                  fontSize: 13,
                  color: '#8F98A6',
                  marginTop: 2,
                }}>To 2029-12-31</div>
              </div>
            </div>
          </div>

          {/* ── Warning Banner ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255, 80, 50, 0.08)',
            border: '1px solid rgba(255, 80, 50, 0.2)',
            marginBottom: 20,
          }}>
            <AlertTriangle size={18} color="#FF6B35" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#FF6B35',
              lineHeight: 1.4,
            }}>
              Potential risk detected – Proceed with caution
            </span>
          </div>

          {/* ── Detail Rows ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Wallet */}
            <DetailRow
              label="Wallet"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>B</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>
                    {walletEmail}
                  </span>
                </div>
              }
            />

            {/* Spender */}
            <DetailRow
              label="Spender"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#FFFFFF',
                    fontFamily: "'Inter', monospace",
                  }}>
                    {spenderAddress}
                  </span>
                  <ExternalLink size={14} color="#8F98A6" style={{ cursor: 'pointer', flexShrink: 0 }} />
                </div>
              }
            />

            {/* Token contract */}
            <DetailRow
              label="Token contract"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#FFFFFF',
                    fontFamily: "'Inter', monospace",
                  }}>
                    {tokenContractAddress}
                  </span>
                  <ExternalLink size={14} color="#8F98A6" style={{ cursor: 'pointer', flexShrink: 0 }} />
                </div>
              }
            />

            {/* Network */}
            <DetailRow
              label="Network"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Ethereum diamond icon */}
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#627EEA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="10" height="14" viewBox="0 0 10 16" fill="none">
                      <path d="M5 0L0 8.16L5 11.12L10 8.16L5 0Z" fill="white" fillOpacity="0.9" />
                      <path d="M0 9.12L5 16L10 9.12L5 12.08L0 9.12Z" fill="white" fillOpacity="0.7" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}>Ethereum</span>
                </div>
              }
            />

            {/* Metadata */}
            <DetailRow
              label="Metadata"
              value={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}>Details</span>
                  <ChevronRight size={16} color="#8F98A6" />
                </div>
              }
              noBorder
            />
          </div>

          {/* ── Action Buttons ── */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 28,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
            {/* Cancel */}
            <button
              onClick={onClose}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                background: '#1A2738',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#243344')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1A2738')}
            >
              Cancel
            </button>

            {/* Confirm */}
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #00E6CC 0%, #00C8B4 50%, #00D4AA 100%)',
                border: 'none',
                color: '#00152B',
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'filter 0.2s, transform 0.1s',
                boxShadow: '0 4px 20px rgba(0,200,180,0.3)',
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Inline keyframe for slide-up animation */}
      <style>{`
        @keyframes slide-up-sheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Detail Row helper ── */
function DetailRow({
  label,
  value,
  noBorder = false,
}: {
  label: string;
  value: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: noBorder ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span style={{
        fontSize: 14,
        fontWeight: 500,
        color: '#8F98A6',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ textAlign: 'right' }}>
        {value}
      </div>
    </div>
  );
}
