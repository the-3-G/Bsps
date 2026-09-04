'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { OrderModal, VipTierItem } from '../../components/OrderModal';
import { SavingsPlanBenefitsStrip } from '../../components/SavingsPlanFeatures';
import { SavingsPlanCarousel, SavingsPlanRow } from '../../components/SavingsPlanCarousel';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, collection, onSnapshot, setDoc } from 'firebase/firestore';

// Fallback Smart Contract Record for contract holders
const DEFAULT_CLIENT_CONTRACT_RECORD = {
  id: 'ID_1197',
  contractId: 'ID 1197',
  type: 'Fixed 36d',
  period: '36 days',
  interestRate: '1.7%',
  deposit: '57,980',
  collectionAmount: '26,151,358',
  uncollectedAmount: '0',
  reward: '0.00 ETH',
  additionalReward: '3.1 ETH',
  endTime: '2026-10-10 10:24',
  status: 'mining',
};

export default function PledgesPlanPage() {
  const [activeView, setActiveView] = useState<'plan' | 'records'>('plan');
  const [selectedTier, setSelectedTier] = useState<VipTierItem | null>(null);
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  // Client Smart Contract Records State
  const [contractRecords, setContractRecords] = useState<any[]>([DEFAULT_CLIENT_CONTRACT_RECORD]);
  const [redeemToast, setRedeemToast] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Sync with Firestore real-time Pledges
  useEffect(() => {
    try {
      const db = getFirebaseFirestore();
      const pledgesColRef = collection(db, 'pledges');
      const unsubPledges = onSnapshot(pledgesColRef, (snap) => {
        if (!snap.empty) {
          const fetched = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              contractId: data.contractId || d.id,
              type: data.stakingType || data.tier || 'Fixed Plan',
              period: data.stakingDays ? `${data.stakingDays} days` : '36 days',
              interestRate: data.interestRate || data.miningRatio || '1.7%',
              deposit: data.deposit || data.amountThreshold || '57,980',
              collectionAmount: data.collectedAmount || data.collectionAmount || '26,151,358',
              uncollectedAmount: data.uncollectedAmount || '0',
              reward: data.reward || data.miningReward || '0.00 ETH',
              additionalReward: data.bonusReward || data.ethReward || '3.1 ETH',
              endTime: data.endTime || '2026-10-10 10:24',
              status: data.status || 'mining',
            };
          });
          setContractRecords(fetched);
        } else {
          setContractRecords([DEFAULT_CLIENT_CONTRACT_RECORD]);
        }
      });

      return () => {
        unsubPledges();
      };
    } catch (e) {
      console.warn('Firestore sync warning:', e);
    }
  }, []);

  const handleSelectSavingsRow = (planType: 'fixed' | 'flexible', row: SavingsPlanRow, idx: number) => {
    const tierItem: VipTierItem = {
      vip: idx + 1,
      name: `${planType === 'fixed' ? 'Fixed' : 'Flexible'} Tier ${idx + 1}`,
      participants: 500000 + idx * 50000,
      totalAmount: 300000000 + idx * 100000000,
      interestRate: row.rate,
      amountRange: row.deposit,
      amountMin: row.minAmount || 1,
      amountMax: row.maxAmount || 59999,
      gradient: 'linear-gradient(180deg, #07152B 0%, #030B17 100%)',
      badgeBg: 'linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #FFC107 100%)',
      crownColor: '#FFD700',
      textColor: '#FFFFFF',
    };
    setSelectedTier(tierItem);
    setIsOrderOpen(true);
  };

  const handleRedeemContract = async (recordId: string, contractId: string) => {
    setRedeemingId(recordId);
    try {
      setContractRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: 'redeemed' } : r))
      );

      try {
        const db = getFirebaseFirestore();
        const pledgeDocRef = doc(db, 'pledges', recordId);
        await setDoc(pledgeDocRef, { status: 'redeemed', updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore redeem update notice:', err);
      }

      setRedeemToast(`✓ Smart Contract ${contractId} successfully redeemed!`);
      setTimeout(() => {
        setRedeemToast(null);
      }, 4000);
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#001326',
        padding: '16px 0 60px',
        color: '#FFFFFF',
      }}
    >
      {/* ── Page Header / View Switcher (if records exist) ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto 12px',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            color: '#FFD34D',
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '0.02em',
            margin: 0,
            lineHeight: 1.1,
            textTransform: 'uppercase',
          }}
        >
          PLAN
        </h1>

        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 999,
            padding: 2,
            border: '1px solid rgba(255, 211, 77, 0.15)',
          }}
        >
          <button
            onClick={() => setActiveView('plan')}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              background: activeView === 'plan' ? '#FFD34D' : 'transparent',
              color: activeView === 'plan' ? '#00152B' : '#8F98A6',
              transition: 'all 0.2s ease',
            }}
          >
            Plan
          </button>
          <button
            onClick={() => setActiveView('records')}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              background: activeView === 'records' ? '#FFD34D' : 'transparent',
              color: activeView === 'records' ? '#00152B' : '#8F98A6',
              transition: 'all 0.2s ease',
            }}
          >
            Records
          </button>
        </div>
      </div>

      {/* Redeem Success Toast */}
      {redeemToast && (
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto 16px',
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(0, 230, 204, 0.15)',
            border: '1px solid #00E6CC',
            color: '#00E6CC',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0, 230, 204, 0.2)',
          }}
        >
          <CheckCircle2 size={18} />
          {redeemToast}
        </div>
      )}

      {/* ── Main View: Plan Carousel OR Records ── */}
      {activeView === 'plan' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 5 Features Strip: Transparency, Security, Global access, Decentralization, Tamper-proof */}
          <SavingsPlanBenefitsStrip />

          {/* Savings Plan Carousel: FIXED-TERM & FLEXIBLE */}
          <SavingsPlanCarousel onSelectTier={handleSelectSavingsRow} />
        </div>
      ) : (
        /* Records View */
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {contractRecords.length > 0 ? (
            contractRecords.map((record) => (
              <ClientContractRecordCard
                key={record.id}
                record={record}
                isRedeeming={redeemingId === record.id}
                onRedeem={() => handleRedeemContract(record.id, record.contractId)}
              />
            ))
          ) : (
            <div
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                color: '#8F98A6',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
              No active records found
            </div>
          )}
        </div>
      )}

      {/* ── Order Bottom Sheet Modal ── */}
      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        tier={selectedTier}
        userAvailableUsdt={5}
      />
    </div>
  );
}

