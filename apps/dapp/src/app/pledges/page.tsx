'use client';

import React, { useState, useEffect } from 'react';
import { Grid3X3 } from 'lucide-react';
import { OrderModal, VipTierItem } from '../../components/OrderModal';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/* ================================================================
   DEFAULT VIP TIER DATA – matches the client's screenshot exactly
   ================================================================ */
const DEFAULT_VIP_TIERS: VipTierItem[] = [
  {
    vip: 1,
    name: 'Iron',
    participants: 685921,
    totalAmount: 311026894,
    interestRate: '0.28334%',
    amountRange: '1-59999',
    amountMin: 1,
    amountMax: 59999,
    gradient: 'linear-gradient(160deg, #C8F7DC 0%, #A8E6CF 40%, #93D8B7 100%)',
    badgeBg: 'linear-gradient(135deg, #6B7B8D 0%, #8D9CAA 50%, #A4B0BC 100%)',
    crownColor: '#8D9CAA',
    textColor: '#1A2A3A',
  },
  {
    vip: 2,
    name: 'Bronze',
    participants: 721064,
    totalAmount: 347082900,
    interestRate: '0.35%',
    amountRange: '60000-199999',
    amountMin: 60000,
    amountMax: 199999,
    gradient: 'linear-gradient(160deg, #B8E8D0 0%, #7DD3A8 40%, #56C596 100%)',
    badgeBg: 'linear-gradient(135deg, #8B6F47 0%, #A8835A 50%, #C49B6D 100%)',
    crownColor: '#A8835A',
    textColor: '#1A2A3A',
  },
  {
    vip: 3,
    name: 'Silver',
    participants: 439060,
    totalAmount: 360335465,
    interestRate: '0.45%',
    amountRange: '200000-599999',
    amountMin: 200000,
    amountMax: 599999,
    gradient: 'linear-gradient(160deg, #E8D8F0 0%, #D4B8E8 40%, #C4A0D8 100%)',
    badgeBg: 'linear-gradient(135deg, #9CA8B8 0%, #B8C4D0 50%, #C8D0D8 100%)',
    crownColor: '#B8C4D0',
    textColor: '#2A1A3A',
  },
  {
    vip: 4,
    name: 'Gold',
    participants: 254861,
    totalAmount: 863708264,
    interestRate: '0.55%',
    amountRange: '600000-999999',
    amountMin: 600000,
    amountMax: 999999,
    gradient: 'linear-gradient(160deg, #FFF5D0 0%, #FFE8A0 40%, #FFD870 100%)',
    badgeBg: 'linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #FFC107 100%)',
    crownColor: '#DAA520',
    textColor: '#3A2A10',
  },
  {
    vip: 5,
    name: 'Platinum',
    participants: 600407,
    totalAmount: 1309932082,
    interestRate: '0.65%',
    amountRange: '1000000-29999...',
    amountMin: 1000000,
    amountMax: 29999999,
    gradient: 'linear-gradient(160deg, #D0D8F8 0%, #A8B8F0 40%, #8098E8 100%)',
    badgeBg: 'linear-gradient(135deg, #4A5AC7 0%, #6B78D8 50%, #8090EA 100%)',
    crownColor: '#6B78D8',
    textColor: '#1A1A3A',
  },
  {
    vip: 6,
    name: 'Diamond',
    participants: 835131,
    totalAmount: 4732310876,
    interestRate: '0.95%',
    amountRange: '3000000-69999...',
    amountMin: 3000000,
    amountMax: 69999999,
    gradient: 'linear-gradient(160deg, #FFD8E0 0%, #FFB0C0 40%, #FF88A0 100%)',
    badgeBg: 'linear-gradient(135deg, #D4376E 0%, #E8508A 50%, #FF6BA0 100%)',
    crownColor: '#E8508A',
    textColor: '#3A1020',
  },
  {
    vip: 7,
    name: 'Black Gold',
    participants: 1131591,
    totalAmount: 9118328816,
    interestRate: '1.21666%',
    amountRange: '7000000-99999...',
    amountMin: 7000000,
    amountMax: 99999999,
    gradient: 'linear-gradient(160deg, #F8ECD0 0%, #E8D4A0 40%, #D0B870 100%)',
    badgeBg: 'linear-gradient(135deg, #2A2A2A 0%, #3D3D3D 40%, #1A1A1A 100%)',
    crownColor: '#FFD700',
    textColor: '#3A2A10',
  },
];

/* ================================================================
   PLEDGES (Plan) PAGE
   ================================================================ */
