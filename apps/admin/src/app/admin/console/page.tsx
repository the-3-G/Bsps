'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, StatusBadge } from '../../../components/ui/Reusables';
import { mockLoginRecords, mockUsers } from '../../../mocks/db';
import { userRepository, loginEventRepository } from '../../../repositories';
import { DbLoginEvent } from '@bspc/types';
import { Users, Cpu, DollarSign, Clock, ShieldAlert, KeyRound } from 'lucide-react';
import { ExportButton } from '../../../components/ui/DataTable';

export default function ConsolePage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [suspendedUsers, setSuspendedUsers] = useState<number>(0);
  const [loginRecords, setLoginRecords] = useState<any[]>([]);

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      const tot = mockUsers.length;
      const act = mockUsers.filter((u) => u.status === 'active').length;
      setTotalUsers(tot);
      setActiveUsers(act);
      setSuspendedUsers(tot - act);
      setLoginRecords(mockLoginRecords);
      return;
    }

    userRepository
      .listUsers()
      .then((users) => {
        const tot = users.length;
        const act = users.filter((u) => u.status === 'active').length;
        setTotalUsers(tot);
        setActiveUsers(act);
        setSuspendedUsers(tot - act);
      })
      .catch((err) => {
        console.error('Failed to load user stats from repository:', err);
        setTotalUsers(0);
        setActiveUsers(0);
        setSuspendedUsers(0);
      });

    loginEventRepository
      .listLoginEvents(15) // fetch recent 15 logins
      .then((events: DbLoginEvent[]) => {
        setLoginRecords(events.map((ev: DbLoginEvent) => ({
          id: ev.eventId,
          timestamp: ev.createdAt,
          ipAddress: ev.ipHash,
          approxLocation: ev.countryCode || 'Unknown',
          device: ev.userAgentSummary,
          result: ev.success ? 'success' : 'failed'
        })));
      })
      .catch((err: unknown) => {
        console.error('Failed to load login events:', err);
      });

  }, []);

  // Masking states for security demonstration
  const [hasAuditPermission, setHasAuditPermission] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        subtitle="System dashboard overview and active administration console."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setHasAuditPermission(!hasAuditPermission)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border transition-all ${
                hasAuditPermission
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              {hasAuditPermission ? 'Revoke Audit View' : 'Request Audit View'}
            </button>
            <ExportButton
              data={loginRecords as unknown as Record<string, unknown>[]}
              filename="login_audit_logs"
            />
          </div>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded text-teal-primary shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Users</div>
            <div className="text-xl font-bold text-gray-800">{totalUsers}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Active: {activeUsers} | Suspended: {suspendedUsers}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded text-blue-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Funds Swept</div>
            <div className="text-xl font-bold text-gray-800">452,190.50 USDC</div>
            <div className="text-[10px] text-teal-primary mt-1">✓ On-chain verified</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded text-amber-600 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Pledge APR</div>
            <div className="text-xl font-bold text-gray-800">18.5% Avg</div>
            <div className="text-[10px] text-gray-500 mt-1">15 active contracts</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded text-purple-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collection Sweeper</div>
            <div className="text-xl font-bold text-gray-800">Online</div>
            <div className="text-[10px] text-green-600 mt-1">Normal gas fees</div>
          </div>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Login Records */}
        <div className="lg:col-span-2 bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Recent login information for this account.
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse dense-table">
              <thead>
                <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500">
                  <th>Login Time</th>
                  <th>IP Address</th>
                  <th>Approximate IP Location</th>
                  <th>Browser/Device</th>
                  <th>Login Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loginRecords.map((log) => {
                  const maskedIp = log.ipAddress.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.***.***');
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="text-gray-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="font-mono text-xs text-gray-700">
                        {hasAuditPermission ? log.ipAddress : maskedIp}
                      </td>
                      <td className="text-gray-650">{log.approxLocation}</td>
                      <td className="text-gray-500">{log.device}</td>
                      <td>
                        <StatusBadge
                          status={log.result}
                          type={log.result === 'success' ? 'success' : 'error'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Alerts and Security Controls */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 space-y-4">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Security Watch
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-100 rounded text-xs">
              <div className="font-bold text-red-800">Suspended Users Active</div>
              <p className="text-red-650 mt-1">
                There are currently {suspendedUsers} suspended user accounts locked from withdrawing.
              </p>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-100 rounded text-xs">
              <div className="font-bold text-teal-800">System Mode Status</div>
              <p className="text-teal-650 mt-1">
                Authorized Web3 connection enabled. No active transfers detected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