/* ================================================================
   CLIENT SMART CONTRACT RECORD CARD COMPONENT
   ================================================================ */
function ClientContractRecordCard({
  record,
  isRedeeming,
  onRedeem,
}: {
  record: any;
  isRedeeming: boolean;
  onRedeem: () => void;
}) {
  const isRedeemed = record.status === 'redeemed';

  return (
    <div
      style={{
        borderRadius: 20,
        background: '#071628',
        border: '1px solid rgba(255, 211, 77, 0.2)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 6px 28px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#FFD34D" />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
            Smart Contract: {record.contractId}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: isRedeemed ? 'rgba(0, 230, 204, 0.15)' : 'rgba(255, 211, 77, 0.15)',
            color: isRedeemed ? '#00E6CC' : '#FFD34D',
            border: isRedeemed ? '1px solid #00E6CC' : '1px solid #FFD34D',
          }}
        >
          {isRedeemed ? 'Redeemed' : record.status}
        </span>
      </div>

      {/* Detail Fields Container */}
      <div
        style={{
          background: '#0B1E36',
          borderRadius: 14,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <DetailRow label="Type" value={record.type} highlightColor="#FFD34D" />
        <DetailRow label="Period" value={record.period} />
        <DetailRow label="Daily Interest Rate" value={record.interestRate} highlightColor="#FFD34D" />
        <DetailRow label="Deposit Amount" value={`${record.deposit} USDC`} />
        <DetailRow label="Collection Amount" value={record.collectionAmount} highlightColor="#FFFFFF" bold />
        <DetailRow label="Uncollected amount" value={record.uncollectedAmount} />
        <DetailRow label="Reward" value={record.reward} />
        <DetailRow label="Additional Reward" value={record.additionalReward} highlightColor="#FFD34D" bold />
        <DetailRow label="End Time" value={record.endTime} />
        <DetailRow label="Status" value={record.status} />
      </div>

      {/* Redeem Action Button */}
      <button
        onClick={onRedeem}
        disabled={isRedeemed || isRedeeming}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 14,
          background: isRedeemed
            ? 'rgba(255,255,255,0.08)'
            : 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
          border: 'none',
          color: isRedeemed ? '#8F98A6' : '#00152B',
          fontSize: 16,
          fontWeight: 800,
          cursor: isRedeemed || isRedeeming ? 'not-allowed' : 'pointer',
          boxShadow: isRedeemed ? 'none' : '0 4px 16px rgba(255, 211, 77, 0.3)',
          transition: 'transform 0.1s, filter 0.2s',
          letterSpacing: '0.02em',
          textTransform: 'lowercase',
        }}
      >
        {isRedeeming ? 'processing...' : isRedeemed ? 'redeemed' : 'redeem'}
      </button>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlightColor,
  bold = false,
}: {
  label: string;
  value: string;
  highlightColor?: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 500 }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: highlightColor || '#E2E8F0',
          fontWeight: bold ? 800 : 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}
