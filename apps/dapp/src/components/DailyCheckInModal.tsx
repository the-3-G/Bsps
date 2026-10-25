'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  X,
  Flame,
  Gift,
  CheckCircle2,
  Lock,
  Sparkles,
  Calendar,
  Wallet,
  Clock,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectWallet?: () => void;
}

interface DayReward {
  day: number;
  amount: number;
  label: string;
  badge?: string;
  isSpecial?: boolean;
}

const REWARD_SCHEDULE: DayReward[] = [
  { day: 1, amount: 1.2, label: 'USDC Voucher' },
  { day: 2, amount: 2.4, label: 'USDC Voucher' },
  { day: 3, amount: 3.6, label: 'USDC Voucher' },
  { day: 4, amount: 4.8, label: 'USDC Voucher', badge: 'Bonus' },
  { day: 5, amount: 6.0, label: 'USDC Voucher' },
  { day: 6, amount: 7.2, label: 'USDC Voucher', badge: 'Mega' },
  { day: 7, amount: 8.4, label: 'Super Staking Voucher', badge: 'Super Box', isSpecial: true },
];

function getUtcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function getYesterdayUtcString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Format countdown until 00:00:00 UTC
function getTimeUntilUtcMidnight(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);

  const diffMs = midnight.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function DailyCheckInModal({ isOpen, onClose, onConnectWallet }: DailyCheckInModalProps) {
  const { isConnected, address, connectWallet } = useWeb3();

  const [streak, setStreak] = useState<number>(0);
  const [lastCheckInDate, setLastCheckInDate] = useState<string>('');
  const [totalClaimed, setTotalClaimed] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [justClaimedReward, setJustClaimedReward] = useState<DayReward | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>(getTimeUntilUtcMidnight());

  const storageKey = useMemo(() => {
    return `bspc_daily_checkin_${address ? address.toLowerCase() : 'guest'}`;
  }, [address]);

  // Load check-in status from LocalStorage & Firestore
  useEffect(() => {
    if (!isOpen) return;

    // 1. LocalStorage
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStreak(parsed.streak || 0);
        setLastCheckInDate(parsed.lastCheckInDate || '');
        setTotalClaimed(parsed.totalClaimed || 0);
      } else {
        setStreak(0);
        setLastCheckInDate('');
        setTotalClaimed(0);
      }
    } catch {
      /* ignore */
    }

    // 2. Sync with Firestore if wallet connected
    if (address) {
      try {
        const db = getFirebaseFirestore();
        const userRef = doc(db, 'users', address.toLowerCase());
        getDoc(userRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.dailyCheckIn) {
              const ci = data.dailyCheckIn;
              setStreak((prev) => (ci.streak !== undefined ? ci.streak : prev));
              setLastCheckInDate((prev) => ci.lastCheckInDate || prev);
              setTotalClaimed((prev) => (ci.totalClaimed !== undefined ? ci.totalClaimed : prev));
            }
          }
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }, [isOpen, storageKey, address]);

  // Live countdown timer until next UTC midnight
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilUtcMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const todayUtc = getUtcDateString();
  const yesterdayUtc = getYesterdayUtcString();

  const isCheckedInToday = lastCheckInDate === todayUtc;

  // Determine current active day (1-7)
  const currentDayIndex = useMemo(() => {
    if (isCheckedInToday) {
      // If checked in today, current day is the current streak
      return Math.max(1, ((streak - 1) % 7) + 1);
    }
    // If not checked in today:
    // If streak was maintained yesterday, next day is (streak % 7) + 1
    if (lastCheckInDate === yesterdayUtc) {
      return (streak % 7) + 1;
    }
    // If streak broken or new user, starts at Day 1
    return 1;
  }, [isCheckedInToday, streak, lastCheckInDate, yesterdayUtc]);

  // Play audio chime on claim
  const playRewardChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // C6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      /* ignore */
    }
  }, []);

  // Handle claiming today's reward
  const handleClaim = async () => {
    if (isCheckedInToday || isClaiming) return;
    setIsClaiming(true);

    const nextStreak = lastCheckInDate === yesterdayUtc ? streak + 1 : 1;
    const rewardDay = ((nextStreak - 1) % 7) + 1;
    const reward = REWARD_SCHEDULE.find((r) => r.day === rewardDay) || REWARD_SCHEDULE[0];
    const newTotal = parseFloat((totalClaimed + reward.amount).toFixed(2));

    // Update Local state
    setStreak(nextStreak);
    setLastCheckInDate(todayUtc);
    setTotalClaimed(newTotal);
    setJustClaimedReward(reward);
    playRewardChime();

    // Persist to LocalStorage
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          streak: nextStreak,
          lastCheckInDate: todayUtc,
          totalClaimed: newTotal,
        })
      );
    } catch {
      /* ignore */
    }

    // Persist to Firestore if wallet is connected
    if (address) {
      try {
        const db = getFirebaseFirestore();
        const userRef = doc(db, 'users', address.toLowerCase());
        await setDoc(
          userRef,
          {
            dailyCheckIn: {
              streak: nextStreak,
              lastCheckInDate: todayUtc,
              totalClaimed: newTotal,
              lastClaimedAt: serverTimestamp(),
              lastRewardAmount: reward.amount,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore check-in sync error:', err);
      }
    }

    setIsClaiming(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 8, 20, 0.82)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Dialog Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 24,
          background: 'linear-gradient(170deg, #071C35 0%, #031427 100%)',
          border: '1px solid rgba(255, 211, 77, 0.35)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(255, 211, 77, 0.12)',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Glow Header Banner */}
        <div
          style={{
            position: 'relative',
            padding: '24px 20px 16px',
            background: 'linear-gradient(180deg, rgba(255, 211, 77, 0.12) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(255, 211, 77, 0.12)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #FFD34D 0%, #DAA520 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(255, 211, 77, 0.35)',
                flexShrink: 0,
              }}
            >
              <Calendar size={24} color="#00152B" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Daily Check-In
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: 'rgba(255, 211, 77, 0.2)',
                    color: '#FFD34D',
                    border: '1px solid rgba(255, 211, 77, 0.4)',
                  }}
                >
                  Rewards
                </span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>
                Check in daily to build streak & earn staking vouchers
              </p>
            </div>
          </div>
        </div>

        {/* Status Dashboard Strip */}
        <div
          style={{
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: 'rgba(0, 21, 43, 0.4)',
            borderBottom: '1px solid rgba(255, 211, 77, 0.08)',
          }}
        >
          {/* Current Streak */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(255, 211, 77, 0.06)',
              border: '1px solid rgba(255, 211, 77, 0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
                flexShrink: 0,
              }}
            >
              <Flame size={18} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Check-In Streak
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#FFD34D' }}>
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>

          {/* Total Claimed */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                flexShrink: 0,
              }}
            >
              <Gift size={18} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Claimed
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#34D399' }}>
                {Number(totalClaimed || 0).toFixed(1)} USDC
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Toast (if just claimed) */}
        {justClaimedReward && (
          <div
            style={{
              margin: '14px 20px 0',
              padding: '12px 16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'bounce 0.5s ease',
            }}
          >
            <Sparkles size={20} color="#34D399" />
            <div style={{ fontSize: 12, color: '#E2E8F0', flex: 1 }}>
              <span style={{ fontWeight: 800, color: '#34D399' }}>Day {justClaimedReward.day} Claimed! </span>
              +{justClaimedReward.amount.toFixed(1)} {justClaimedReward.label} added to your account.
            </div>
          </div>
        )}

        {/* 7-Day Interactive Grid */}
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>
              7-Day Reward Cycle
            </span>
            <span
              style={{
                fontSize: 10,
                color: '#CBD5E1',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'monospace',
              }}
            >
              <Clock size={11} color="#FFD34D" /> Resets in: <strong style={{ color: '#FFD34D' }}>{timeUntilReset}</strong>
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
            }}
          >
            {REWARD_SCHEDULE.map((item) => {
              const isPastClaimed = isCheckedInToday
                ? item.day <= currentDayIndex
                : item.day < currentDayIndex;

              const isTodayActive = isCheckedInToday
                ? false
                : item.day === currentDayIndex;

              const isFutureLocked = !isPastClaimed && !isTodayActive;

              const isDay7 = item.day === 7;

              return (
                <div
                  key={item.day}
                  style={{
                    gridColumn: isDay7 ? 'span 2' : 'span 1',
                    padding: isDay7 ? '12px 14px' : '10px 8px',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: isDay7 ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isDay7 ? 12 : 6,
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    background: isTodayActive
                      ? 'linear-gradient(135deg, rgba(255, 211, 77, 0.22) 0%, rgba(218, 165, 32, 0.12) 100%)'
                      : isPastClaimed
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isTodayActive
                      ? '1.5px solid #FFD34D'
                      : isPastClaimed
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isTodayActive
                      ? '0 0 16px rgba(255, 211, 77, 0.3)'
                      : 'none',
                  }}
                >
                  {/* Badge */}
                  {item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: isDay7 ? 10 : 4,
                        fontSize: 8,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: isDay7 ? '#F59E0B' : '#3B82F6',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Day Label */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: isTodayActive ? '#FFD34D' : '#94A3B8',
                    }}
                  >
                    Day {item.day}
                  </span>

                  {/* Center Icon */}
                  <div
                    style={{
                      width: isDay7 ? 36 : 28,
                      height: isDay7 ? 36 : 28,
                      borderRadius: '50%',
                      background: isPastClaimed
                        ? 'rgba(16, 185, 129, 0.2)'
                        : isTodayActive
                        ? 'rgba(255, 211, 77, 0.25)'
                        : 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isPastClaimed ? (
                      <CheckCircle2 size={isDay7 ? 20 : 16} color="#34D399" />
                    ) : isTodayActive ? (
                      <Gift size={isDay7 ? 20 : 16} color="#FFD34D" />
                    ) : isDay7 ? (
                      <Award size={20} color="#F59E0B" />
                    ) : (
                      <Lock size={14} color="#64748B" />
                    )}
                  </div>

                  {/* Reward Amount */}
                  <div style={{ textAlign: isDay7 ? 'left' : 'center' }}>
                    <div
                      style={{
                        fontSize: isDay7 ? 14 : 11,
                        fontWeight: 900,
                        color: isPastClaimed
                          ? '#34D399'
                          : isTodayActive
                          ? '#FFD34D'
                          : '#E2E8F0',
                      }}
                    >
                      +{item.amount.toFixed(1)}
                      <span style={{ fontSize: 9, fontWeight: 700, marginLeft: 2 }}>USDC</span>
                    </div>
                    {isPastClaimed && (
                      <span style={{ fontSize: 8, color: '#34D399', fontWeight: 800 }}>
                        Claimed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Wallet State / CTA */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Main Action Button */}
          {isCheckedInToday ? (
            <div
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#34D399',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={18} />
              Checked In Today! Next Reward in {timeUntilReset}
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #FFD34D 0%, #F5C538 50%, #DAA520 100%)',
                border: 'none',
                color: '#07172B',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 6px 20px rgba(255, 211, 77, 0.4)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Sparkles size={18} />
              {isClaiming
                ? 'Claiming Reward...'
                : `Claim Day ${currentDayIndex} Reward (+${(
                    REWARD_SCHEDULE.find((r) => r.day === currentDayIndex)?.amount ?? 1.2
                  ).toFixed(1)} USDC)`}
            </button>
          )}

          {/* Wallet Link Status */}
          {isConnected && address ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: 11,
                color: '#94A3B8',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Rewards Credited to:
              </span>
              <span style={{ fontFamily: 'monospace', color: '#FFD34D', fontWeight: 700 }}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: 11,
                color: '#CBD5E1',
              }}
            >
              <span>Connect wallet to claim on-chain vouchers</span>
              <button
                onClick={async () => {
                  if (onConnectWallet) onConnectWallet();
                  else if (connectWallet) await connectWallet();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFD34D',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 11,
                }}
              >
                Connect <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Rule Note */}
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            Check-in resets daily at 00:00 UTC. Unclaimed rewards do not carry forward. Staking vouchers can be activated in your Account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DailyCheckInModal;
