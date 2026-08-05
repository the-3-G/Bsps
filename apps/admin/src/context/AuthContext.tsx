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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isMfaEnabled, setIsMfaEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);

  useEffect(() => {
    // Load persisted mock session
    const cachedEmail = sessionStorage.getItem('admin-email');
    const cachedRole = sessionStorage.getItem('admin-role') as UserRole;
    if (cachedEmail && cachedRole) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setIsAuthenticated(true);
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setUserEmail(cachedEmail);
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setUserRole(cachedRole);
      // Set session cookie for Middleware
      document.cookie = "admin-session=active; path=/";
    }

    setActiveSessions([
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
      }
    ]);
  }, []);

  const login = async (email: string, role: UserRole) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
    sessionStorage.setItem('admin-email', email);
    sessionStorage.setItem('admin-role', role);
    document.cookie = "admin-session=active; path=/";
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    sessionStorage.removeItem('admin-email');
    sessionStorage.removeItem('admin-role');
    document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  };

  const reauthenticate = async (password: string): Promise<boolean> => {
    // Mock reauthentication signature verification
    return password === 'admin123';
  };

  const revokeSession = (deviceId: string) => {
    setActiveSessions(activeSessions.filter((s) => s.deviceId !== deviceId));
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
