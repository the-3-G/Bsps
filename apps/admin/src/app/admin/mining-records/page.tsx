'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, WalletAddressCell, TransactionHashCell, StatusBadge, SearchButton, ResetFiltersButton } from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { miningRecordRepository } from '../../../repositories';
import { MockMiningRecord } from '../../../mocks/db';

export default function MiningRecordsPage() {
  const [records, setRecords] = useState<MockMiningRecord[]>([]);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    miningRecordRepository.listRecords().then((recs) => {
      setRecords(
        recs.map((m) => ({
          id: m.recordId,
          userId: m.userUid,
          username: m.walletAddress ? `${m.walletAddress.slice(0, 6)}...${m.walletAddress.slice(-4)}` : m.userUid,
          userAddress: m.walletAddress,
          rewardAmount: m.amountBaseUnits,
          ethAmount: '0.05 ETH',
          recordType: m.recordType,
          source: 'Staking Contract',
          txHash: m.transactionHash,
          createdAt: m.createdAt,
          verificationState: m.verificationStatus === 'verified' ? 'on-chain verified' : 'pending',
        }))
      );
    }).catch(console.error);
  }, []);


  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    username: '',
    wallet: '',
    type: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockMiningRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'username', label: 'Username' },
    { key: 'userAddress', label: 'Wallet Address' },
    { key: 'rewardAmount', label: 'Reward Amount' },
    { key: 'ethAmount', label: 'ETH Amount' },
    { key: 'recordType', label: 'Record Type' },
    { key: 'source', label: 'Source' },
    { key: 'txHash', label: 'Tx Hash' },
    { key: 'createdAt', label: 'Creation Time' },
    { key: 'verificationState', label: 'Verification State' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      username: usernameFilter,
      wallet: walletFilter,
      type: typeFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setUsernameFilter('');
    setWalletFilter('');
    setTypeFilter('all');
    setAppliedFilters({
      userId: '',
      username: '',
      wallet: '',
      type: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockMiningRecord;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filtered = records
    .filter((r) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? r.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesUsername = f.username ? r.username.toLowerCase().includes(f.username.toLowerCase()) : true;
      const matchesWallet = f.wallet ? r.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesType = f.type === 'all' || r.recordType === f.type;
      return matchesUserId && matchesUsername && matchesWallet && matchesType;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalRowCount = filtered.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mining Records"
        subtitle="Staking pool nodes lease earnings and distributions."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="mining_records"
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
        <FilterField label="Username">
          <input
            type="text"
            placeholder="Username"
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
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
        <FilterField label="Record Type">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="Pledge Yield">Pledge Yield</option>
            <option value="Pool Distribution">Pool Distribution</option>
            <option value="Node Referral">Node Referral</option>
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
                {visibleColumns.includes('username') && <th>User</th>}
                {visibleColumns.includes('userAddress') && <th>Wallet Address</th>}
                {visibleColumns.includes('rewardAmount') && <th>Reward Amount</th>}
                {visibleColumns.includes('ethAmount') && <th>ETH Amount</th>}
                {visibleColumns.includes('recordType') && <th>Record Type</th>}
                {visibleColumns.includes('source') && <th>Source</th>}
                {visibleColumns.includes('txHash') && <th>Transaction Hash</th>}
                {visibleColumns.includes('createdAt') && <th>Creation Time</th>}
                {visibleColumns.includes('verificationState') && <th>Verification State</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{r.id}</td>}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{r.userId}</td>}
                  {visibleColumns.includes('username') && <td className="text-gray-800 font-semibold">{r.username}</td>}
                  {visibleColumns.includes('userAddress') && (
                    <td>
                      <WalletAddressCell address={r.userAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('rewardAmount') && <td className="text-teal-primary font-bold">{r.rewardAmount}</td>}
                  {visibleColumns.includes('ethAmount') && <td className="text-gray-700 font-semibold">{r.ethAmount}</td>}
                  {visibleColumns.includes('recordType') && <td>{r.recordType}</td>}
                  {visibleColumns.includes('source') && <td className="text-gray-650 font-medium">{r.source}</td>}
                  {visibleColumns.includes('txHash') && (
                    <td>
                      <TransactionHashCell txHash={r.txHash} />
                    </td>
                  )}
                  {visibleColumns.includes('createdAt') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('verificationState') && (
                    <td>
                      <StatusBadge
                        status={r.verificationState}
                        type={r.verificationState === 'on-chain verified' ? 'success' : r.verificationState === 'pending validation' ? 'warning' : 'info'}
                      />
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
