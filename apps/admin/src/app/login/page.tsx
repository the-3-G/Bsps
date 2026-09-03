'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { UserRole } from '@bspc/types';
import { getFirebaseAuth } from '@bspc/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownRemaining > 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

    if (useMock) {
      setTimeout(async () => {
        await login(email, 'super_admin');
        setIsLoading(false);
        router.push('/admin/console');
      }, 1000);
      return;
    }

    try {
      const auth = getFirebaseAuth();

      // Production: only sign in with existing accounts — no auto-creation
      await signInWithEmailAndPassword(auth, email, password);

      // Update frontend context state & navigate to admin console
      await login(email, 'super_admin');
      setFailedAttempts(0);
      setIsLoading(false);
      router.push('/admin/console');
    } catch (err: any) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // Sanitized error messages — don't leak whether user exists or not
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-email'
      ) {
        setErrorMessage('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/user-disabled') {
        setErrorMessage('This account has been disabled. Contact your administrator.');
      } else {
        setErrorMessage('Authentication failed. Please try again.');
      }

      // Activate cooldown after max failed attempts
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        startCooldown();
        setFailedAttempts(0);
      }

      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Enter your email address above, then click Forgot Password.');
      return;
    }
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setErrorMessage(null);
    } catch {
      // Don't reveal whether the email exists — always show success
      setResetEmailSent(true);
      setErrorMessage(null);
    }
  };

  const isLocked = cooldownRemaining > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded border border-gray-200 shadow-lg p-6 space-y-6 select-none">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-50 rounded-full text-teal-primary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Admin Control Gate</h1>
          <p className="text-xs text-gray-500">Authorized Administrative Access Only</p>
        </div>

        {/* Cooldown Warning */}
        {isLocked && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl text-center flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Too many failed attempts. Try again in <span className="font-bold">{cooldownRemaining}s</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {errorMessage}
          </div>
        )}

        {resetEmailSent && (
          <div className="p-3 bg-teal-50 border border-teal-200 text-teal-700 text-xs rounded-xl text-center">
            If an account exists with that email, a password reset link has been sent.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
              required
              disabled={isLocked}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
              required
              disabled={isLocked}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold py-2 rounded transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : isLocked ? `Locked (${cooldownRemaining}s)` : 'Secure Login'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[10px] text-gray-400 hover:text-teal-primary transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
