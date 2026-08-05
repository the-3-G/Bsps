'use client';

import React, { useState } from 'react';
import { PageHeader, StatusBadge } from '../../../components/ui/Reusables';
import { useAuth } from '../../../context/AuthContext';
import { ShieldCheck, Smartphone, ShieldAlert, Ban } from 'lucide-react';

interface MockSecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  ipHash: string;
  approxLocation: string;
  device: string;
  status: 'success' | 'blocked';
}

const mockSecurityEvents: MockSecurityEvent[] = [
  {
    id: 'evt-1',
    timestamp: new Date().toISOString(),
    eventType: 'Admin Session Reauthentication',
    ipHash: '8f43***a10c',
    approxLocation: 'Singapore (Approximate)',
    device: 'Chrome 122 / Windows',
    status: 'success',
  },
  {
    id: 'evt-2',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    eventType: 'Privileged Role Claim Change',
    ipHash: '8f43***a10c',
    approxLocation: 'Singapore (Approximate)',
    device: 'Chrome 122 / Windows',
    status: 'success',
  },
  {
    id: 'evt-3',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    eventType: 'Unauthorized Access Blocked',
    ipHash: '4a09***c721',
    approxLocation: 'Berlin, Germany (Approximate)',
    device: 'Firefox 115 / Linux',
    status: 'blocked',
  }
];

export default function SecurityPage() {
  const { userEmail, userRole, isMfaEnabled, activeSessions, revokeSession } = useAuth();
  const [sessions, setSessions] = useState(activeSessions);

  const handleRevoke = (deviceId: string) => {
    revokeSession(deviceId);
    setSessions(sessions.filter((s) => s.deviceId !== deviceId));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Security Portal"
        subtitle="Review security configurations, multi-factor authentication, active sessions, and gateway events."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Sessions & Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sessions */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Current Active Sessions
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <div key={s.deviceId} className="p-4 flex items-center justify-between hover:bg-gray-50/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">{s.browser}</span>
                      {s.deviceId === 'device-current' && (
                        <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-teal-200">
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-550 font-mono">
                      IP: {s.ipHash} | {s.approxLocation}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Last Active: {new Date(s.lastActive).toLocaleString()}
                    </div>
                  </div>
                  {s.deviceId !== 'device-current' && (
                    <button
                      onClick={() => handleRevoke(s.deviceId)}
                      className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold transition-all border border-red-200"
                    >
                      <Ban className="w-3.5 h-3.5" /> Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Security Events Table */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Security & Audit Events Log
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse dense-table">
                <thead>
                  <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>IP Hash</th>
                    <th>Approx Location</th>
                    <th>Browser/Device</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockSecurityEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-50/50">
                      <td className="text-gray-500 font-mono text-[11px]">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                      <td className="text-gray-800 font-medium">{evt.eventType}</td>
                      <td className="font-mono text-gray-650">{evt.ipHash}</td>
                      <td className="text-gray-500">{evt.approxLocation}</td>
                      <td className="text-gray-500">{evt.device}</td>
                      <td>
                        <StatusBadge
                          status={evt.status}
                          type={evt.status === 'success' ? 'success' : 'error'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Profile & Credentials Info */}
        <div className="space-y-6">
          {/* Identity & Claims */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-teal-primary" /> Verified Role Credentials
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Admin Profile</label>
                <div className="text-xs font-bold text-gray-800 mt-0.5">{userEmail || 'admin@bspc.io'}</div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Custom Claim Role</label>
                <div className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                  {userRole || 'super_admin'}
                </div>
              </div>
            </div>
          </div>

          {/* MFA Status Card */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Smartphone className="w-4 h-4 text-teal-primary" /> Multi-Factor Setup
            </h2>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${isMfaEnabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isMfaEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800">
                  {isMfaEnabled ? 'MFA Configured & Enforced' : 'MFA Required'}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {isMfaEnabled ? 'Device authorization via Totp Authenticator' : 'Configure MFA device to enable access'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
