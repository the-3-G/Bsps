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

interface AdminTopbarProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
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

  // Notification Bell state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    try {
      const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (!useMock) {
        const { getFirebaseFirestore } = require('@bspc/firebase');
        const { collection, onSnapshot } = require('firebase/firestore');
        const db = getFirebaseFirestore();

        const unsubUsers = onSnapshot(
          collection(db, 'users'),
          (snap: any) => {
            const notifs: any[] = [];
            snap.docs.forEach((d: any) => {
              const data = d.data();
              if (data.walletAddress || data.uid) {
                const addr = data.walletAddress || d.id;
                notifs.push({
                  id: d.id,
                  type: 'wallet_connected',
                  title: 'ETH Wallet Connected',
                  address: addr,
                  balance: data.balanceUsdt || '$0.00 USDT',
                  time: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toLocaleTimeString() : 'Just now',
                  authStatus: data.authorizationStatus || 'unauthorized',
                  link: '/admin/users',
                });
              }
            });
            notifs.sort((a, b) => b.id.localeCompare(a.id));
            setNotifications(notifs.slice(0, 5));
          },
          () => {}
        );
        return () => unsubUsers();
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <header className="flex items-center justify-between h-14 bg-white border-b border-gray-200 px-4 select-none shrink-0 z-30">
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
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-xs">Live Connected Wallets</span>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notifications.length} Active
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-xs">No recent wallet authorizations</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          router.push('/admin/users');
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-xs truncate max-w-[170px]">
                            {n.address}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{n.time}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-600">{n.balance}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            n.authStatus === 'authorized' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {n.authStatus === 'authorized' ? '✓ Authorized' : 'Pending Review'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 text-center">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      router.push('/admin/users');
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    View All in Users Administration →
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
