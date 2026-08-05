'use client';

import React, { useState } from 'react';
import { PageHeader, WalletAddressCell, StatusBadge, SearchButton, ResetFiltersButton } from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';

interface MockTaxRecord {
  id: string;
  userId: string;
  userAddress: string;
  eventName: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
  createdAt: string;
  referenceProof: string;
}

const mockTaxes: MockTaxRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: `chg-${i + 1}`,
  userId: `u-${(i % 5) + 1}`,
  userAddress: `0x${(100 + (i % 25)).toString(16).padStart(40, '0')}`,
  eventName: i % 2 === 0 ? 'Pledge Staking Charge' : 'Options Processing Charge',
  amount: (150 * (i + 1)).toString(),
  status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'pending' : 'overdue',
  createdAt: new Date(2026, 7, 20 + i).toISOString(),
  referenceProof: `REF-PROOF-${5000 + i}`,
}));

export default function TaxCollectionPage() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    wallet: '',
    event: 'all',
    status: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockTaxRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'userAddress', label: 'Wallet Address' },
    { key: 'eventName', label: 'Event Name' },
    { key: 'amount', label: 'Charge Amount' },
    { key: 'status', label: 'State' },
    { key: 'createdAt', label: 'Creation Time' },
    { key: 'referenceProof', label: 'Reference' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      wallet: walletFilter,
      event: eventFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setWalletFilter('');
    setEventFilter('all');
    setStatusFilter('all');
    setAppliedFilters({
      userId: '',
      wallet: '',
      event: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockTaxRecord;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filteredTaxes = mockTaxes
    .filter((t) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? t.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesWallet = f.wallet ? t.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesEvent = f.event === 'all' || t.eventName.toLowerCase().includes(f.event.toLowerCase());
      const matchesStatus = f.status === 'all' || t.status === f.status;
      return matchesUserId && matchesWallet && matchesEvent && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalRowCount = filteredTaxes.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginated = filteredTaxes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform Charges Collection"
        subtitle="Staking and options network charge assessments."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filteredTaxes as unknown as Record<string, unknown>[]}
              filename="platform_charges"
            />
          </div>
        }
      />

      <FilterBar>
        <FilterField label="User ID">
          <input
            type="text"
            placeholder="u-..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Wallet Address">
          <input
            type="text"
            placeholder="0x..."
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Event Type">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="pledge">Pledge Staking Charge</option>
            <option value="options">Options Processing Charge</option>
          </select>
        </FilterField>
        <FilterField label="State">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-855 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </FilterField>

        <div className="flex items-center gap-2">
          <SearchButton onClick={handleSearch} />
          <ResetFiltersButton onClick={handleReset} />
        </div>
      </FilterBar>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                {visibleColumns.includes('id') && <th><SortHeader label="ID" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /></th>}
                {visibleColumns.includes('userId') && <th>User ID</th>}
                {visibleColumns.includes('userAddress') && <th>Wallet Address</th>}
                {visibleColumns.includes('eventName') && <th>Event Name</th>}
                {visibleColumns.includes('amount') && <th>Charge Amount</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('createdAt') && <th>Creation Time</th>}
                {visibleColumns.includes('referenceProof') && <th>Evidence or Reference</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{t.id}</td>}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{t.userId}</td>}
                  {visibleColumns.includes('userAddress') && (
                    <td>
                      <WalletAddressCell address={t.userAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('eventName') && <td className="text-gray-800 font-medium">{t.eventName}</td>}
                  {visibleColumns.includes('amount') && <td className="text-gray-900 font-bold">{t.amount} USDC</td>}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={t.status}
                        type={t.status === 'paid' ? 'success' : t.status === 'pending' ? 'warning' : 'error'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('createdAt') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('referenceProof') && (
                    <td className="font-mono text-[11px] text-gray-600">{t.referenceProof}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPageCount={totalPageCount}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
          totalRowCount={totalRowCount}
        />
      </div>
    </div>
  );
}
