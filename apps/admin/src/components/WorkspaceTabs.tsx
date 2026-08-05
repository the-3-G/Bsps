'use client';

import React from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTabs } from '../context/TabContext';

export const WorkspaceTabs: React.FC = () => {
  const { tabs, activeTabPath, closeTab } = useTabs();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 h-9 select-none shrink-0 px-2">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="p-1 hover:bg-gray-200 text-gray-500 rounded shrink-0 transition-colors"
        title="Scroll Left"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Tabs Container */}
      <div
        ref={containerRef}
        className="flex items-center flex-1 overflow-x-auto scrollbar-none h-full gap-[2px] mx-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTabPath === tab.path;
          return (
            <div
              key={tab.path}
              className={`group flex items-center h-full px-3 text-[11px] font-medium border-r border-gray-200/80 transition-all ${
                isActive
                  ? 'bg-white text-teal-primary border-b-2 border-b-teal-primary font-semibold'
                  : 'text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              <Link href={tab.path} className="flex items-center gap-1.5 h-full">
                <span>{tab.label}</span>
              </Link>

              {tab.closable && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    closeTab(tab.path);
                  }}
                  className="ml-1.5 p-0.5 hover:bg-gray-200 text-gray-400 group-hover:text-gray-600 rounded transition-colors"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="p-1 hover:bg-gray-200 text-gray-500 rounded shrink-0 transition-colors"
        title="Scroll Right"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
