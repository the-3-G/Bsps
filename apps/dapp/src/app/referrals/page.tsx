'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, onSnapshot, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

/* ================================================================
   TYPES & MOCK DATA
   ================================================================ */
type SubTab = 'exchange' | 'withdraw' | 'record';
type RecordTab = 'exchange' | 'withdraw' | 'interest' | 'rebate';

interface TransactionRecord {
  id: string;
  type: 'exchange' | 'withdraw' | 'interest' | 'rebate';
  time: string;
  timestamp: number;
  quantity: string;
  status: 'Success' | 'Pending' | 'Failed';
  txHash?: string;
}

// 1 ETH ≈ 2,640.50 USDC
const ETH_USDC_RATE = 2640.50;

// Format full date time string matching image: "Thu Aug 20 2026 16:18:37 GMT-0700 (Pacific Daylight Time)"
function formatFullDateTime(date: Date): string {
  try {
    return date.toString();
  } catch {
    return date.toLocaleString();
  }
}

// Generate realistic mock history for the 4 tabs matching screenshot
function getInitialRecords(): TransactionRecord[] {
  const now = new Date();
  
  // Past exchange records
  const exchangeRecords: TransactionRecord[] = [
    {
      id: 'ex-1',
      type: 'exchange',
      time: 'Thu Aug 20 2026 16:18:37 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-08-20T23:18:37Z').getTime(),
      quantity: '760.6648 ETH',
      status: 'Success',
    },
    {
      id: 'ex-2',
      type: 'exchange',
      time: 'Sat May 16 2026 08:53:20 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-05-16T15:53:20Z').getTime(),
      quantity: '4.3015 ETH',
      status: 'Success',
    },
    {
      id: 'ex-3',
      type: 'exchange',
      time: 'Wed Apr 08 2026 12:40:12 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-04-08T19:40:12Z').getTime(),
      quantity: '38.1279 ETH',
      status: 'Success',
    },
  ];

  // Withdraw records
  const withdrawRecords: TransactionRecord[] = [
    {
      id: 'wd-1',
      type: 'withdraw',
      time: 'Fri Aug 21 2026 10:14:05 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-08-21T17:14:05Z').getTime(),
      quantity: '2,008,535.40 USDC',
      status: 'Success',
    },
    {
      id: 'wd-2',
      type: 'withdraw',
      time: 'Sun May 17 2026 14:22:18 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-05-17T21:22:18Z').getTime(),
      quantity: '11,358.11 USDC',
      status: 'Success',
    },
  ];

  // Interest records (generated every 4 hours, 6x per day in ETH)
  const interestRecords: TransactionRecord[] = [];
  const cycleHours = [0, 4, 8, 12, 16, 20];
  
  for (let i = 0; i < 6; i++) {
    const cycleTime = new Date(now.getTime() - (i * 4 * 3600 * 1000));
    const cycleHour = Math.floor(cycleTime.getHours() / 4) * 4;
    cycleTime.setHours(cycleHour, 0, 0, 0);

    const ethEarned = (6.35466 + (i * 0.002)).toFixed(8);
    interestRecords.push({
      id: `int-${i}`,
      type: 'interest',
      time: formatFullDateTime(cycleTime),
      timestamp: cycleTime.getTime(),
      quantity: `+${ethEarned} ETH`,
      status: 'Success',
    });
  }

  // Rebate records
  const rebateRecords: TransactionRecord[] = [
    {
      id: 'reb-1',
      type: 'rebate',
      time: 'Wed Aug 19 2026 18:30:00 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-08-19T21:30:00Z').getTime(),
      quantity: '0.4520 ETH',
      status: 'Success',
    },
    {
      id: 'reb-2',
      type: 'rebate',
      time: 'Tue Aug 18 2026 09:15:22 GMT-0700 (Pacific Daylight Time)',
      timestamp: new Date('2026-08-18T12:15:22Z').getTime(),
      quantity: '0.3180 ETH',
      status: 'Success',
    },
  ];

  return [...exchangeRecords, ...withdrawRecords, ...interestRecords, ...rebateRecords];
}

/* ================================================================
   MAIN ACCOUNT PAGE COMPONENT
   ================================================================ */
