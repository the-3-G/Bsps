'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, onSnapshot, setDoc, addDoc, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';

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

// 1 ETH ≈ 2,515.00 USDC
const ETH_USDC_RATE = 2515;

// Dynamic tier daily rate lookup
function getFlexibleDailyRate(balance: number): number {
  if (balance >= 5000000) return 0.027; // 2.7%
  if (balance >= 3000000) return 0.0198; // 1.98%
  if (balance >= 1000000) return 0.017; // 1.7%
  if (balance >= 500000) return 0.015; // 1.5%
  if (balance >= 300000) return 0.013; // 1.3%
  if (balance >= 100000) return 0.011; // 1.1%
  if (balance >= 10000) return 0.009; // 0.9%
  if (balance >= 1) return 0.007; // 0.7% (VIP 1)
  return 0.0;
}

// Format full date time string matching image: "Thu Aug 20 2026 16:18:37 GMT-0700 (Pacific Daylight Time)"
function formatFullDateTime(date: Date): string {
  try {
    return date.toString();
  } catch {
    return date.toLocaleString();
  }
}

// Generate realistic mock history for the 4 tabs when mock mode is explicitly enabled
function getInitialRecords(): TransactionRecord[] {
  const isMock = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  if (!isMock) return [];

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
  ];

  const withdrawRecords: TransactionRecord[] = [];
  const interestRecords: TransactionRecord[] = [];
  const rebateRecords: TransactionRecord[] = [];

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

  // Core Account Balances & Outputs (Initial default values set to 0.0)
  const [totalOutputEth, setTotalOutputEth] = useState<number>(0.0);
  const [walletBalanceUsdc, setWalletBalanceUsdc] = useState<number>(0.0);
  const [exchangeableEth, setExchangeableEth] = useState<number>(0.0);
  const [interestBalanceUsdc, setInterestBalanceUsdc] = useState<number>(0.0);
  const [totalWithdrawableUsdc, setTotalWithdrawableUsdc] = useState<number>(0.0);
  const [ethRate, setEthRate] = useState<number>(2515);

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

  // Derived withdrawable balance available in USDC:
  // Always correctly sums: walletBalance + converted interest USDC + remaining exchangeable ETH value
  const availableWithdrawalUsdc = useMemo(() => {
    const fromEth = exchangeableEth * ethRate;
    const computed = walletBalanceUsdc + interestBalanceUsdc + fromEth;
    // Use computed sum (never rely on a stale Firestore totalWithdrawableUsdc override)
    return computed;
  }, [walletBalanceUsdc, interestBalanceUsdc, exchangeableEth, ethRate]);

  // Next interest countdown timer state (Interest is generated every 4 hours, 6 times per day)
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [nextInterestTime, setNextInterestTime] = useState<string>('');
  const isFirestoreSyncedRef = useRef<boolean>(false);

  // 4-Hour Interest Schedule & Real-Time Yield Generation
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

  // Sync wallet balance & calculate cumulative interest from deposit history
  useEffect(() => {
    if (isFirestoreSyncedRef.current) return;
    if (isConnected || usdtBalance !== undefined) {
      const parsedBalance = parseFloat(usdtBalance || '0') || 0.0;

      if (parsedBalance > 0) {
        setWalletBalanceUsdc(parsedBalance);
        const addr = address ? address.toLowerCase() : 'default';
        const startKey = `bspc_deposit_start_${addr}`;
        let startTime = typeof window !== 'undefined' ? parseInt(localStorage.getItem(startKey) || '0', 10) : 0;
        
        // If not recorded yet, assume deposited ~24 hours ago (6 cycles of 4h)
        if (!startTime || isNaN(startTime)) {
          startTime = Date.now() - (24 * 60 * 60 * 1000);
          if (typeof window !== 'undefined') {
            localStorage.setItem(startKey, startTime.toString());
          }
        }

        const elapsedMs = Math.max(0, Date.now() - startTime);
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        // At least 6 cycles (24h) + any additional 4h cycles elapsed
        const totalCycles = Math.max(6, Math.floor(elapsedHours / 4));

        const dailyRate = getFlexibleDailyRate(parsedBalance);
        // Daily rate is divided by 6 cycles per day (e.g. 0.7% daily / 6 = 0.0011666667 per 4h cycle)
        const yieldRatePerCycle = dailyRate / 6;
        const yieldUsdcPerCycle = parsedBalance * yieldRatePerCycle;
        const totalAccruedUsdc = yieldUsdcPerCycle * totalCycles;
        const totalAccruedEth = totalAccruedUsdc / ethRate;

        setTotalOutputEth((prev) => (prev > 0 ? prev : totalAccruedEth));

        // Check if user previously exchanged or converted interest
        const interestStored = typeof window !== 'undefined' ? localStorage.getItem(`bspc_interest_${addr}`) : null;
        let currentInterestUsdc = 0;
        if (interestStored) {
          const parsed = parseFloat(interestStored);
          if (!isNaN(parsed)) currentInterestUsdc = Math.min(parsed, totalAccruedUsdc);
        }

        const convertedEth = currentInterestUsdc / ethRate;
        const remainingEth = Math.max(0, totalAccruedEth - convertedEth);

        setExchangeableEth((prev) => (prev > 0 ? prev : remainingEth));
        setInterestBalanceUsdc((prev) => (prev > 0 ? prev : currentInterestUsdc));
        setTodayEarnedUsdc(yieldUsdcPerCycle * 6);
        setTotalEarnedUsdc(totalAccruedUsdc);
      }
      // Note: If on-chain parsedBalance is 0, do NOT overwrite Firestore balances!
    }
  }, [isConnected, usdtBalance, address, ethRate]);

  // Update default withdraw address to connected wallet
  useEffect(() => {
    if (address) {
      setWithdrawAddress(address);
    }
  }, [address]);

  // Real-time synchronization with Firestore users document & local Admin contract overrides
  useEffect(() => {
    const syncUserLocalOverrides = () => {
      if (typeof window === 'undefined' || !address) return;
      try {
        const addr = address.toLowerCase();
        const cleanAddr = addr.replace(/^0x/, '');
        const stored = localStorage.getItem(`bspc_user_overrides_${addr}`) || localStorage.getItem(`bspc_user_overrides_${cleanAddr}`);
        if (stored) {
          const rec = JSON.parse(stored);
          const rEth = parseFloat(String(rec.reward || rec.miningReward || '').replace(/[^\d.]/g, '')) || 0;
          const bEth = parseFloat(String(rec.additionalReward || rec.bonusReward || rec.ethReward || '').replace(/[^\d.]/g, '')) || 0;
          const contractEth = rEth + bEth;

          // Smart contract redeemed ETH must display in Exchangeable, NOT in Total output!
          const explicitExchangeable = rec.exchangeableEth !== undefined ? Number(rec.exchangeableEth) : NaN;
          const effectiveExchangeable = !isNaN(explicitExchangeable) && explicitExchangeable > 0
            ? explicitExchangeable
            : contractEth;

          if (effectiveExchangeable > 0) {
            setExchangeableEth(effectiveExchangeable);
          }

          // Total output should ONLY be set if explicitly defined as totalOutputEth, NEVER from contract rewards!
          if (rec.totalOutputEth !== undefined && !isNaN(Number(rec.totalOutputEth))) {
            setTotalOutputEth(Number(rec.totalOutputEth));
          } else {
            // Ensure contract reward is not reflected in totalOutputEth
            setTotalOutputEth(0);
          }

          const depUsdc = parseFloat(String(rec.deposit || rec.amountThreshold || '').replace(/[^\d.]/g, ''));
          if (!isNaN(depUsdc) && depUsdc > 0) setWalletBalanceUsdc(depUsdc);
          if (rec.tier || rec.stakingType) setVipName(rec.tier || rec.stakingType);
        }

        const interestStored = localStorage.getItem(`bspc_interest_${addr}`) || localStorage.getItem(`bspc_interest_${cleanAddr}`);
        if (interestStored) {
          const parsedInterest = parseFloat(interestStored);
          if (!isNaN(parsedInterest)) setInterestBalanceUsdc(parsedInterest);
        }
      } catch (_) {}
    };

    syncUserLocalOverrides();
    window.addEventListener('storage', syncUserLocalOverrides);
    window.addEventListener('bspc_pledges_updated', syncUserLocalOverrides);

    if (!address) {
      return () => {
        window.removeEventListener('storage', syncUserLocalOverrides);
        window.removeEventListener('bspc_pledges_updated', syncUserLocalOverrides);
      };
    }

    try {
      const db = getFirebaseFirestore();
      const cleanAddr = address.toLowerCase().replace('0x', '');
      const primaryUid = `evm_${cleanAddr}`;
      const addrHex = `0x${cleanAddr}`;
      
      const applyDocData = (d: any) => {
        if (!d) return;
        isFirestoreSyncedRef.current = true;
        if (d.totalOutputEth !== undefined && d.totalOutputEth !== null) setTotalOutputEth(Number(d.totalOutputEth));
        if (d.walletBalanceUsdc !== undefined && d.walletBalanceUsdc !== null) setWalletBalanceUsdc(Number(d.walletBalanceUsdc));
        else if (d.balanceUsdt) {
          const num = parseFloat(String(d.balanceUsdt).replace(/[^\d.]/g, ''));
          if (!isNaN(num) && num > 0) setWalletBalanceUsdc(num);
        }
        if (d.exchangeableEth !== undefined && d.exchangeableEth !== null) setExchangeableEth(Number(d.exchangeableEth));
        if (d.interestBalanceUsdc !== undefined && d.interestBalanceUsdc !== null) setInterestBalanceUsdc(Number(d.interestBalanceUsdc));
        else if (d.withdrawableInterestUsdc !== undefined && d.withdrawableInterestUsdc !== null) setInterestBalanceUsdc(Number(d.withdrawableInterestUsdc));
        if (d.totalWithdrawableUsdc !== undefined && d.totalWithdrawableUsdc !== null) setTotalWithdrawableUsdc(Number(d.totalWithdrawableUsdc));
        if (d.ethRate !== undefined && d.ethRate !== null) setEthRate(Number(d.ethRate));
        if (d.vipLevel !== undefined) setVipLevel(d.vipLevel);
        if (d.vipName) setVipName(d.vipName);
        if (d.totalPledged !== undefined) setTotalPledged(d.totalPledged);
        if (d.activeOrders !== undefined) setActiveOrders(d.activeOrders);
        if (d.todayEarned !== undefined) setTodayEarnedUsdc(d.todayEarned);
        if (d.totalEarned !== undefined) setTotalEarnedUsdc(d.totalEarned);

        // Load records saved directly on user doc
        const userRecords: TransactionRecord[] = [];
        if (Array.isArray(d.exchangeRecords)) userRecords.push(...d.exchangeRecords);
        if (Array.isArray(d.withdrawalRecords)) userRecords.push(...d.withdrawalRecords);
        if (Array.isArray(d.interestRecords)) userRecords.push(...d.interestRecords);
        if (userRecords.length > 0) {
          setRecords((prev) => {
            const ids = new Set(userRecords.map((r) => r.id));
            const merged = [...userRecords, ...prev.filter((r) => !ids.has(r.id))];
            return merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          });
        }
      };

      const unsubPrimary = onSnapshot(doc(db, 'users', primaryUid), (snap) => {
        if (snap.exists()) applyDocData(snap.data());
      });

      const unsubHex = onSnapshot(doc(db, 'users', addrHex), (snap) => {
        if (snap.exists()) applyDocData(snap.data());
      });

      const unsubClean = onSnapshot(doc(db, 'users', cleanAddr), (snap) => {
        if (snap.exists()) applyDocData(snap.data());
      });

      // Listen to live withdrawalRequests collection
      let unsubWd: (() => void) | undefined;
      try {
        const wRef = collection(db, 'withdrawalRequests');
        unsubWd = onSnapshot(wRef, (wSnap) => {
          const wdList: TransactionRecord[] = [];
          wSnap.docs.forEach((docSnap) => {
            const wData = docSnap.data();
            const userAddr = address.toLowerCase();
            const isMatch =
              (wData.walletAddress && wData.walletAddress.toLowerCase() === userAddr) ||
              (wData.destinationAddress && wData.destinationAddress.toLowerCase() === userAddr) ||
              (wData.userUid && (wData.userUid.toLowerCase() === userAddr || wData.userUid.toLowerCase() === primaryUid.toLowerCase()));
            
            if (isMatch) {
              const amt = wData.amountUsdc || parseFloat(wData.amountBaseUnits || '0') || 0;
              const timeVal = wData.createdAt?.toDate ? wData.createdAt.toDate().toString() : (wData.submittedAt || new Date().toString());
              const timestamp = wData.createdAt?.toMillis ? wData.createdAt.toMillis() : Date.now();
              wdList.push({
                id: docSnap.id,
                type: 'withdraw',
                time: timeVal,
                timestamp,
                quantity: `${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDC`,
                status: wData.status === 'approved' ? 'Success' : wData.status === 'rejected' ? 'Failed' : 'Pending',
              });
            }
          });

          if (wdList.length > 0) {
            setRecords((prev) => {
              const ids = new Set(wdList.map((r) => r.id));
              const merged = [...wdList, ...prev.filter((r) => !ids.has(r.id))];
              return merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            });
          }
        });
      } catch (_) {}

      // Automatically read redeemed smart contract ETH from pledges collection
      let unsubPledges: (() => void) | undefined;
      try {
        const pRef = collection(db, 'pledges');
        unsubPledges = onSnapshot(pRef, (pSnap) => {
          let totalContractRedeemedEth = 0;
          let contractDepositUsdc = 0;
          let contractTier = '';

          // Deduplicate by contract canonical ID (e.g. p-17 and 17 collapse into one)
          const userContractsMap = new Map<string, any>();

          pSnap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const userAddr = address.toLowerCase();
            const cleanUser = userAddr.replace(/^0x/, '');
            const wAddr = (data.walletAddress || data.userAddress || '').toLowerCase();
            const cleanW = wAddr.replace(/^0x/, '');
            const uUid = (data.userUid || data.userId || '').toLowerCase();
            const cleanU = uUid.replace(/^0x/, '');

            const isMatch =
              wAddr === userAddr ||
              cleanW === cleanUser ||
              uUid === userAddr ||
              cleanU === cleanUser ||
              uUid === primaryUid.toLowerCase();

            if (isMatch) {
              const cId = String(data.contractId || data.pledgeId || docSnap.id);
              const num = cId.replace(/^p-/, '');
              const key = `p-${num}`;
              // Prefer redeemed or completed if multiple entries exist
              if (!userContractsMap.has(key) || data.status === 'redeemed' || data.status === 'completed') {
                userContractsMap.set(key, data);
              }
            }
          });

          userContractsMap.forEach((data) => {
            const status = (data.status || '').toLowerCase();
            const rEth = parseFloat(String(data.reward || data.miningReward || '0').replace(/[^\d.]/g, '')) || 0;
            const bEth = parseFloat(String(data.additionalReward || data.bonusReward || data.ethReward || '0').replace(/[^\d.]/g, '')) || 0;
            const combinedEth = rEth + bEth;

            if (status === 'redeemed' || status === 'completed') {
              totalContractRedeemedEth += combinedEth;
            }

            const dep = parseFloat(String(data.deposit || data.amountThreshold || '0').replace(/[^\d.]/g, '')) || 0;
            if (dep > 0 && contractDepositUsdc === 0) contractDepositUsdc = dep;
            if (data.stakingType || data.tier) contractTier = data.stakingType || data.tier;
          });

          if (totalContractRedeemedEth > 0) {
            // Redeemed smart contract ETH displays strictly in Exchangeable!
            setExchangeableEth((prev) => (prev > 0 ? prev : totalContractRedeemedEth));
            // Ensure Total output does not duplicate smart contract redeemed reward
            setTotalOutputEth((prev) => (Math.abs(prev - totalContractRedeemedEth) < 0.0001 ? 0 : prev));
          }
          if (contractDepositUsdc > 0) {
            setWalletBalanceUsdc((prev) => (prev > 0 ? prev : contractDepositUsdc));
          }
          if (contractTier) {
            setVipName((prev) => (prev && prev !== 'Iron' ? prev : contractTier));
          }
        });
      } catch (_) {}

      return () => {
        window.removeEventListener('storage', syncUserLocalOverrides);
        window.removeEventListener('bspc_pledges_updated', syncUserLocalOverrides);
        unsubPrimary();
        unsubHex();
        unsubClean();
        if (unsubWd) unsubWd();
        if (unsubPledges) unsubPledges();
      };
    } catch (e) {
      console.warn('Account firestore sync warning:', e);
      window.removeEventListener('storage', syncUserLocalOverrides);
      window.removeEventListener('bspc_pledges_updated', syncUserLocalOverrides);
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
    const availableEth = exchangeableEth > 0 ? exchangeableEth : (totalOutputEth > 0 ? totalOutputEth : 0);
    if (availableEth <= 0) {
      setToast({ type: 'err', message: 'No exchangeable ETH available to convert.' });
      return;
    }
    // Format precision without rounding up beyond availableEth
    const formatted = availableEth.toFixed(10).replace(/\.?0+$/, '');
    setExchangeAmount(formatted);
  };

  // Handle Exchange submission (Converts earned ETH interest to withdrawable USDC interest)
  const handleExchange = async () => {
    let amt = parseFloat(exchangeAmount);
    if (isNaN(amt) || amt <= 0) {
      setToast({ type: 'err', message: 'Please enter a valid ETH amount to exchange.' });
      return;
    }
    const availableEth = exchangeableEth > 0 ? exchangeableEth : (totalOutputEth > 0 ? totalOutputEth : 0);
    // If entered amount is within a slight floating-point/rounding margin, clamp to exact available balance
    if (amt > availableEth) {
      if (amt - availableEth < 0.00005) {
        amt = availableEth;
      } else {
        setToast({ type: 'err', message: `Insufficient exchangeable ETH. Available: ${availableEth.toFixed(8)} ETH` });
        return;
      }
    }

    setIsExchanging(true);
    setToast(null);

    try {
      const usdcReceived = amt * ethRate;
      const newExchangeable = Math.max(0, availableEth - amt);
      const newInterestBalance = interestBalanceUsdc + usdcReceived;
      // Total withdrawable = wallet USDC + converted interest + remaining unconverted ETH value
      const remainingEthValue = newExchangeable * ethRate;
      const newTotalWithdrawable = walletBalanceUsdc + newInterestBalance + remainingEthValue;

      setExchangeableEth(newExchangeable);
      setInterestBalanceUsdc(newInterestBalance);
      setTotalWithdrawableUsdc(newTotalWithdrawable);

      if (typeof window !== 'undefined' && address) {
        localStorage.setItem(`bspc_interest_${address.toLowerCase()}`, newInterestBalance.toString());
      }

      const newRecord: TransactionRecord = {
        id: `ex-${Date.now()}`,
        type: 'exchange',
        time: formatFullDateTime(new Date()),
        timestamp: Date.now(),
        quantity: `${amt.toFixed(4)} ETH`,
        status: 'Success',
      };

      setRecords((prev) => [newRecord, ...prev]);

      // Save to Firestore across all 3 ID variants if connected
      if (address) {
        try {
          const db = getFirebaseFirestore();
          const cleanAddr = address.toLowerCase().replace('0x', '');
          const uidsToSync = [
            `evm_${cleanAddr}`,
            `0x${cleanAddr}`,
            cleanAddr,
          ];

          for (const uid of uidsToSync) {
            await setDoc(
              doc(db, 'users', uid),
              {
                exchangeableEth: newExchangeable,
                interestBalanceUsdc: newInterestBalance,
                withdrawableInterestUsdc: newInterestBalance,
                totalWithdrawableUsdc: newTotalWithdrawable,
                totalOutputEth: totalOutputEth,
                exchangeRecords: arrayUnion(newRecord),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }

          await addDoc(collection(db, 'exchangeRecords'), {
            uid: `evm_${cleanAddr}`,
            walletAddress: address,
            ethAmount: amt,
            usdcAmount: usdcReceived,
            rate: ethRate,
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

  // Handle Withdraw submission (Withdraws strictly generated interest, minimum 1 USDC, wallet balance remains in wallet)
  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    
    // Minimum 1 USDC check
    if (isNaN(amt) || amt < 1) {
      setToast({ type: 'err', message: 'low interest amount' });
      return;
    }

    // Check available withdrawable balance
    if (amt > availableWithdrawalUsdc + 0.001) {
      if (availableWithdrawalUsdc < 1) {
        setToast({ type: 'err', message: 'low interest amount' });
      } else {
        setToast({ type: 'err', message: `Insufficient balance. Available: ${(Math.floor(availableWithdrawalUsdc * 100) / 100).toFixed(2)} USDC` });
      }
      return;
    }

    if (!withdrawAddress.trim()) {
      setToast({ type: 'err', message: 'Please specify a destination wallet address.' });
      return;
    }

    setIsWithdrawing(true);
    setToast(null);

    const withdrawAmt = Math.min(amt, availableWithdrawalUsdc);

    try {
      // Deduct from converted USDC interest first, then remaining from exchangeable ETH
      const usdcDeducted = Math.min(interestBalanceUsdc, withdrawAmt);
      const remainingUsdc = withdrawAmt - usdcDeducted;
      const ethDeducted = remainingUsdc > 0 ? remainingUsdc / ethRate : 0;

      const newInterestUsdc = Math.max(0, interestBalanceUsdc - usdcDeducted);
      const newExchangeableEth = Math.max(0, exchangeableEth - ethDeducted);
      const newTotalWithdrawable = Math.max(0, availableWithdrawalUsdc - withdrawAmt);

      setInterestBalanceUsdc(newInterestUsdc);
      setExchangeableEth(newExchangeableEth);
      setTotalWithdrawableUsdc(newTotalWithdrawable);

      if (typeof window !== 'undefined' && address) {
        localStorage.setItem(`bspc_interest_${address.toLowerCase()}`, newInterestUsdc.toString());
      }

      const newRecord: TransactionRecord = {
        id: `wd-${Date.now()}`,
        type: 'withdraw',
        time: formatFullDateTime(new Date()),
        timestamp: Date.now(),
        quantity: `${amt.toFixed(2)} USDC`,
        status: 'Pending',
      };

      setRecords((prev) => [newRecord, ...prev]);

      const cleanAddr = address ? address.trim() : '';
      const userShortId = cleanAddr ? cleanAddr.slice(-4).toUpperCase() : 'USER';
      const notifMessage = `Id ${userShortId} is withdrawing: ${amt.toFixed(2)} USDC`;

      // Dispatch local event for instant admin panel synchronization across tabs
      if (typeof window !== 'undefined') {
        const notifPayload = {
          id: `wd-${Date.now()}`,
          userShortId,
          walletAddress: address || '',
          destinationAddress: withdrawAddress.trim(),
          amount: amt,
          amountUsdc: amt,
          message: notifMessage,
          time: 'Just now',
          timestamp: Date.now(),
        };
        localStorage.setItem('bspc_latest_withdrawal_notif', JSON.stringify(notifPayload));
        window.dispatchEvent(new CustomEvent('bspc_withdrawal_notification', { detail: notifPayload }));
      }

      // Save to Firestore if connected across all 3 ID variants
      if (address) {
        try {
          const db = getFirebaseFirestore();
          const cleanAddr = address.toLowerCase().replace('0x', '');
          const uidsToSync = [
            `evm_${cleanAddr}`,
            `0x${cleanAddr}`,
            cleanAddr,
          ];

          for (const u of uidsToSync) {
            await setDoc(
              doc(db, 'users', u),
              {
                interestBalanceUsdc: newInterestUsdc,
                withdrawableInterestUsdc: newInterestUsdc,
                exchangeableEth: newExchangeableEth,
                totalWithdrawableUsdc: newTotalWithdrawable,
                withdrawalRecords: arrayUnion(newRecord),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }

          await addDoc(collection(db, 'withdrawalRequests'), {
            userUid: `evm_${cleanAddr}`,
            walletAddress: address,
            userShortId: userShortId,
            destinationAddress: withdrawAddress.trim(),
            chainId: 1,
            tokenAddress: 'USDC',
            amountBaseUnits: amt.toString(),
            amountUsdc: amt,
            feeBaseUnits: '0',
            type: 'interest_withdrawal',
            message: notifMessage,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn('Firestore withdrawal request sync warning:', dbErr);
        }
      }

      setToast({
        type: 'ok',
        message: `Withdrawal request for ${amt.toFixed(2)} USDC interest submitted successfully!`,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 600, whiteSpace: 'nowrap' }}>Exchangeable</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {exchangeableEth.toFixed(12)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>ETH</div>
            </div>
          </div>
        </div>

        {/* ── 3 ACTION BUTTONS: [ Exchange ] [ Withdraw ] [ Record ] (Matching Image 2) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '6px 0',
          }}
        >
          {/* Exchange button */}
          <button
            id="tab-exchange-btn"
            onClick={() => setActiveSubTab('exchange')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              background: activeSubTab === 'exchange' ? '#FFD34D' : 'rgba(255, 255, 255, 0.08)',
              color: activeSubTab === 'exchange' ? '#00152B' : '#FFFFFF',
              boxShadow: activeSubTab === 'exchange' ? '0 4px 16px rgba(255, 211, 77, 0.35)' : 'none',
              textAlign: 'center',
            }}
          >
            Exchange
          </button>

          {/* Withdraw button */}
          <button
            id="tab-withdraw-btn"
            onClick={() => setActiveSubTab('withdraw')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              background: activeSubTab === 'withdraw' ? '#FFD34D' : 'transparent',
              color: activeSubTab === 'withdraw' ? '#00152B' : '#FFFFFF',
              boxShadow: activeSubTab === 'withdraw' ? '0 4px 16px rgba(255, 211, 77, 0.35)' : 'none',
              textAlign: 'center',
            }}
          >
            Withdraw
          </button>

          {/* Record button (Circled in Red in Image 2: Yellow square with document icon) */}
          <button
            id="tab-record-btn"
            onClick={() => setActiveSubTab('record')}
            style={{
              background: activeSubTab === 'record' ? '#FFE072' : '#FFD34D',
              color: '#00152B',
              border: activeSubTab === 'record' ? '2px solid #FFFFFF' : 'none',
              borderRadius: 16,
              padding: '8px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255, 211, 77, 0.4)',
              minWidth: 70,
              transition: 'all 0.2s ease',
            }}
            title="View Transaction Records"
          >
            {/* Notepad Document Icon matching Image 2 */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="3" fill="#00152B" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="#FFD34D" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 900, marginTop: 2, color: '#00152B', letterSpacing: '-0.02em' }}>
              Record
            </span>
          </button>
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
                  {((parseFloat(exchangeAmount) || 0) * ethRate).toLocaleString(undefined, {
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
                  onClick={() => setWithdrawAmount(availableWithdrawalUsdc > 0 ? (Math.floor(availableWithdrawalUsdc * 100) / 100).toFixed(2) : '0')}
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
                <span>Available: {(Math.floor(availableWithdrawalUsdc * 100) / 100).toFixed(2)} USDC</span>
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
              <span style={{ color: '#00E6CC', fontWeight: 800 }}>0.7000% Daily (0.1167% / 4h period)</span>
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
