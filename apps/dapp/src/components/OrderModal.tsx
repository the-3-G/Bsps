'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface VipTierItem {
  vip: number;
  name: string;
  participants: number;
  totalAmount: number;
  interestRate: string;
  amountRange: string;
  amountMin?: number;
  amountMax?: number;
  gradient?: string;
  badgeBg?: string;
  crownColor?: string;
  textColor?: string;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: VipTierItem | null;
  userAvailableUsdt?: number;
  onConfirm?: (amount: number) => void;
}

export function OrderModal({
  isOpen,
  onClose,
  tier,
  userAvailableUsdt = 5,
  onConfirm,
}: OrderModalProps) {
  const [amountInput, setAmountInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAmountInput('');
      setSuccessMsg(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !tier) return null;

  const minAmount = tier.amountMin ?? (parseInt(tier.amountRange.split('-')[0]) || 1);

  const handleAllClick = () => {
    setAmountInput(userAvailableUsdt.toString());
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg(true);
      setTimeout(() => {
        if (onConfirm) onConfirm(parseFloat(amountInput) || minAmount);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          background: '#071628',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid rgba(255, 211, 77, 0.15)',
          boxShadow: '0 -8px 48px rgba(0, 0, 0, 0.7)',
          animation: 'slide-up-order 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          padding: '24px 20px 28px',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Order
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8F98A6',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} color="#FFFFFF" />
          </button>
        </div>

        {/* Content Container Card */}
        <div
          style={{
            background: '#0B1E36',
            borderRadius: 16,
            padding: '20px 16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Row 1: Participants */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 500 }}>Participants</span>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 700 }}>
              {tier.participants.toLocaleString()}
            </span>
          </div>

          {/* Row 2: Total amount(usdc) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 500 }}>Total amount(usdc)</span>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 700 }}>
              {tier.totalAmount.toLocaleString()}
            </span>
          </div>

          {/* Row 3: Amount Requirement */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 500 }}>Amount Requirement</span>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 700 }}>
              {tier.amountRange} USDC
            </span>
          </div>

          {/* Row 4: Rate(ETH) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 500 }}>Rate(ETH)</span>
            <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 700 }}>
              {tier.interestRate}
            </span>
          </div>

          {/* Row 5: Amount Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 500 }}>Amount</span>
            <span style={{ fontSize: 13, color: '#8F98A6', fontWeight: 600 }}>
              Available:{userAvailableUsdt}
            </span>
          </div>

          {/* Amount Input Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={`Not less than ${minAmount} USDC`}
              style={{
                width: '100%',
                height: 50,
                background: '#071628',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '0 50px 0 16px',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleAllClick}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#FFD34D',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              All
            </button>
          </div>
        </div>

        {/* Success Message Banner */}
        {successMsg && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(0, 230, 204, 0.15)',
              border: '1px solid #00E6CC',
              color: '#00E6CC',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            ✓ Order submitted successfully!
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirmSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #FFD34D 0%, #E6C45F 100%)',
            border: 'none',
            color: '#00152B',
            fontSize: 16,
            fontWeight: 800,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(255, 211, 77, 0.25)',
            transition: 'transform 0.1s, filter 0.2s',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? 'Processing...' : 'Confirm'}
        </button>
      </div>

      <style>{`
        @keyframes slide-up-order {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