export default function AccountPage() {
  const { address, isConnected, ethBalance, usdtBalance } = useWeb3() as any;

  // Active Sub Tab: 'exchange' | 'withdraw' | 'record'
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('exchange');

  // Active Record Filter: 'exchange' | 'withdraw' | 'interest' | 'rebate'
  const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>('exchange');

  // Core Account Balances & Outputs (from screenshot: 803.094263732077 ETH total, 38.127963732077 ETH exchangeable)
  const [totalOutputEth, setTotalOutputEth] = useState<number>(803.094263732077);
  const [walletBalanceUsdc, setWalletBalanceUsdc] = useState<number>(0.0);
  const [exchangeableEth, setExchangeableEth] = useState<number>(38.127963732077);

  // VIP & Tier details (matching Image 1)
  const [vipLevel, setVipLevel] = useState<number>(1);
  const [vipName, setVipName] = useState<string>('Iron');
  const [totalPledged, setTotalPledged] = useState<number>(0);
  const [activeOrders, setActiveOrders] = useState<number>(0);
  const [todayEarnedUsdc, setTodayEarnedUsdc] = useState<number>(0.0);
  const [totalEarnedUsdc, setTotalEarnedUsdc] = useState<number>(0.0);

  // Exchange form state
  const [exchangeAmount, setExchangeAmount] = useState<string>('0.0');
  const [isExchanging, setIsExchanging] = useState<boolean>(false);

  // Withdraw form state
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // Records list
  const [records, setRecords] = useState<TransactionRecord[]>(getInitialRecords);

  // Feedback toast
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; message: string } | null>(null);

  // Next interest countdown timer state (Interest is generated every 4 hours, 6 times per day)
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [nextInterestTime, setNextInterestTime] = useState<string>('');

  // 4-Hour Interest Schedule Calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHours = now.getHours();

      // Interest cycles at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
      const nextCycleHour = (Math.floor(currentHours / 4) + 1) * 4;
      const nextDate = new Date(now);
      
      if (nextCycleHour >= 24) {
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(nextCycleHour - 24, 0, 0, 0);
      } else {
        nextDate.setHours(nextCycleHour, 0, 0, 0);
      }

      setNextInterestTime(nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const diffMs = nextDate.getTime() - now.getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update default withdraw address to connected wallet
  useEffect(() => {
    if (address) {
      setWithdrawAddress(address);
    }
  }, [address]);

  // Firestore synchronization
  useEffect(() => {
    if (!address) return;
    try {
      const db = getFirebaseFirestore();
      const uid = address.toLowerCase();
      const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          if (d.totalOutputEth !== undefined) setTotalOutputEth(Number(d.totalOutputEth));
          if (d.walletBalanceUsdc !== undefined) setWalletBalanceUsdc(Number(d.walletBalanceUsdc));
          if (d.exchangeableEth !== undefined) setExchangeableEth(Number(d.exchangeableEth));
          if (d.vipLevel !== undefined) setVipLevel(d.vipLevel);
          if (d.vipName) setVipName(d.vipName);
          if (d.totalPledged !== undefined) setTotalPledged(d.totalPledged);
          if (d.activeOrders !== undefined) setActiveOrders(d.activeOrders);
          if (d.todayEarned !== undefined) setTodayEarnedUsdc(d.todayEarned);
          if (d.totalEarned !== undefined) setTotalEarnedUsdc(d.totalEarned);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Account firestore sync warning:', e);
    }
  }, [address]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Handle "Convert all" button
  const handleConvertAll = () => {
    if (exchangeableEth <= 0) {
      setToast({ type: 'err', message: 'No exchangeable ETH available to convert.' });
      return;
    }
    setExchangeAmount(exchangeableEth.toFixed(8).replace(/\.?0+$/, ''));
  };

  // Handle Exchange submission
  const handleExchange = async () => {
    const amt = parseFloat(exchangeAmount);
    if (isNaN(amt) || amt <= 0) {
      setToast({ type: 'err', message: 'Please enter a valid ETH amount to exchange.' });
      return;
    }
    if (amt > exchangeableEth) {
      setToast({ type: 'err', message: `Insufficient exchangeable ETH. Available: ${exchangeableEth.toFixed(8)} ETH` });
      return;
    }

    setIsExchanging(true);
    setToast(null);

    try {
      const usdcReceived = amt * ETH_USDC_RATE;
      const newExchangeable = Math.max(0, exchangeableEth - amt);
      const newWalletUsdc = walletBalanceUsdc + usdcReceived;

      setExchangeableEth(newExchangeable);
      setWalletBalanceUsdc(newWalletUsdc);

      const newRecord: TransactionRecord = {
        id: `ex-${Date.now()}`,
        type: 'exchange',
        time: formatFullDateTime(new Date()),
        timestamp: Date.now(),
        quantity: `${amt.toFixed(4)} ETH`,
        status: 'Success',
      };

      setRecords((prev) => [newRecord, ...prev]);

      // Save to Firestore if connected
      if (address) {
        try {
          const db = getFirebaseFirestore();
          const uid = address.toLowerCase();
          await setDoc(
            doc(db, 'users', uid),
            {
              exchangeableEth: newExchangeable,
              walletBalanceUsdc: newWalletUsdc,
              totalOutputEth: totalOutputEth,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          await addDoc(collection(db, 'exchangeRecords'), {
            uid,
            walletAddress: address,
            ethAmount: amt,
            usdcAmount: usdcReceived,
            rate: ETH_USDC_RATE,
            status: 'Success',
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn('Firestore exchange record sync warning:', dbErr);
        }
      }

      setToast({
        type: 'ok',
        message: `Successfully exchanged ${amt.toFixed(4)} ETH for ${usdcReceived.toFixed(2)} USDC!`,
      });
      setExchangeAmount('0.0');
    } catch (err: any) {
      setToast({ type: 'err', message: err?.message || 'Exchange failed. Please try again.' });
    } finally {
      setIsExchanging(false);
    }
  };

  // Handle Withdraw submission
  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setToast({ type: 'err', message: 'Please enter a valid USDC amount to withdraw.' });
      return;
    }
    if (amt > walletBalanceUsdc) {
      setToast({ type: 'err', message: `Insufficient wallet balance. Available: ${walletBalanceUsdc.toFixed(2)} USDC` });
      return;
    }
    if (!withdrawAddress.trim()) {
      setToast({ type: 'err', message: 'Please specify a destination wallet address.' });
      return;
    }

    setIsWithdrawing(true);
    setToast(null);

    try {
      const newWalletUsdc = Math.max(0, walletBalanceUsdc - amt);
      setWalletBalanceUsdc(newWalletUsdc);

      const newRecord: TransactionRecord = {
        id: `wd-${Date.now()}`,
        type: 'withdraw',
        time: formatFullDateTime(new Date()),
        timestamp: Date.now(),
        quantity: `${amt.toFixed(2)} USDC`,
        status: 'Success',
      };

      setRecords((prev) => [newRecord, ...prev]);

      // Save to Firestore if connected
      if (address) {
        try {
          const db = getFirebaseFirestore();
          const uid = address.toLowerCase();
          await setDoc(
            doc(db, 'users', uid),
            {
              walletBalanceUsdc: newWalletUsdc,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          await addDoc(collection(db, 'withdrawalRequests'), {
            userUid: uid,
            walletAddress: address,
            destinationAddress: withdrawAddress.trim(),
            chainId: 1,
            tokenAddress: 'USDC',
            amountBaseUnits: amt.toString(),
            feeBaseUnits: '0',
            status: 'approved',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('Firestore withdrawal request sync warning:', dbErr);
        }
      }

      setToast({
        type: 'ok',
        message: `Withdrawal request for ${amt.toFixed(2)} USDC submitted successfully!`,
      });
      setWithdrawAmount('');
    } catch (err: any) {
      setToast({ type: 'err', message: err?.message || 'Withdrawal failed. Please try again.' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Filtered records by active record tab
  const filteredRecords = useMemo(() => {
    return records.filter((r) => r.type === activeRecordTab);
  }, [records, activeRecordTab]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#00152B', paddingBottom: 90 }}>
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, margin: '0 auto' }}>

        {/* ── TOAST NOTIFICATION ──────────────────── */}
        {toast && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: toast.type === 'ok' ? 'rgba(0, 230, 204, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${toast.type === 'ok' ? 'rgba(0, 230, 204, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: toast.type === 'ok' ? '#00E6CC' : '#FF6B6B',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <span>{toast.type === 'ok' ? '✓' : '⚠️'}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, padding: 0 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── SECTION TITLE: MY ACCOUNT ────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#FFD34D',
              letterSpacing: '-0.01em',
              margin: 0,
              padding: '4px 0',
            }}
          >
            My Account
          </h1>

          {/* 4h Interest badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 211, 77, 0.08)',
              border: '1px solid rgba(255, 211, 77, 0.2)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 11,
              color: '#FFD34D',
              fontWeight: 700,
            }}
          >
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00E6CC', boxShadow: '0 0 6px #00E6CC' }} />
            4h Yield Cycle: {countdown}
          </div>
        </div>

        {/* ── MY ACCOUNT SUMMARY CARD (Image 2/3/4/5) ── */}
        <div
          style={{
            background: 'linear-gradient(165deg, #0A213B 0%, #061B33 100%)',
            borderRadius: 20,
            padding: '22px 20px',
            border: '1px solid rgba(255, 211, 77, 0.14)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Total output */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 600 }}>Total output</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {totalOutputEth.toFixed(12)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>ETH</div>
            </div>
          </div>

          {/* Wallet balance */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 600 }}>Wallet balance</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
              {walletBalanceUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC
            </span>
          </div>

          {/* Exchangeable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 600 }}>Exchangeable</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {exchangeableEth.toFixed(12)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>ETH</div>
            </div>
          </div>
        </div>

        {/* ── 3 SUB-TABS: [ Exchange ] [ Withdraw ] [ Record ] ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 0',
          }}
        >
          {(['exchange', 'withdraw', 'record'] as SubTab[]).map((tab) => {
            const active = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 24,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: active ? '#FFD34D' : 'transparent',
                  color: active ? '#00152B' : '#FFFFFF',
                  boxShadow: active ? '0 4px 14px rgba(255, 211, 77, 0.3)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'record' ? 'Record' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* ============================================================
            SUB-TAB 1: EXCHANGE VIEW (Image 2, 3, 4)
            ============================================================ */}
        {activeSubTab === 'exchange' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Input Row Container */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Numeric ETH Input */}
              <input
                type="text"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                placeholder="0.0"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'Inter, sans-serif',
                }}
              />

              {/* Swap Icon */}
              <div
                style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: 700,
                  userSelect: 'none',
                  padding: '0 4px',
                }}
              >
                ⇄
              </div>

              {/* USDC Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(39, 117, 202, 0.25)',
                  border: '1px solid rgba(39, 117, 202, 0.4)',
                  borderRadius: 20,
                  padding: '6px 14px',
                }}
              >
                {/* USDC circular icon */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#2775CA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  $
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFD34D' }}>USDC</span>
              </div>
            </div>

            {/* "Convert all" link button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <button
                onClick={handleConvertAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00E6CC',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                Convert all
              </button>

              <span style={{ fontSize: 12, color: '#8F98A6' }}>
                Est: ≈{' '}
                <span style={{ color: '#00E6CC', fontWeight: 700 }}>
                  {((parseFloat(exchangeAmount) || 0) * ETH_USDC_RATE).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  USDC
                </span>
              </span>
            </div>

            {/* Exchange Action Button */}
            <button
              id="exchange-submit-btn"
              onClick={handleExchange}
              disabled={isExchanging}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 24,
                border: 'none',
                background: isExchanging
                  ? 'rgba(255, 211, 77, 0.4)'
                  : 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
                color: '#00152B',
                fontSize: 16,
                fontWeight: 900,
                cursor: isExchanging ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(255, 211, 77, 0.28)',
                transition: 'all 0.2s ease',
              }}
            >
              {isExchanging ? 'Exchanging...' : 'Exchange'}
            </button>

            {/* Description Subtext */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#7F8FA4',
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              Convert the ETH into USDC
            </div>
          </div>
        )}

        {/* ============================================================
            SUB-TAB 2: WITHDRAW VIEW
            ============================================================ */}
        {activeSubTab === 'withdraw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Wallet Destination Address */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8F98A6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Destination Address
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Withdraw Amount (USDC) */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8F98A6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Withdrawal Amount (USDC)
              </label>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                />
                <button
                  onClick={() => setWithdrawAmount(walletBalanceUsdc.toString())}
                  style={{
                    background: 'rgba(255, 211, 77, 0.1)',
                    border: '1px solid rgba(255, 211, 77, 0.3)',
                    borderRadius: 8,
                    color: '#FFD34D',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  MAX
                </button>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFD34D' }}>USDC</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8F98A6', marginTop: 6, padding: '0 2px' }}>
                <span>Available: {walletBalanceUsdc.toFixed(2)} USDC</span>
                <span>Fee: <strong style={{ color: '#00E6CC' }}>0.00 USDC</strong></span>
              </div>
            </div>

            {/* Withdraw Action Button */}
            <button
              id="withdraw-submit-btn"
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 24,
                border: 'none',
                background: isWithdrawing
                  ? 'rgba(255, 211, 77, 0.4)'
                  : 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
                color: '#00152B',
                fontSize: 16,
                fontWeight: 900,
                cursor: isWithdrawing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(255, 211, 77, 0.28)',
                transition: 'all 0.2s ease',
              }}
            >
              {isWithdrawing ? 'Processing Withdrawal...' : 'Withdraw'}
            </button>

            {/* Helper text */}
            <div style={{ textAlign: 'center', fontSize: 13, color: '#7F8FA4', fontWeight: 500 }}>
              Convert the earned ETH into USDC before withdrawing funds
            </div>
          </div>
        )}

        {/* ============================================================
            SUB-TAB 3: RECORD VIEW (Image 5)
            ============================================================ */}
        {activeSubTab === 'record' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Record Filter Sub-Navigation: Exchange | Withdraw | Interest | Rebate */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: 4,
              }}
            >
              {(['exchange', 'withdraw', 'interest', 'rebate'] as RecordTab[]).map((tab) => {
                const active = activeRecordTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveRecordTab(tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px 10px',
                      fontSize: 14,
                      fontWeight: active ? 800 : 500,
                      color: active ? '#FFD34D' : '#8F98A6',
                      cursor: 'pointer',
                      position: 'relative',
                      textTransform: 'capitalize',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {active && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '15%',
                          right: '15%',
                          height: 3,
                          borderRadius: 2,
                          background: '#FFD34D',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Table Header: Time | Quantity | Status */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1.2fr 0.8fr',
                padding: '4px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#8F98A6',
              }}
            >
              <div>Time</div>
              <div style={{ textAlign: 'center' }}>Quantity</div>
              <div style={{ textAlign: 'right' }}>Status</div>
            </div>

            {/* Record Cards List */}
            {filteredRecords.length === 0 ? (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 16,
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#8F98A6',
                  fontSize: 13,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                No {activeRecordTab} records found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRecords.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'linear-gradient(160deg, #0A1E34 0%, #06172B 100%)',
                      borderRadius: 16,
                      padding: '14px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'grid',
                      gridTemplateColumns: '1.8fr 1.2fr 0.8fr',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {/* Time */}
                    <div
                      style={{
                        fontSize: 11,
                        color: '#FFFFFF',
                        fontWeight: 500,
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.time}
                    </div>

                    {/* Quantity */}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.quantity}
                    </div>

                    {/* Status */}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: item.status === 'Success' ? '#00E6CC' : '#FFD34D',
                        textAlign: 'right',
                      }}
                    >
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERSHIP & 4-HOUR DIVIDEND DETAILS (Image 1) ── */}
        <div
          style={{
            background: 'linear-gradient(160deg, #0A213B 0%, #061C35 100%)',
            borderRadius: 20,
            padding: '20px',
            border: '1px solid rgba(255, 211, 77, 0.12)',
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 13, color: '#8F98A6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Membership & Interest Rules
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(255,211,77,0.15), rgba(255,211,77,0.05))',
                border: '1px solid rgba(255,211,77,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 18l3-8 4 5 4-9 4 5 3-3" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 18h18" stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8F98A6' }}>Current Tier</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD34D' }}>
                VIP {vipLevel} — {vipName}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8F98A6' }}>Interest Rate</span>
              <span style={{ color: '#00E6CC', fontWeight: 800 }}>0.28334% / period</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8F98A6' }}>Dividend Frequency</span>
              <span style={{ color: '#FFD34D', fontWeight: 800 }}>Every 4 Hours (6x / day)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8F98A6' }}>Interest Currency</span>
              <span style={{ color: '#FFFFFF', fontWeight: 800 }}>ETH</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8F98A6' }}>Next Distribution</span>
              <span style={{ color: '#00E6CC', fontWeight: 800 }}>{nextInterestTime} ({countdown})</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8F98A6' }}>Next Tier</span>
              <span style={{ color: '#FFD34D', fontWeight: 800 }}>VIP 2 — Bronze</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
