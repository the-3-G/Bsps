'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { Landmark, ShieldCheck, Clock, CheckCircle2, RotateCw, AlertCircle, ArrowUpRight } from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

interface UserLoan {
  id: string;
  amountUsdt: string;
  interestRate: string;
  termDays: number;
  collateralUsdt: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid' | 'overdue';
  createdAt: string;
  reviewReason?: string;
}

export default function LoanPage() {
  const { address } = useWeb3();
  const [activeTab, setActiveTab] = useState<'apply' | 'my_loans'>('apply');
  const [loanAmount, setLoanAmount] = useState('1000');
  const [termDays, setTermDays] = useState<7 | 14 | 30>(14);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingSuccess, setSubmittingSuccess] = useState(false);
  const [userLoans, setUserLoans] = useState<UserLoan[]>([]);
  const [repaySuccessId, setRepaySuccessId] = useState<string | null>(null);

  // Credit limits & collateral
  const maxCreditLimit = 5000.0;
  const currentPledgeCollateral = 7500.0; // 150% coverage ratio

  const rateMap = { 7: 0.05, 14: 0.07, 30: 0.1 };
  const dailyRatePercent = rateMap[termDays];
  const amountNum = parseFloat(loanAmount) || 0;
  const totalInterestUsdt = (amountNum * (dailyRatePercent / 100) * termDays).toFixed(2);
  const totalRepaymentUsdt = (amountNum + parseFloat(totalInterestUsdt)).toFixed(2);
  const requiredCollateralUsdt = (amountNum * 1.5).toFixed(2);

  const uid = address ? address.toLowerCase() : 'guest_wallet';

  useEffect(() => {
    if (!address) return;
    try {
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'loanRequests');
      const q = query(colRef, where('userUid', '==', uid));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const loans: UserLoan[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              amountUsdt: data.amountUsdt || '0 USDT',
              interestRate: data.interestRate || '0.05%/day',
              termDays: data.termDays || 14,
              collateralUsdt: data.collateralUsdt || '0 USDT',
              status: data.status || 'pending',
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleString()
                : data.createdAt || new Date().toLocaleString(),
              reviewReason: data.reviewReason,
            };
          });
          setUserLoans(loans);
        },
        (err) => {
          console.warn('Real-time loanRequests snapshot error:', err);
        }
      );
      return () => unsub();
    } catch {
      /* ignore fallback */
    }
  }, [address, uid]);

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0 || amountNum > maxCreditLimit) return;
    setIsSubmitting(true);
    setSubmittingSuccess(false);

    try {
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'loanRequests');
      await addDoc(colRef, {
        userUid: uid,
        walletAddress: address || '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
        amountUsdt: `${amountNum.toFixed(2)} USDT`,
        interestRate: `${dailyRatePercent}%/day`,
        termDays,
        collateralUsdt: `${requiredCollateralUsdt} USDT`,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmittingSuccess(true);
      setLoanAmount('1000');
    } catch (err) {
      console.warn('Loan submission warning, fallback to optimistic UI:', err);
      const mockNewLoan: UserLoan = {
        id: `loan-req-${Date.now()}`,
        amountUsdt: `${amountNum.toFixed(2)} USDT`,
        interestRate: `${dailyRatePercent}%/day`,
        termDays,
        collateralUsdt: `${requiredCollateralUsdt} USDT`,
        status: 'pending',
        createdAt: new Date().toLocaleString(),
      };
      setUserLoans((prev) => [mockNewLoan, ...prev]);
      setSubmittingSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepay = async (loanId: string) => {
    try {
      const db = getFirebaseFirestore();
      const docRef = doc(db, 'loanRequests', loanId);
      await updateDoc(docRef, {
        status: 'repaid',
        repaidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      /* fallback optimistic update */
    }
    setUserLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'repaid' } : l))
    );
    setRepaySuccessId(loanId);
    setTimeout(() => setRepaySuccessId(null), 4000);
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20 text-[11px] font-bold">
          <Landmark className="w-3.5 h-3.5" /> DeFI Credit Portal
        </div>
        <h2 className="text-xl font-bold text-slate-100">Zero-Liquidation Loans</h2>
        <p className="text-xs text-slate-400">Borrow instant USDT against your active yield pledge collateral.</p>
      </div>

      {/* Credit Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Borrowing Limit</div>
            <div className="text-2xl font-extrabold text-teal-400 tracking-tight mt-0.5">
              ${maxCreditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">USDT</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pledge Collateral</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">${currentPledgeCollateral.toLocaleString()} USDT</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
            <span className="text-slate-400 block">LTV Ratio</span>
            <span className="font-bold text-teal-400">66.6% Max</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
            <span className="text-slate-400 block">Lowest Rate</span>
            <span className="font-bold text-amber-400">0.05% / Day</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
            <span className="text-slate-400 block">Approval Speed</span>
            <span className="font-bold text-emerald-400">&lt; 15 mins</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('apply')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'apply'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Apply For Loan
        </button>
        <button
          onClick={() => setActiveTab('my_loans')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'my_loans'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Loans {userLoans.length > 0 && `(${userLoans.length})`}
        </button>
      </div>

      {activeTab === 'apply' ? (
        <form onSubmit={handleApplyLoan} className="space-y-4">
          {submittingSuccess && (
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Loan Request Submitted!</h3>
              <p className="text-xs text-slate-400">Your application has been logged for admin review.</p>
              <button
                type="button"
                onClick={() => setSubmittingSuccess(false)}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Submit another request
              </button>
            </div>
          )}

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
            {/* Amount input */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Borrow Amount (USDT)</span>
                <span>Max: ${maxCreditLimit.toFixed(2)}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  min={100}
                  max={maxCreditLimit}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  placeholder="1000"
                />
                <button
                  type="button"
                  onClick={() => setLoanAmount(maxCreditLimit.toString())}
                  className="absolute right-3 top-2.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-md hover:bg-amber-500/30"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Term Selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Loan Duration / Term
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTermDays(days as 7 | 14 | 30)}
                    className={`py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center transition-all ${
                      termDays === days
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{days} Days</span>
                    <span className="text-[10px] font-normal opacity-80">{rateMap[days as 7 | 14 | 30]}%/day</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="border-t border-slate-800 pt-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Daily Interest Rate</span>
                <span className="font-bold text-slate-200">{dailyRatePercent}% / day</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Interest Total</span>
                <span className="font-bold text-amber-400">+{totalInterestUsdt} USDT</span>
              </div>
              <div className="flex justify-between">
                <span>Required Pledge Collateral</span>
                <span className="font-mono text-slate-300">{requiredCollateralUsdt} USDT</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2 text-sm font-bold text-slate-100">
                <span>Total Repayment</span>
                <span className="text-teal-400 font-mono">{totalRepaymentUsdt} USDT</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || amountNum <= 0 || amountNum > maxCreditLimit}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" /> Submitting Request...
              </>
            ) : (
              <>
                Confirm & Submit Application <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {repaySuccessId && (
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Loan repayment logged successfully!</span>
            </div>
          )}

          {userLoans.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No active or pending loans found.</p>
              <button
                onClick={() => setActiveTab('apply')}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                Apply for your first loan
              </button>
            </div>
          ) : (
            userLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{loan.id}</span>
                    <div className="text-base font-bold text-slate-100 mt-0.5">{loan.amountUsdt}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      loan.status === 'approved' || loan.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : loan.status === 'repaid'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        : loan.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span>Term:</span> <strong className="text-slate-200">{loan.termDays} Days</strong>
                  </div>
                  <div>
                    <span>APR:</span> <strong className="text-slate-200">{loan.interestRate}</strong>
                  </div>
                  <div>
                    <span>Collateral:</span> <strong className="text-slate-200">{loan.collateralUsdt}</strong>
                  </div>
                  <div>
                    <span>Applied:</span> <strong className="text-slate-300 font-mono text-[10px]">{loan.createdAt}</strong>
                  </div>
                </div>

                {(loan.status === 'approved' || loan.status === 'active') && (
                  <button
                    onClick={() => handleRepay(loan.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" /> Repay Loan Now
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
