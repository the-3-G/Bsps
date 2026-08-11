'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@bspc/types';
import { getFirebaseAuth } from '@bspc/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
  logout: () => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isMfaEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>(DEFAULT_SESSIONS);

  // Sync Firebase Auth state and extract custom claim role
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const role = (tokenResult.claims.role as UserRole) || null;
          // Only grant admin session if user has a valid admin role claim
          if (role && ['super_admin', 'operations_admin', 'finance_reviewer', 'support', 'auditor', 'read_only'].includes(role)) {
            setIsAuthenticated(true);
            setUserEmail(firebaseUser.email);
            setUserRole(role);
            document.cookie = 'admin-session=active; path=/';
          } else {
            // Signed in but no admin claim — sign them out
            await signOut(auth);
            setIsAuthenticated(false);
            setUserEmail(null);
            setUserRole(null);
          }
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserRole(null);
          document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      });
      return () => unsubscribe();
    } catch {
      return () => {};
    }
  }, []);

  // login() is called after signInWithEmailAndPassword succeeds in the login page
  // It just sets the session cookie; Firebase onAuthStateChanged handles the rest.
  const login = async (_email: string, _role: UserRole) => {
    document.cookie = 'admin-session=active; path=/';
  };

  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
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
