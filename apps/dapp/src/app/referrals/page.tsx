'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/* ================================================================
   ACCOUNT PAGE  —  /referrals  (tab: Account)
   ================================================================ */
export default function AccountPage() {
  const { address, isConnected, ethBalance, usdtBalance } = useWeb3() as any;

  const [userData, setUserData] = useState<{
    usdtBalance?: string;
    ethBalance?: string;
    vipLevel?: number;
    vipName?: string;
    totalEarned?: number;
    todayEarned?: number;
    totalPledged?: number;
    activeOrders?: number;
    inviteCode?: string;
  }>({});

  /* ── Live Firestore user doc ────────────────────── */
  useEffect(() => {
    if (!address) return;
    try {
      const db = getFirebaseFirestore();
      const uid = address.toLowerCase();
      const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setUserData({
            usdtBalance: d.balanceUsdt || '0.00 USDT',
            ethBalance:  d.balanceEth  || '0.0000 ETH',
            vipLevel:    d.vipLevel    ?? 1,
            vipName:     d.vipName     ?? 'Iron',
            totalEarned: d.totalEarned ?? 0,
            todayEarned: d.todayEarned ?? 0,
            totalPledged:d.totalPledged?? 0,
            activeOrders:d.activeOrders?? 0,
            inviteCode:  d.inviteCode  || `BSP-${uid.slice(-6).toUpperCase()}`,
          });
        } else {
          setUserData({
            usdtBalance: usdtBalance ? `${usdtBalance} USDT` : '0.00 USDT',
            ethBalance:  ethBalance  ? `${ethBalance} ETH`   : '0.0000 ETH',
            vipLevel: 1, vipName: 'Iron',
            totalEarned: 0, todayEarned: 0, totalPledged: 0, activeOrders: 0,
            inviteCode: address ? `BSP-${address.slice(-6).toUpperCase()}` : 'BSP-XXXXXX',
          });
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Account page Firestore warning:', e);
    }
  }, [address, ethBalance, usdtBalance]);

  const [copied, setCopied] = useState(false);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Not connected';

  /* ── Helpers ─────────────────────────────────────── */
  const statRow = (
    label: string,
    value: string,
    valueColor = '#FFFFFF',
  ) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: 14, color: '#8F98A6', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: valueColor, fontWeight: 700 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#00152B', paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Balance Card ────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #0A213B 0%, #061C35 100%)',
          borderRadius: 20,
          padding: '24px 20px',
          border: '1px solid rgba(255,211,77,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative ring */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220, borderRadius: '50%',
            border: '1px solid rgba(255,211,77,0.08)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 140, height: 140, borderRadius: '50%',
            border: '1px solid rgba(255,211,77,0.06)', pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 12, color: '#8F98A6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Total Asset Balance
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1.5px', marginBottom: 4 }}>
            {userData.usdtBalance || '0.00 USDT'}
          </div>
          <div style={{ fontSize: 14, color: '#8F98A6', fontWeight: 500, marginBottom: 20 }}>
            ≈ {userData.ethBalance || '0.0000 ETH'}
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: "Today's Earnings", value: `+${(userData.todayEarned ?? 0).toFixed(4)} USDC`, color: '#00E6CC' },
              { label: 'Total Earned',     value: `${(userData.totalEarned ?? 0).toFixed(2)} USDC`,  color: '#FFD34D' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'rgba(0,0,0,0.25)', borderRadius: 12,
                padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 11, color: '#8F98A6', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── VIP / Tier Card ─────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #0A213B 0%, #061C35 100%)',
          borderRadius: 20, padding: '20px',
          border: '1px solid rgba(255,211,77,0.12)',
        }}>
          <div style={{ fontSize: 13, color: '#8F98A6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Membership
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Crown icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(255,211,77,0.15), rgba(255,211,77,0.05))',
                border: '1px solid rgba(255,211,77,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18l3-8 4 5 4-9 4 5 3-3" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 18h18" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8F98A6', marginBottom: 2 }}>Current Tier</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFD34D' }}>
                  VIP {userData.vipLevel ?? 1} — {userData.vipName ?? 'Iron'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {statRow('Total Pledged', `${(userData.totalPledged ?? 0).toLocaleString()} USDC`)}
            {statRow('Active Orders', String(userData.activeOrders ?? 0))}
            {statRow('Interest Rate', '0.28334%', '#00E6CC')}
            {statRow('Dividend Frequency', 'Daily', '#FFD34D')}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
              <span style={{ fontSize: 14, color: '#8F98A6', fontWeight: 500 }}>Next Tier</span>
              <span style={{ fontSize: 14, color: '#FFD34D', fontWeight: 700 }}>VIP 2 — Bronze</span>
            </div>
          </div>
        </div>

        {/* ── Wallet Card ─────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #0A213B 0%, #061C35 100%)',
          borderRadius: 20, padding: '20px',
          border: '1px solid rgba(255,211,77,0.12)',
        }}>
          <div style={{ fontSize: 13, color: '#8F98A6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Wallet
          </div>

          {/* Address row */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#8F98A6', marginBottom: 4 }}>Connected Wallet</div>
              <div style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 700, fontFamily: 'monospace' }}>
                {shortAddr}
              </div>
            </div>
            <button
              onClick={() => address && handleCopy(address)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: copied ? 'rgba(0,230,204,0.15)' : 'rgba(255,211,77,0.08)',
                border: `1px solid ${copied ? 'rgba(0,230,204,0.3)' : 'rgba(255,211,77,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E6CC" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            </button>
          </div>

          {/* Invite code */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#8F98A6', marginBottom: 4 }}>Invite Code</div>
              <div style={{ fontSize: 16, color: '#FFD34D', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                {userData.inviteCode || 'BSP-XXXXXX'}
              </div>
            </div>
            <button
              onClick={() => userData.inviteCode && handleCopy(userData.inviteCode)}
              style={{
                height: 36, padding: '0 14px', borderRadius: 10,
                background: 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
                border: 'none', color: '#00152B', fontWeight: 800, fontSize: 12,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Share
            </button>
          </div>
        </div>

        {/* ── Status row ──────────────────────────── */}
        <div style={{
          background: isConnected
            ? 'rgba(0,230,204,0.06)'
            : 'rgba(255,100,100,0.06)',
          borderRadius: 14,
          padding: '14px 18px',
          border: `1px solid ${isConnected ? 'rgba(0,230,204,0.2)' : 'rgba(255,100,100,0.2)'}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isConnected ? '#00E6CC' : '#ef4444',
            boxShadow: isConnected ? '0 0 8px #00E6CC' : '0 0 8px #ef4444',
          }} />
          <span style={{ fontSize: 13, color: isConnected ? '#00E6CC' : '#ef4444', fontWeight: 600 }}>
            {isConnected ? 'Wallet connected & authorized' : 'Wallet not connected — tap Login to begin'}
          </span>
        </div>

      </div>
    </div>
  );
}
