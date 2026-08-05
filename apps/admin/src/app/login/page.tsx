'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { UserRole } from '@bspc/types';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth check
    setTimeout(async () => {
      await login(email, role);
      setIsLoading(false);
      router.push('/admin/console');
    }, 1000);
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
