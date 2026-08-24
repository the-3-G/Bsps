'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/ui/Reusables';
import { Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface VipTierConfigItem {
  vip: number;
  name: string;
  participants: number;
  totalAmount: number;
  interestRate: string;
  amountRange: string;
  amountMin: number;
  amountMax: number;
}

const DEFAULT_VIP_TIERS: VipTierConfigItem[] = [
  {
    vip: 1,
    name: 'Iron',
    participants: 685921,
    totalAmount: 311026894,
    interestRate: '0.28334%',
    amountRange: '1-59999',
    amountMin: 1,
    amountMax: 59999,
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
  },
];

export default function VipTiersConfigPage() {
  const [tiers, setTiers] = useState<VipTierConfigItem[]>(DEFAULT_VIP_TIERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const db = getFirebaseFirestore();
      const docRef = doc(db, 'config', 'vipTiers');
      const snap = await getDoc(docRef);
      if (snap.exists() && Array.isArray(snap.data()?.tiers)) {
        setTiers(snap.data().tiers);
      }
    } catch (err) {
      console.warn('Error loading VIP tiers config from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof VipTierConfigItem, value: any) => {
    setTiers((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === 'participants' || field === 'totalAmount' || field === 'amountMin' || field === 'amountMax'
          ? parseFloat(value) || 0
          : value,
      };
      return copy;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const db = getFirebaseFirestore();
      const docRef = doc(db, 'config', 'vipTiers');
      await setDoc(
        docRef,
        {
          tiers,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setStatusMessage({ type: 'success', text: 'VIP Tiers Configuration saved successfully! Live Dapp updated.' });
    } catch (err: any) {
      console.error('Failed to save VIP Tiers config:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset to default VIP tier values?')) {
      setTiers(DEFAULT_VIP_TIERS);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="VIP Tier Configuration"
        subtitle="Manage and customize VIP deposit tiers, interest rates, requirements, and participation numbers shown in the client Dapp."
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-primary hover:bg-teal-650 rounded transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        }
      />

      {statusMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-xs text-gray-500 font-medium">Loading VIP configuration...</div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier, idx) => (
            <div
              key={tier.vip}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-teal-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-teal-primary text-xs font-extrabold px-2.5 py-1 rounded">
                    VIP {tier.vip}
                  </span>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                    className="font-bold text-sm text-gray-900 border border-gray-200 rounded px-2 py-0.5 focus:border-teal-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Participants */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Participants</label>
                  <input
                    type="number"
                    value={tier.participants}
                    onChange={(e) => handleChange(idx, 'participants', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 font-semibold focus:border-teal-primary focus:outline-none"
                  />
                </div>

                {/* Total amount (USDC) */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Total Amount (USDC)</label>
                  <input
                    type="number"
                    value={tier.totalAmount}
                    onChange={(e) => handleChange(idx, 'totalAmount', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 font-semibold focus:border-teal-primary focus:outline-none"
                  />
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Interest Rate / Rate(ETH)</label>
                  <input
                    type="text"
                    value={tier.interestRate}
                    onChange={(e) => handleChange(idx, 'interestRate', e.target.value)}
                    placeholder="0.28334%"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 font-semibold focus:border-teal-primary focus:outline-none"
                  />
                </div>

                {/* Amount Requirement Text */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Amount Range Display Text</label>
                  <input
                    type="text"
                    value={tier.amountRange}
                    onChange={(e) => handleChange(idx, 'amountRange', e.target.value)}
                    placeholder="1-59999"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 font-semibold focus:border-teal-primary focus:outline-none"
                  />
                </div>

                {/* Min Amount */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Minimum Amount (USDC)</label>
                  <input
                    type="number"
                    value={tier.amountMin}
                    onChange={(e) => handleChange(idx, 'amountMin', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 font-semibold focus:border-teal-primary focus:outline-none"
                  />
                </div>

                {/* Max Amount */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Maximum Amount (USDC)</label>
                  <input
                    type="number"
                    value={tier.amountMax}
                    onChange={(e) => handleChange(idx, 'amountMax', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 font-semibold focus:border-teal-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
