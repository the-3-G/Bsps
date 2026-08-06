'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@bspc/types';

interface SessionInfo {
  deviceId: string;
  ipHash: string;
  approxLocation: string;
  browser: string;
  lastActive: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: UserRole | null;
  isMfaEnabled: boolean;
  activeSessions: SessionInfo[];
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  reauthenticate: (password: string) => Promise<boolean>;
  revokeSession: (deviceId: string) => void;
}

const DEFAULT_SESSIONS: SessionInfo[] = [
  {
    deviceId: 'device-current',
    ipHash: '8f43***a10c',
    approxLocation: 'Singapore (Approximate Location)',
    browser: 'Chrome 122 / Windows 11',
    lastActive: new Date().toISOString(),
  },
  {
    deviceId: 'device-secondary',
    ipHash: '3b11***f88b',
    approxLocation: 'London, UK (Informational Only)',
    browser: 'Safari / iPhone 15',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem('admin-email') && sessionStorage.getItem('admin-role'));
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('admin-email');
  });
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('admin-role') as UserRole;
  });
  const [isMfaEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>(DEFAULT_SESSIONS);

  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      // UX navigation cookie (Security is enforced server-side via Firebase Auth Custom Claims)
      document.cookie = 'admin-session=active; path=/';
    }
  }, [isAuthenticated]);

  const login = async (email: string, role: UserRole) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
    sessionStorage.setItem('admin-email', email);
    sessionStorage.setItem('admin-role', role);
    document.cookie = 'admin-session=active; path=/';
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    sessionStorage.removeItem('admin-email');
    sessionStorage.removeItem('admin-role');
    document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const reauthenticate = async (password: string): Promise<boolean> => {
    return Boolean(password);
  };

  const revokeSession = (deviceId: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.deviceId !== deviceId));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        userRole,
        isMfaEnabled,
        activeSessions,
        login,
        logout,
        reauthenticate,
        revokeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