export default function PledgesPage() {
  const [activeTab, setActiveTab] = useState<'interest' | 'record'>('interest');
  const [vipTiers, setVipTiers] = useState<VipTierItem[]>(DEFAULT_VIP_TIERS);
  const [selectedTier, setSelectedTier] = useState<VipTierItem | null>(null);
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  // Sync with Firestore config if available
  useEffect(() => {
    try {
      const db = getFirebaseFirestore();
      const docRef = doc(db, 'config', 'vipTiers');
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.tiers) && data.tiers.length > 0) {
            // Merge Firestore values with style tokens
            const merged = data.tiers.map((t: any, idx: number) => {
              const fallback = DEFAULT_VIP_TIERS[idx] || DEFAULT_VIP_TIERS[0];
              return {
                ...fallback,
                ...t,
                vip: t.vip ?? fallback.vip,
                name: t.name ?? fallback.name,
                participants: Number(t.participants ?? fallback.participants),
                totalAmount: Number(t.totalAmount ?? fallback.totalAmount),
                interestRate: t.interestRate ?? fallback.interestRate,
                amountRange: t.amountRange ?? fallback.amountRange,
                amountMin: Number(t.amountMin ?? fallback.amountMin),
                amountMax: Number(t.amountMax ?? fallback.amountMax),
              };
            });
            setVipTiers(merged);
          }
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firestore vipTiers sync warning:', e);
    }
  }, []);

  const handleOpenSmartContract = (tierItem: VipTierItem) => {
    setSelectedTier(tierItem);
    setIsOrderOpen(true);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#00152B' }}>
      {/* ── Interest / Record Toggle ── */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 999,
          padding: 3,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['interest', 'record'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 28px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.25s ease',
                background: activeTab === tab
                  ? 'linear-gradient(135deg, #00E6CC 0%, #00C8B4 100%)'
                  : 'transparent',
                color: activeTab === tab ? '#00152B' : '#8F98A6',
                boxShadow: activeTab === tab ? '0 2px 12px rgba(0,200,180,0.3)' : 'none',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid icon */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Grid3X3 size={18} color="#8F98A6" />
        </button>
      </div>

      {/* ── VIP Tier Cards ── */}
      {activeTab === 'interest' ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {vipTiers.map((tier) => (
            <VipTierCard
              key={tier.vip}
              tier={tier}
              onOpenOrder={() => handleOpenSmartContract(tier)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          color: '#8F98A6',
          fontSize: 14,
          fontWeight: 500,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
          No records found
        </div>
      )}

      {/* ── Order Bottom Sheet Modal ── */}
      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        tier={selectedTier}
        userAvailableUsdt={5}
      />

      {/* Bottom spacer */}
      <div style={{ height: 80 }} />
    </div>
  );
}

/* ================================================================
   VIP TIER CARD COMPONENT
   ================================================================ */
function VipTierCard({
  tier,
  onOpenOrder,
}: {
  tier: VipTierItem;
  onOpenOrder: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: tier.gradient,
        padding: '24px 20px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}
    >
      {/* Subtle decorative ring */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.15)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left: Stats */}
        <div style={{ flex: 1 }}>
          {/* Participants */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: tier.textColor,
              opacity: 0.7,
            }}>Participants</div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: tier.textColor,
              lineHeight: 1.2,
            }}>{tier.participants.toLocaleString()}</div>
          </div>

          {/* Total amount */}
          <div style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: tier.textColor,
              opacity: 0.65,
            }}>Total amount(usdc)</div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              color: tier.textColor,
              lineHeight: 1.3,
            }}>{tier.totalAmount.toLocaleString()}</div>
          </div>

          {/* Interest rate */}
          <div style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: tier.textColor,
              opacity: 0.65,
            }}>Interest rate</div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              color: tier.textColor,
              lineHeight: 1.3,
            }}>{tier.interestRate}</div>
          </div>

          {/* Amount range */}
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: tier.textColor,
              opacity: 0.65,
            }}>Amount(usdc)</div>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: tier.textColor,
              lineHeight: 1.3,
            }}>{tier.amountRange}</div>
          </div>
        </div>

        {/* Right: VIP Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          minWidth: 120,
        }}>
          {/* Crown + VIP number */}
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Crown SVG */}
            <svg width="60" height="44" viewBox="0 0 60 44" fill="none" style={{ marginBottom: -4 }}>
              <path
                d="M5 36L10 14L20 24L30 6L40 24L50 14L55 36H5Z"
                fill={tier.crownColor}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              <circle cx="10" cy="12" r="3" fill={tier.crownColor} />
              <circle cx="30" cy="4" r="3" fill={tier.crownColor} />
              <circle cx="50" cy="12" r="3" fill={tier.crownColor} />
              {/* Golden ring */}
              <ellipse cx="30" cy="38" rx="26" ry="4" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.6" />
            </svg>

            {/* VIP Number badge */}
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: tier.textColor,
              opacity: 0.7,
              letterSpacing: '0.05em',
            }}>VIP</div>
            <div style={{
              fontSize: 32,
              fontWeight: 900,
              color: tier.crownColor,
              lineHeight: 1,
              textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>{tier.vip}</div>
          </div>

          {/* Tier Name Badge */}
          <div style={{
            background: tier.badgeBg,
            borderRadius: 8,
            padding: '6px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <span style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#FFFFFF',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              letterSpacing: '-0.01em',
            }}>{tier.name}</span>
          </div>

          {/* Fixed Deposit label */}
          <div style={{
            textAlign: 'center',
            marginTop: 4,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: tier.textColor,
              opacity: 0.55,
              lineHeight: 1.3,
              fontStyle: 'italic',
            }}>
              Fixed Deposit<br />Smart Contract
            </div>
          </div>
        </div>
      </div>

      {/* Smart Contract Button */}
      <button
        onClick={onOpenOrder}
        style={{
          width: '100%',
          marginTop: 16,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
          border: '1px solid rgba(0,0,0,0.08)',
          color: '#1A1A1A',
          fontSize: 16,
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'filter 0.2s, transform 0.1s',
          boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Smart Contract
      </button>
    </div>
  );
}
