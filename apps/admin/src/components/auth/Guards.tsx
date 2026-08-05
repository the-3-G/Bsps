'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: GuardProps) {
  const { userRole } = useAuth();

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-white border border-red-200 rounded shadow-sm mt-12">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-sm font-bold text-gray-900">Access Denied</h2>
        <p className="text-xs text-gray-600">
          Your assigned role ({userRole || 'unassigned'}) does not possess permission to access this administrative console.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function PermissionGuard({
  children,
  actionPermissions,
  fallback,
}: {
  children: React.ReactNode;
  actionPermissions: string[];
  fallback?: React.ReactNode;
}) {
  const { userRole } = useAuth();

  // Mapping role permissions
  const rolePermissions: Record<string, string[]> = {
    super_admin: ['all', 'read', 'write', 'finance_review', 'audit_view'],
    operations_admin: ['read', 'write'],
    finance_reviewer: ['read', 'finance_review'],
    support: ['read'],
    auditor: ['read', 'audit_view'],
    read_only: ['read'],
  };

  const currentPerms = userRole ? rolePermissions[userRole] || [] : [];
  const hasPermission = actionPermissions.every(
    (p) => currentPerms.includes('all') || currentPerms.includes(p)
  );

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
