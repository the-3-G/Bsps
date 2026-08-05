'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface Tab {
  path: string;
  label: string;
  closable: boolean;
}

interface TabContextProps {
  tabs: Tab[];
  activeTabPath: string;
  openTab: (path: string, label: string, closable?: boolean) => void;
  closeTab: (path: string) => void;
}

const TabContext = createContext<TabContextProps | undefined>(undefined);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('admin_tabs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [
      { path: '/admin/console', label: 'Console', closable: false },
    ];
  });

  // Save to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('admin_tabs', JSON.stringify(tabs));
  }, [tabs]);

  const openTab = (path: string, label: string, closable = true) => {
    setTabs((prev) => {
      if (prev.some((t) => t.path === path)) {
        return prev;
      }
      return [...prev, { path, label, closable }];
    });
  };

  const closeTab = (path: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.path !== path);
      if (pathname === path) {
        const remaining =
          filtered.length > 0
            ? filtered[filtered.length - 1]
            : { path: '/admin/console', label: 'Console', closable: false };
        router.push(remaining.path);
      }
      return filtered;
    });
  };

  return (
    <TabContext.Provider value={{ tabs, activeTabPath: pathname, openTab, closeTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
};
