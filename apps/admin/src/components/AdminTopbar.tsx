'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  RotateCw,
  Maximize,
  Minimize,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
} from 'lucide-react';

import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface AdminTopbarProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NotificationItem {
  id: string;
  type: 'withdrawal' | 'wallet_connected';
  title: string;
  message: string;
  userShortId?: string;
  address?: string;
  amount?: string;
  balance?: string;
  time: string;
  status?: string;
  authStatus?: string;
  link: string;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  isSidebarExpanded,
  setIsSidebarExpanded,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const router = useRouter();
  const { logout, userEmail, userRole } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  // Notification Bell & Live Alert Banner state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeAlert, setActiveAlert] = useState<{ id: string; message: string; link: string } | null>(null);
  const [lastNotifiedWdId, setLastNotifiedWdId] = useState<string>('');

  // Audio alert chime using Web Audio API (smooth 2-tone alert chime)
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: High crisp bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Harmonious chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now + 0.1); // E6
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);
    } catch {
      /* ignore audio autoplay restrictions */
    }
  };

  // Browser desktop notification helper
  const triggerDesktopNotification = (title: string, body: string) => {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification(title, { body, icon: '/favicon.ico' });
            }
          });
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // Request desktop notification permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    // 1. Listen for local storage cross-tab events
    const handleLocalWithdrawal = (e: any) => {
      const payload = e.detail || (e.key === 'bspc_latest_withdrawal_notif' && e.newValue ? JSON.parse(e.newValue) : null);
      if (payload && payload.message) {
        const notifId = payload.id || `wd-${Date.now()}`;
        setActiveAlert({
          id: notifId,
          message: payload.message,
          link: '/admin/withdrawals',
        });
        playNotificationChime();
        triggerDesktopNotification('BSPC Admin: New Withdrawal Request', payload.message);

        setNotifications((prev) => [
          {
            id: notifId,
            type: 'withdrawal',
            title: 'Interest Withdrawal',
            message: payload.message,
            userShortId: payload.userShortId,
            address: payload.walletAddress,
            amount: `${payload.amount || payload.amountUsdc || '0'} USDC`,
            time: 'Just now',
            status: 'Pending Review',
            link: '/admin/withdrawals',
          },
          ...prev.filter((item) => item.id !== notifId),
        ]);
      }
    };

    window.addEventListener('bspc_withdrawal_notification', handleLocalWithdrawal);
    window.addEventListener('storage', handleLocalWithdrawal);

    // 2. Real-time Firestore listeners for withdrawals and active users
    let unsubWithdrawals: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    try {
      if (!isMockMode) {
        const db = getFirebaseFirestore();

        // Listen for live withdrawal requests
        try {
          const wRef = collection(db, 'withdrawalRequests');
          unsubWithdrawals = onSnapshot(wRef, (snap) => {
            const wdNotifs: NotificationItem[] = [];
            snap.docs.forEach((d) => {
              const data = d.data();
              const addr = data.walletAddress || data.destinationAddress || '';
              const shortId = data.userShortId || (addr ? addr.slice(-4).toUpperCase() : 'USER');
              const amountStr = data.amountUsdc ? `${data.amountUsdc} USDC` : `${data.amountBaseUnits || '0'} USDC`;
              const msg = data.message || `Id ${shortId} is withdrawing interest: ${amountStr}`;

              wdNotifs.push({
                id: d.id,
                type: 'withdrawal',
                title: 'Interest Withdrawal Request',
                message: msg,
                userShortId: shortId,
                address: addr,
                amount: amountStr,
                time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString() : 'Just now',
                status: data.status === 'approved' ? 'Approved' : 'Pending Review',
                link: '/admin/withdrawals',
              });
            });

            // If there's a new pending withdrawal, show alert banner & play chime
            const latestPending = wdNotifs.find((n) => n.status === 'Pending Review');
            if (latestPending && latestPending.id !== lastNotifiedWdId) {
              setLastNotifiedWdId(latestPending.id);
              setActiveAlert({
                id: latestPending.id,
                message: latestPending.message,
                link: latestPending.link,
              });
              playNotificationChime();
              triggerDesktopNotification('BSPC Admin: New Withdrawal Pending Review', latestPending.message);
            }

            setNotifications((prev) => {
              const userOnly = prev.filter((n) => n.type !== 'withdrawal');
              return [...wdNotifs, ...userOnly].slice(0, 10);
            });
          });
        } catch (wdErr) {
          console.warn('Withdrawal Firestore subscription warning:', wdErr);
        }

        // Listen for live connected users
        try {
          unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const userNotifs: NotificationItem[] = [];
            snap.docs.forEach((d) => {
              const data = d.data();
              if (data.walletAddress || data.uid) {
                const addr = data.walletAddress || d.id;
                userNotifs.push({
                  id: d.id,
                  type: 'wallet_connected',
                  title: 'ETH Wallet Connected',
                  message: `Wallet ${addr.slice(0, 6)}...${addr.slice(-4)} connected`,
                  address: addr,
                  balance: data.balanceUsdt || (data.walletBalanceUsdc ? `${data.walletBalanceUsdc} USDC` : '$0.00 USDT'),
                  time: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toLocaleTimeString() : 'Just now',
                  authStatus: data.authorizationStatus || 'unauthorized',
                  link: '/admin/users',
                });
              }
            });

            setNotifications((prev) => {
              const wdOnly = prev.filter((n) => n.type === 'withdrawal');
              return [...wdOnly, ...userNotifs].slice(0, 10);
            });
          });
        } catch (userErr) {
          console.warn('Users Firestore subscription warning:', userErr);
        }
      }
    } catch (err) {
      console.warn('Firebase notification setup warning:', err);
    }

    return () => {
      window.removeEventListener('bspc_withdrawal_notification', handleLocalWithdrawal);
      window.removeEventListener('storage', handleLocalWithdrawal);
      if (unsubWithdrawals) unsubWithdrawals();
      if (unsubUsers) unsubUsers();
    };
  }, [isMockMode, lastNotifiedWdId]);

  // Auto-dismiss floating alert after 10 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => setActiveAlert(null), 10000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  return (
    <header className="relative flex items-center justify-between h-14 bg-white border-b border-gray-200 px-4 select-none shrink-0 z-30">
      {/* Live Floating Withdrawal Alert Banner */}
      {activeAlert && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-amber-400 animate-bounce">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs font-bold text-amber-300">🔔 {activeAlert.message}</span>
          <button
            onClick={() => {
              router.push(activeAlert.link);
              setActiveAlert(null);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full transition-all cursor-pointer"
          >
            Review
          </button>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-gray-400 hover:text-white text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Left side actions */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="hidden lg:block p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
          title={isSidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
          title="Refresh Data"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Breadcrumb or Title */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-medium ml-2">
          <span>Home</span>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Console</span>
        </div>

        {/* Demo Mode Badge */}
        {isMockMode && (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 ml-4 animate-pulse">
            DEMO DATA
          </span>
        )}
      </div>

      {/* Center/Right Topbar Live Withdrawal Notification 📢 */}
      {(() => {
        const latestPending = notifications.find(
          (n) => n.type === 'withdrawal' && (!n.status || n.status === 'Pending Review' || n.status === 'pending')
        ) || (activeAlert ? { id: activeAlert.id, message: activeAlert.message, link: activeAlert.link } : null);

        if (!latestPending) return null;

        return (
          <div className="flex-1 flex items-center justify-center sm:justify-end px-3 min-w-0 max-w-2xl">
            <button
              onClick={() => router.push(latestPending.link || '/admin/withdrawals')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border border-amber-400 text-amber-950 px-3.5 py-1 rounded-full cursor-pointer hover:shadow-md hover:border-amber-500 hover:from-amber-100 hover:to-amber-200 transition-all group shadow-sm text-left truncate"
              title="Click to review withdrawal request"
            >
              <span className="text-sm shrink-0 animate-bounce">📢</span>
              <span className="text-xs font-bold text-amber-900 truncate">
                {latestPending.message}
              </span>
              <span className="bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 shadow-sm transition-all ml-1 flex items-center gap-1">
                Review <span className="text-[9px]">→</span>
              </span>
            </button>
          </div>
        );
      })()}

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Real-Time Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-45" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-xs">Live System Notifications</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notifications.length} Events
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-xs">No recent notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          router.push(n.link);
                        }}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors space-y-1 ${
                          n.type === 'withdrawal' ? 'bg-amber-50/50 border-l-4 border-amber-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${n.type === 'withdrawal' ? 'text-amber-900' : 'text-gray-800'} truncate max-w-[230px]`}>
                            {n.message}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">{n.time}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={n.type === 'withdrawal' ? 'font-extrabold text-amber-600' : 'font-bold text-emerald-600'}>
                            {n.type === 'withdrawal' ? `Amount: ${n.amount}` : n.balance}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            n.type === 'withdrawal'
                              ? (n.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse')
                              : (n.authStatus === 'authorized' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')
                          }`}>
                            {n.status || (n.authStatus === 'authorized' ? '✓ Authorized' : 'Pending Review')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 flex justify-between items-center px-4">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      router.push('/admin/withdrawals');
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                  >
                    Withdrawals →
                  </button>
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      router.push('/admin/users');
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Users →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-gray-200 mx-1" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-gray-100 rounded transition-colors text-xs font-semibold text-gray-700"
          >
            <div className="w-7 h-7 bg-teal-primary rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
              {userEmail ? userEmail[0].toUpperCase() : 'A'}
            </div>
            <span className="hidden md:inline">{userEmail || 'admin_bspc'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {isUserDropdownOpen && (
            <>
              {/* Overlay to close */}
              <div
                className="fixed inset-0 z-45"
                onClick={() => setIsUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 text-xs text-gray-700">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-semibold text-gray-900 text-xs">{userEmail || 'Administrator'}</div>
                  <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wide mt-0.5">{userRole || 'super_admin'}</div>
                </div>
                <button
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-left transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" /> My Profile
                </button>
                <button
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-left transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" /> Settings
                </button>
                <button
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-left transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" /> Help Center
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-left text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
