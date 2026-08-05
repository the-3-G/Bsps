'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { truncateAddress, getExplorerTxLink, getExplorerAddressLink } from '@bspc/web3';

// PageHeader Component
export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-200">
    <div>
      <h1 className="text-lg font-bold text-gray-900 leading-6">{title}</h1>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

// CopyButton Component
export const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded transition-colors"
      title="Copy to Clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// WalletAddressCell Component
export const WalletAddressCell: React.FC<{ address: string; chainId?: number }> = ({
  address,
  chainId = 1,
}) => (
  <div className="flex items-center gap-1.5 font-mono text-xs">
    <a
      href={getExplorerAddressLink(chainId, address)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
      title={address}
    >
      {truncateAddress(address)}
    </a>
    <CopyButton text={address} />
  </div>
);

// TransactionHashCell Component
export const TransactionHashCell: React.FC<{ txHash: string; chainId?: number }> = ({
  txHash,
  chainId = 1,
}) => (
  <div className="flex items-center gap-1.5 font-mono text-xs">
    <a
      href={getExplorerTxLink(chainId, txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
      title={txHash}
    >
      {txHash.slice(0, 8)}...{txHash.slice(-6)}
    </a>
    <CopyButton text={txHash} />
  </div>
);

// ExplorerLink Component
export const ExplorerLink: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
  >
    <span>{label}</span>
    <ExternalLink className="w-3 h-3" />
  </a>
);

// StatusBadge Component
export const StatusBadge: React.FC<{
  status: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}> = ({ status, type }) => {
  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getColors()} uppercase`}
    >
      {status}
    </span>
  );
};

// TableEmptyState Component
export const TableEmptyState: React.FC<{ message?: string }> = ({ message = 'No data found' }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <p className="text-sm font-medium text-gray-500">{message}</p>
  </div>
);

// TableLoadingSkeleton Component
export const TableLoadingSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 p-3 border-b border-gray-100">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Search and Reset buttons using specified color rules
export const SearchButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors shrink-0"
  >
    Search
  </button>
);

export const ResetFiltersButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-1.5 rounded transition-colors shrink-0"
  >
    Reset
  </button>
);
