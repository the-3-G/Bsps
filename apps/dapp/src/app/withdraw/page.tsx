'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const ACCOUNTS = [
  { key: 'pool',    label: 'Pool Account' },
  { key: 'funding', label: 'Funding Account' },
  { key: 'spot',    label: 'Spot Account' },
  { key: 'futures', label: 'Futures Account' },
];

type TransferRecord = {
  id: string;
  from: string;
  to: string;
  amount: number;
  createdAt?: { seconds: number } | null;
  status: string;
};

/* ================================================================
   TRANSFER PAGE  —  /withdraw  (tab: Transfer)
   ================================================================ */
export default function TransferPage() {
  const { address, isConnected } = useWeb3();

  const [balances, setBalances] = useState<Record<string, number>>({
    pool: 0, funding: 0, spot: 0, futures: 0,
  });

  const [from, setFrom]     = useState('funding');
  const [to, setTo]         = useState('pool');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);

  /* ── Live balances ──────────────────────────────── */
  useEffect(() => {
    if (!address) return;
    try {
      const db = getFirebaseFirestore();
      const uid = address.toLowerCase();
      const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setBalances({
            pool:    d.poolBalance    ?? 0,
            funding: d.fundingBalance ?? 0,
            spot:    d.spotBalance    ?? 0,
            futures: d.futuresBalance ?? 0,
          });
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('TransferPage Firestore warning:', e);
    }
  }, [address]);

  /* ── Transfer history ───────────────────────────── */
  useEffect(() => {
    if (!address) return;
    const loadHistory = async () => {
      try {
        const db = getFirebaseFirestore();
        const { getDocs, query, where, limit } = await import('firebase/firestore');
        const snap = await getDocs(
          query(
            collection(db, 'poolTransfers'),
            where('uid', '==', address.toLowerCase()),
            limit(10),
          )
        );
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as TransferRecord))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setHistory(items);
      } catch { /* ignore */ }
    };
    loadHistory();
  }, [address, msg]);

  /* ── Submit transfer ────────────────────────────── */
  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setMsg({ type: 'err', text: 'Please enter a valid amount.' });
      return;
    }
    if (from === to) {
      setMsg({ type: 'err', text: 'From and To must be different accounts.' });
      return;
    }
    if (amt > (balances[from] ?? 0)) {
      setMsg({ type: 'err', text: `Insufficient balance. Available: ${(balances[from] ?? 0).toFixed(2)} USDC` });
      return;
    }
    if (!address) {
      setMsg({ type: 'err', text: 'Please connect your wallet first.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const db = getFirebaseFirestore();
      await addDoc(collection(db, 'poolTransfers'), {
        uid: address.toLowerCase(),
        walletAddress: address,
        from,
        to,
        amount: amt,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setMsg({ type: 'ok', text: `Transfer of ${amt.toFixed(2)} USDC submitted successfully!` });
      setAmount('');
    } catch (e) {
      setMsg({ type: 'err', text: 'Transfer failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const swap = () => { setFrom(to); setTo(from); };

  const fmtDate = (ts?: { seconds: number } | null) => {
    if (!ts?.seconds) return '—';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const accountLabel = (key: string) =>
    ACCOUNTS.find(a => a.key === key)?.label ?? key;

  /* ── Styles ─────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#00152B', paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Transfer Form Card ───────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #0A213B 0%, #061C35 100%)',
          borderRadius: 20, padding: '24px 20px',
          border: '1px solid rgba(255,211,77,0.12)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD34D" strokeWidth="2" strokeLinecap="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
            Pool Transfer
          </div>

          {/* Toast */}
          {msg && (
            <div style={{
              background: msg.type === 'ok' ? 'rgba(0,230,204,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${msg.type === 'ok' ? 'rgba(0,230,204,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: msg.type === 'ok' ? '#00E6CC' : '#ef4444',
              marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {msg.type === 'ok' ? '✅' : '⚠️'} {msg.text}
            </div>
          )}

          {/* From */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8F98A6', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
              From
            </label>
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={inputStyle}
            >
              {ACCOUNTS.map(a => (
                <option key={a.key} value={a.key} style={{ background: '#0A213B' }}>
                  {a.label} — {(balances[a.key] ?? 0).toFixed(2)} USDC
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0', position: 'relative', zIndex: 1 }}>
            <button
              onClick={swap}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD34D 0%, #C9A227 100%)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18, color: '#00152B', fontWeight: 900,
                boxShadow: '0 4px 14px rgba(255,211,77,0.35)',
                transition: 'transform 0.25s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12) rotate(180deg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1) rotate(0deg)'; }}
            >
              ⇅
            </button>
          </div>

          {/* To */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8F98A6', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
              To
            </label>
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              style={inputStyle}
            >
              {ACCOUNTS.map(a => (
                <option key={a.key} value={a.key} style={{ background: '#0A213B' }}>
                  {a.label} — {(balances[a.key] ?? 0).toFixed(2)} USDC
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8F98A6', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
              Amount (USDC)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              min={0}
              onChange={e => setAmount(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 12, color: '#8F98A6', marginTop: 6 }}>
              Available:{' '}
              <span
                style={{ color: '#FFD34D', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setAmount(String(balances[from] ?? 0))}
              >
                {(balances[from] ?? 0).toFixed(2)} USDC
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !amount}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 14, border: 'none',
              fontSize: 15, fontWeight: 800,
              background: loading || !amount
                ? 'rgba(255,211,77,0.3)'
                : 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
              color: '#00152B',
              cursor: loading || !amount ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
              boxShadow: loading || !amount ? 'none' : '0 4px 20px rgba(255,211,77,0.25)',
            }}
          >
            {loading ? 'Processing…' : 'Confirm Transfer'}
          </button>
        </div>

        {/* ── Transfer History ─────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #0A213B 0%, #061C35 100%)',
          borderRadius: 20,
          border: '1px solid rgba(255,211,77,0.12)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            fontSize: 13, fontWeight: 700, color: '#8F98A6',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Recent Transfers
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8F98A6', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📋</div>
              No transfer history yet
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,211,77,0.1)', border: '1px solid rgba(255,211,77,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>⇅</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                      {accountLabel(item.from)} → {accountLabel(item.to)}
                    </div>
                    <div style={{ fontSize: 11, color: '#8F98A6', marginTop: 2 }}>
                      {fmtDate(item.createdAt)} · {item.status}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFD34D' }}>
                  {item.amount?.toFixed(2)} USDC
                </div>
              </div>
            ))
          )}
        </div>

        {/* Not connected notice */}
        {!isConnected && (
          <div style={{
            background: 'rgba(255,211,77,0.06)', borderRadius: 14,
            padding: '14px 18px', border: '1px solid rgba(255,211,77,0.15)',
            fontSize: 13, color: '#8F98A6', textAlign: 'center',
          }}>
            🔐 Connect your wallet to enable transfers
          </div>
        )}

      </div>
    </div>
  );
}
