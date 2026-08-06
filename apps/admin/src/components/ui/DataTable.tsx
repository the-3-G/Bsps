'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, EyeOff, ArrowUpDown, ChevronDown } from 'lucide-react';

// FilterBar and FilterField components for white filter panel layout
export const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded border border-gray-200 shadow-sm mb-4">
    {children}
  </div>
);

export const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-1 min-w-[140px]">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

// TablePagination component with Page-size selector
interface TablePaginationProps {
  currentPage: number;
  totalPageCount: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange?: (size: number) => void;
  totalRowCount: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPageCount,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  totalRowCount,
}) => {
  const startRow = totalRowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalRowCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 border-t border-gray-200 bg-white text-xs select-none">
      <div className="flex items-center gap-4 text-gray-500 font-medium">
        <div>
          Showing <span className="font-semibold text-gray-800">{startRow}</span> to{' '}
          <span className="font-semibold text-gray-800">{endRow}</span> of{' '}
          <span className="font-semibold text-gray-800">{totalRowCount}</span> entries
        </div>
        {onRowsPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="border border-gray-350 rounded px-1 py-0.5 bg-white text-gray-700 focus:outline-none"
            >
              {[5, 8, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 hover:bg-gray-100 disabled:opacity-40 rounded transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-gray-700 font-medium px-2">
          Page <span className="font-semibold">{currentPage}</span> of{' '}
          <span className="font-semibold">{totalPageCount}</span>
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPageCount || totalPageCount === 0}
          className="p-1 hover:bg-gray-100 disabled:opacity-40 rounded transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// CSV Export Helper
export function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const valStr = val === null || val === undefined ? '' : String(val);
          return `"${valStr.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Reusable Export Menu Component
export const ExportButton: React.FC<{ data: Record<string, unknown>[]; filename: string }> = ({
  data,
  filename,
}) => (
  <button
    onClick={() => exportCSV(data, filename)}
    className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded transition-all shadow-sm shrink-0"
    title="Export to CSV"
  >
    <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
  </button>
);

// Reusable ColumnVisibilityMenu Component
interface ColumnVisibilityMenuProps {
  columns: { key: string; label: string }[];
  visibleColumns: string[];
  onChange: (visibleKeys: string[]) => void;
}

export const ColumnVisibilityMenu: React.FC<ColumnVisibilityMenuProps> = ({
  columns,
  visibleColumns,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (key: string) => {
    if (visibleColumns.includes(key)) {
      // Don't allow hiding the last remaining column
      if (visibleColumns.length > 1) {
        onChange(visibleColumns.filter((c) => c !== key));
      }
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  return (
    <div className="relative inline-block text-left select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-750 text-xs font-semibold px-3 py-1.5 rounded transition-all shadow-sm shrink-0"
      >
        <EyeOff className="w-3.5 h-3.5 text-gray-500" /> Columns <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-45" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-48 bg-white rounded border border-gray-200 shadow-lg py-1 z-50 text-xs text-gray-700 max-h-60 overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-gray-100 font-bold text-[10px] text-gray-400 uppercase tracking-wider">
              Toggle Columns
            </div>
            {columns.map((col) => {
              const isChecked = visibleColumns.includes(col.key);
              return (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-gray-300 text-teal-primary focus:ring-teal-primary w-3.5 h-3.5"
                  />
                  <span>{col.label}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ConfirmationDialog for confirming actions
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden select-none">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
        <div className="p-4 text-xs text-gray-650 leading-relaxed">
          {message}
        </div>
        <div className="flex items-center justify-end gap-2 p-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-705 text-xs font-semibold rounded transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-white text-xs font-semibold rounded transition-all ${
              isDestructive ? 'bg-red-650 hover:bg-red-700' : 'bg-teal-primary hover:bg-teal-hover'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// DetailDrawer for side previewing of records
interface DetailDrawerProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  title,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35" onClick={onClose} />
      <div className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-550 transition-colors"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-gray-700">
          {children}
        </div>
      </div>
    </>
  );
};

// Simple Sortable Header Helper Component
interface SortHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  direction: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort,
}) => {
  const isSorted = currentSortKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 hover:text-teal-primary font-semibold uppercase tracking-wider text-left"
    >
      <span>{label}</span>
      <ArrowUpDown className={`w-3 h-3 transition-transform ${isSorted ? (direction === 'desc' ? 'rotate-180 text-teal-primary' : 'text-teal-primary') : 'opacity-35'}`} />
    </button>
  );
};
