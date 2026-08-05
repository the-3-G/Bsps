'use client';

import React, { useState } from 'react';
import {
  PageHeader,
  StatusBadge,
  WalletAddressCell,
  TransactionHashCell,
  SearchButton,
  ResetFiltersButton,
} from '../../../components/ui/Reusables';
import {
  FilterBar,
  FilterField,
  TablePagination,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { mockPledges, MockPledgeRecord } from '../../../mocks/db';

export default function PledgesPage() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    wallet: '',
    state: 'all',
    tier: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockPledgeRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'userAddress', label: 'Wallet Address' },
    { key: 'tier', label: 'Tier' },
    { key: 'amountThreshold', label: 'Amount Threshold' },
    { key: 'miningRatio', label: 'Mining Ratio' },
    { key: 'miningReward', label: 'Mining Reward' },
    { key: 'collectionAmount', label: 'Collection Amount' },
    { key: 'topUpAmount', label: 'Top-up Amount' },
    { key: 'ethReward', label: 'ETH Reward' },
    { key: 'participationTime', label: 'Participation Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'status', label: 'State' },
    { key: 'txHash', label: 'Tx Hash' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      wallet: walletFilter,
      state: stateFilter,
      tier: tierFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setWalletFilter('');
    setStateFilter('all');
    setTierFilter('all');
    setAppliedFilters({
      userId: '',
      wallet: '',
      state: 'all',
      tier: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockPledgeRecord;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filteredPledges = mockPledges
    .filter((p) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? p.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesWallet = f.wallet ? p.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesState = f.state === 'all' || p.status === f.state;
      const matchesTier = f.tier === 'all' || p.tier === f.tier;
      return matchesUserId && matchesWallet && matchesState && matchesTier;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalRowCount = filteredPledges.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginated = filteredPledges.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pledge List"
        subtitle="Manage and audit users lease allocations on blockchain validation pools."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filteredPledges as unknown as Record<string, unknown>[]}
              filename="pledges_report"
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
        <FilterField label="State">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="mining">Mining</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </FilterField>
        <FilterField label="Pledge Tier">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="Tier A">Tier A</option>
            <option value="Tier B">Tier B</option>
            <option value="Tier C">Tier C</option>
            <option value="Tier D">Tier D</option>
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
                {visibleColumns.includes('tier') && <th>Tier</th>}
                {visibleColumns.includes('amountThreshold') && <th>Amount Threshold</th>}
                {visibleColumns.includes('miningRatio') && <th>Mining Ratio</th>}
                {visibleColumns.includes('miningReward') && <th>Mining Reward</th>}
                {visibleColumns.includes('collectionAmount') && <th>Collection Amount</th>}
                {visibleColumns.includes('topUpAmount') && <th>Top-up Amount</th>}
                {visibleColumns.includes('ethReward') && <th>ETH Reward</th>}
                {visibleColumns.includes('participationTime') && <th>Participation Time</th>}
                {visibleColumns.includes('endTime') && <th>End Time</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('txHash') && <th>Tx Hash</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono font-bold text-gray-700">{p.id}</td>}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{p.userId}</td>}
                  {visibleColumns.includes('userAddress') && (
                    <td>
                      <WalletAddressCell address={p.userAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('tier') && <td className="text-gray-800 font-semibold">{p.tier}</td>}
                  {visibleColumns.includes('amountThreshold') && <td className="font-bold text-gray-800">{p.amountThreshold} USDC</td>}
                  {visibleColumns.includes('miningRatio') && <td className="text-teal-primary font-bold">{p.miningRatio}</td>}
                  {visibleColumns.includes('miningReward') && <td className="text-green-600 font-semibold">+{p.miningReward} USDC</td>}
                  {visibleColumns.includes('collectionAmount') && <td className="text-gray-800">{p.collectionAmount} USDC</td>}
                  {visibleColumns.includes('topUpAmount') && <td className="text-blue-600">+{p.topUpAmount} USDC</td>}
                  {visibleColumns.includes('ethReward') && <td className="font-mono text-gray-700">{p.ethReward} ETH</td>}
                  {visibleColumns.includes('participationTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(p.participationTime).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('endTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(p.endTime).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={p.status}
                        type={p.status === 'mining' ? 'info' : 'success'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('txHash') && (
                    <td>
                      <TransactionHashCell txHash={p.txHash} />
                    </td>
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
