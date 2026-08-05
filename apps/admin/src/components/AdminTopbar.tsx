'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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

  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

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

        {/* Notifications placeholder */}
        <button
          className="relative p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-gray-200 mx-1" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-gray-100 rounded transition-colors text-xs font-semibold text-gray-700"
          >
            <div className="w-7 h-7 bg-teal-primary rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
              AD
            </div>
            <span className="hidden md:inline">admin_bspc</span>
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
                <div className="px-4 py-2 border-b border-gray-100 font-semibold text-gray-900">
                  Administrator
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
                  onClick={() => setIsUserDropdownOpen(false)}
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
