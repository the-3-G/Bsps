'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTabs } from '../context/TabContext';
import {
  Home,
  Users,
  Award,
  TrendingUp,
  Percent,
  Cpu,
  ArrowDownCircle,
  FileText,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronRight,
  Shield,
  Menu,
  Headset,
  Landmark,
} from 'lucide-react';


interface SidebarGroup {
  title: string;
  icon: React.ReactNode;
  items: {
    label: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

interface AdminSidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const pathname = usePathname();
  const { openTab } = useTabs();

  // Keep track of which groups are collapsed/expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Homepage: true,
    'User Management': true,
    'Funds Management': true,
    'NFT Management': true,
    'Report Management': true,
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const groups: SidebarGroup[] = [
    {
      title: 'Homepage',
      icon: <Home className="w-4 h-4" />,
      items: [{ label: 'Console', path: '/admin/console', icon: <Layers className="w-4 h-4" /> }],
    },
    {
      title: 'User Management',
      icon: <Users className="w-4 h-4" />,
      items: [
        { label: 'Users', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { label: 'Customer Service', path: '/admin/customer-service', icon: <Headset className="w-4 h-4" /> },
        { label: 'Pledge List', path: '/admin/pledges', icon: <Award className="w-4 h-4" /> },
        { label: 'Options Orders', path: '/admin/options-orders', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Tax Collection', path: '/admin/tax-collection', icon: <Percent className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Funds Management',
      icon: <DollarSign className="w-4 h-4" />,
      items: [
        { label: 'Mining Records', path: '/admin/mining-records', icon: <Cpu className="w-4 h-4" /> },
        { label: 'Withdrawal List', path: '/admin/withdrawals', icon: <ArrowDownCircle className="w-4 h-4" /> },
        { label: 'Loan Requests', path: '/admin/loans', icon: <Landmark className="w-4 h-4" /> },
        {
          label: 'Application Collection',
          path: '/admin/application-collection',
          icon: <DollarSign className="w-4 h-4" />,
        },
        {
          label: 'Collection Records',
          path: '/admin/collection-records',
          icon: <FileText className="w-4 h-4" />,
        },
      ],
    },

    {
      title: 'NFT Management',
      icon: <Award className="w-4 h-4" />,
      items: [{ label: 'NFT Orders', path: '/admin/nft-orders', icon: <Award className="w-4 h-4" /> }],
    },
    {
      title: 'Report Management',
      icon: <FileText className="w-4 h-4" />,
      items: [
        {
          label: 'USDC Change Records',
          path: '/admin/usdc-change-records',
          icon: <FileText className="w-4 h-4" />,
        },
        { label: 'Team Reports', path: '/admin/team-reports', icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
  ];

  const handleItemClick = (path: string, label: string) => {
    openTab(path, label);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-sidebar text-gray-300 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-primary shrink-0" />
          {isExpanded && <span className="font-bold text-white text-sm tracking-wider uppercase">BSPC ADMIN</span>}
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {groups.map((group) => {
          const isGroupExpanded = expandedGroups[group.title];
          return (
            <div key={group.title} className="space-y-1">
              {/* Group Title Toggle */}
              {isExpanded ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-white transition-colors"
                >
                  <span>{group.title}</span>
                  {isGroupExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              ) : (
                <div className="flex justify-center py-1 text-gray-600 border-t border-gray-800/40">
                  {group.icon}
                </div>
              )}

              {/* Group Items */}
              {(!isExpanded || isGroupExpanded) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => handleItemClick(item.path, item.label)}
                        className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-teal-primary text-white font-semibold'
                            : 'hover:bg-gray-800/60 hover:text-white'
                        } ${!isExpanded ? 'justify-center px-0' : ''}`}
                        title={item.label}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {isExpanded && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Toggle */}
      <div className="hidden lg:block border-t border-gray-800 p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center w-full py-2 hover:bg-gray-800/60 rounded text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen transition-all duration-200 border-r border-gray-800 ${
          isExpanded ? 'w-[220px]' : 'w-[88px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] transition-transform duration-200 lg:hidden transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
