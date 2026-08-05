'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

interface ReauthProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  sensitiveActionLabel: string;
}

export function ReauthDialog({ isOpen, onSuccess, onCancel, sensitiveActionLabel }: ReauthProps) {
  const { reauthenticate } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const valid = await reauthenticate(password);
    if (valid) {
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden select-none">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-primary" />
          <h2 className="text-sm font-bold text-gray-900">Security Verification Required</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            You are performing a highly sensitive action: <span className="font-bold text-red-600">{sensitiveActionLabel}</span>.
            Please reauthenticate by verifying your administrator password.
          </p>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Confirm password (admin123)"
              className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
              required
            />
            {error && (
              <p className="text-[10px] text-red-600 mt-1 font-semibold">
                Verification failed. Incorrect credentials.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold rounded transition-all"
            >
              Verify & Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
