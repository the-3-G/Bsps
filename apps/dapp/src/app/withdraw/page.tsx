'use client';

import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ShieldAlert, Landmark, Info } from 'lucide-react';

export default function WithdrawPage() {
  const { address } = useWeb3();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [txConfirmed, setTxConfirmed] = useState(false);

  const availableBalance = 12450.00;
  const platformFee = 2.50;
  const amountNum = parseFloat(withdrawAmount) || 0;
  const netAmount = Math.max(0, amountNum - platformFee);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum > 0 && amountNum <= availableBalance) {
      setIsConfirming(true);
    }
  };

  const handleConfirmSubmit = () => {
    setIsConfirming(false);
    setTxConfirmed(true);
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Withdrawal Request</h2>
        <p className="text-xs text-slate-500">Initiate validation yield sweeps payout.</p>
      </div>

      {txConfirmed ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-teal-950 text-teal-primary rounded-full flex items-center justify-center mx-auto border border-teal-800">
            ✓
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100">Sweep Submitted Successfully</h3>
            <p className="text-xs text-slate-400">Your withdrawal review is pending operator authorization.</p>
          </div>
          <button
            onClick={() => {
              setTxConfirmed(false);
              setWithdrawAmount('');
            }}
            className="w-full bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold py-2 rounded-xl transition-all"
          >
            Create New Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="card-glass rounded-2xl p-4 space-y-4">
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Asset</span>
                <span>Available: {availableBalance.toFixed(2)} USDC</span>
              </div>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-primary">
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Destination Address</label>
              <input
                type="text"
                disabled
                value={address || '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-500 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Withdrawal Amount (USDC)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                max={availableBalance}
                min={5}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-primary"
              />
            </div>

            <div className="border-t border-slate-800 pt-3 text-[10px] space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Platform charge fee</span>
                <span className="font-mono">{platformFee.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200 border-t border-slate-850 pt-1.5">
                <span>Net payout estimate</span>
                <span className="font-mono text-teal-primary">{netAmount.toFixed(2)} USDC</span>
              </div>
            </div>
          </div>

          {/* Risk warning */}
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-bold text-red-300">Sweep Protocol Safety Check</h4>
              <p className="text-[9px] text-red-400/80 leading-relaxed">
                Review security configurations. Make sure destination wallet is not controlled by malicious smart contracts.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={amountNum <= 0 || amountNum > availableBalance}
            className="w-full bg-teal-primary hover:bg-teal-hover disabled:opacity-40 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg"
          >
            Authorize Yield Sweep
          </button>
        </form>
      )}

      {/* Confirmation Dialog */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-xs w-full space-y-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-primary" /> Confirm Signature request
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Are you sure you want to authorize withdrawal of {withdrawAmount} USDC to destination {address || '0x952...BAfe5'}?
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setIsConfirming(false)}
                className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold"
              >
                Reject
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="bg-teal-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
              >
                Approve Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
