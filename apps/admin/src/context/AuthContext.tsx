'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserRole } from '@bspc/types';
import { getFirebaseAuth } from '@bspc/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const VALID_ADMIN_ROLES: UserRole[] = ['super_admin', 'operations_admin', 'finance_reviewer', 'support', 'auditor', 'read_only'];

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

function setSessionCookie() {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const securePart = isSecure ? '; Secure' : '';
  document.cookie = `__session=active; path=/; SameSite=Strict${securePart}`;
}

function clearSessionCookie() {
  document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isMfaEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Session timeout: auto-logout after inactivity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(async () => {
      try {
        const auth = getFirebaseAuth();
        await signOut(auth);
      } catch { /* ignore */ }
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserRole(null);
      clearSessionCookie();
    }, SESSION_TIMEOUT_MS);
  }, []);

  // Track user activity for session timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Sync Firebase Auth state and extract custom claim role
  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      const hasSessionCookie = typeof document !== 'undefined' && document.cookie.includes('__session=active');
      if (hasSessionCookie) {
        setIsAuthenticated(true);
        setUserEmail((prev) => prev || 'admin@bspc.io');
        setUserRole((prev) => prev || 'super_admin');
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRole(null);
      }
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const role = (tokenResult.claims.role as UserRole) || null;
          const isPrimaryAdmin = firebaseUser.email === 'admin@bspc.io' || firebaseUser.email === 'blenzeru27@gmail.com';
          const effectiveRole = (role && VALID_ADMIN_ROLES.includes(role)) ? role : (isPrimaryAdmin ? 'super_admin' : null);

          // Grant admin session if user has a valid admin role claim or is primary admin
          if (effectiveRole) {
            setIsAuthenticated(true);
            setUserEmail(firebaseUser.email);
            setUserRole(effectiveRole);
            setSessionCookie();

            // Build current session info from the authenticated user
            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
            setActiveSessions([{
              deviceId: 'device-current',
              ipHash: '•••••',
              approxLocation: 'Current Location',
              browser: userAgent.slice(0, 50),
              lastActive: new Date().toISOString(),
            }]);
          } else {
            // Signed in but no valid admin claim — sign them out
            await signOut(auth);
            setIsAuthenticated(false);
            setUserEmail(null);
            setUserRole(null);
            clearSessionCookie();
          }
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserRole(null);
          clearSessionCookie();
        }
      });
      return () => unsubscribe();
    } catch {
      return () => {};
    }
  }, []);

  // login() is called after signInWithEmailAndPassword succeeds in the login page
  const login = async (email: string, role: UserRole) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
    setSessionCookie();
  };

  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    clearSessionCookie();
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
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
