'use client';

import React, { useState } from 'react';
import { TabProvider } from '../context/TabContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { WorkspaceTabs } from './WorkspaceTabs';

import { usePathname } from 'next/navigation';

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <TabProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Left Sidebar */}
        <AdminSidebar
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Right Content Area */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          {/* Top Bar */}
          <AdminTopbar
            isSidebarExpanded={isSidebarExpanded}
            setIsSidebarExpanded={setIsSidebarExpanded}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
          />

          {/* Persistent Closable Page Tabs */}
          <WorkspaceTabs />

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto p-4 select-text">
            <div className="max-w-[1600px] mx-auto space-y-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TabProvider>
  );
};
export default AdminShell;
