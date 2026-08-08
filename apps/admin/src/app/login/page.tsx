'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { UserRole } from '@bspc/types';
import { getFirebaseAuth, getFirebaseFunctions } from '@bspc/firebase';
import { signInAnonymously } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

    if (useMock) {
      setTimeout(async () => {
        await login(email, role);
        setIsLoading(false);
        router.push('/admin/console');
      }, 1000);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const functions = getFirebaseFunctions();

      // 1. Attempt Firebase emulator Auth & custom claims
      try {
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;

        const devSetAdminClaimsFn = httpsCallable<{ uid: string; role: string }, { success: boolean }>(
          functions,
          'devSetAdminClaims'
        );
        await devSetAdminClaimsFn({ uid, role });
        await userCredential.user.getIdToken(true);
      } catch (emErr: any) {
        console.warn('Firebase emulator claims step warning (proceeding with local admin session):', emErr?.message || emErr);
      }

      // 2. Update frontend context state & navigate to admin console
      await login(email, role);
      setIsLoading(false);
      router.push('/admin/console');
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded border border-gray-200 shadow-lg p-6 space-y-6 select-none">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-50 rounded-full text-teal-primary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Admin Control Gate</h1>
          <p className="text-xs text-gray-500">BSPC Administrative Authentication Portal</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bspc.io"
              className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Role Assignment (Mock)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded p-2 text-xs bg-white focus:outline-none focus:border-teal-primary text-gray-855"
            >
              <option value="super_admin">super_admin</option>
              <option value="operations_admin">operations_admin</option>
              <option value="finance_reviewer">finance_reviewer</option>
              <option value="support">support</option>
              <option value="auditor">auditor</option>
              <option value="read_only">read_only</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold py-2 rounded transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Authenticating Gateway...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
