'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirebaseAuth } from '@bspc/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Mail,
  Lock,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { userEmail, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetEmailSent(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend validation
    if (!currentPassword) {
      setErrorMessage('Please enter your current administrator password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters in length.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update password.');
      } else {
        setSuccessMessage('Administrator password has been updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          handleClose();
        }, 2200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userEmail) return;
    setIsSendingReset(true);
    setErrorMessage(null);
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, userEmail);
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset email failed:', err);
      // Still show confirmation to avoid leaking
      setResetEmailSent(true);
    } finally {
      setIsSendingReset(false);
    }
  };

  const isPasswordValid = newPassword.length >= 8;
  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Change Admin Password</h2>
              <p className="text-[11px] text-gray-500">
                Credentials for <span className="font-semibold text-gray-700">{userEmail || 'admin@bspc.io'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{successMessage}</div>
            </div>
          )}

          {resetEmailSent && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-start gap-2">
              <Mail className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Password reset link sent to <strong>{userEmail}</strong>. Check your inbox to proceed.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Current Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Current Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingReset || isLoading}
                  className="text-[10px] text-teal-600 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isSendingReset ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    'Forgot current password?'
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 pr-9"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 pr-9"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isPasswordValid ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />
                  <span className={isPasswordValid ? 'text-emerald-700 font-medium' : 'text-gray-500'}>
                    {isPasswordValid
                      ? 'Length requirement met (8+ characters)'
                      : `Must be at least 8 characters (${newPassword.length}/8)`}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 pr-9 ${
                    confirmPassword && !isMatching
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-teal-500'
                  }`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  {isMatching ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !currentPassword || !isPasswordValid || !isMatching}
                className="bg-teal-primary hover:bg-teal-hover disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
