'use client';

import React, { useState } from 'react';
import { PageHeader, WalletAddressCell, TransactionHashCell, StatusBadge, SearchButton, ResetFiltersButton } from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { mockCollections, MockCollectionRecord } from '../../../mocks/db';

export default function CollectionRecordsPage() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('');
  const [txHashFilter, setTxHashFilter] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    username: '',
    sender: '',
    recipient: '',
    txHash: '',
  });

  const [sortKey, setSortKey] = useState<keyof MockCollectionRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'User' },
    { key: 'status', label: 'State' },
    { key: 'sender', label: 'Sender' },
    { key: 'recipient', label: 'Recipient' },
    { key: 'txHash', label: 'Transaction Hash' },
    { key: 'token', label: 'Token' },
    { key: 'amount', label: 'Amount' },
    { key: 'chain', label: 'Chain' },
    { key: 'blockNumber', label: 'Block Number' },
    { key: 'confirmations', label: 'Confirmations' },
    { key: 'createdAt', label: 'Creation Time' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      username: usernameFilter,
      sender: senderFilter,
      recipient: recipientFilter,
      txHash: txHashFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setUsernameFilter('');
    setSenderFilter('');
    setRecipientFilter('');
    setTxHashFilter('');
    setAppliedFilters({
      userId: '',
      username: '',
      sender: '',
      recipient: '',
      txHash: '',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockCollectionRecord;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filtered = mockCollections
    .filter((c) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? c.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesUsername = f.username ? c.username.toLowerCase().includes(f.username.toLowerCase()) : true;
      const matchesSender = f.sender ? c.sender.toLowerCase().includes(f.sender.toLowerCase()) : true;
      const matchesRecipient = f.recipient ? c.recipient.toLowerCase().includes(f.recipient.toLowerCase()) : true;
      const matchesTxHash = f.txHash ? c.txHash.toLowerCase().includes(f.txHash.toLowerCase()) : true;
      return matchesUserId && matchesUsername && matchesSender && matchesRecipient && matchesTxHash;
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
        title="Collection Ledger"
        subtitle="Audited sweeps and automatically sweeping transactions records."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="collection_ledger"
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
        <FilterField label="Sender">
          <input
            type="text"
            placeholder="0x..."
            value={senderFilter}
            onChange={(e) => setSenderFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Recipient">
          <input
            type="text"
            placeholder="0x..."
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Tx Hash">
          <input
            type="text"
            placeholder="0x..."
            value={txHashFilter}
            onChange={(e) => setTxHashFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
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
                {visibleColumns.includes('username') && <th>User</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('sender') && <th>Sender</th>}
                {visibleColumns.includes('recipient') && <th>Recipient</th>}
                {visibleColumns.includes('txHash') && <th>Transaction Hash</th>}
                {visibleColumns.includes('token') && <th>Token</th>}
                {visibleColumns.includes('amount') && <th>Amount</th>}
                {visibleColumns.includes('chain') && <th>Chain</th>}
                {visibleColumns.includes('blockNumber') && <th>Block Number</th>}
                {visibleColumns.includes('confirmations') && <th>Confirmations</th>}
                {visibleColumns.includes('createdAt') && <th>Creation Time</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{c.id}</td>}
                  {visibleColumns.includes('username') && <td className="text-gray-800 font-semibold">{c.username}</td>}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={c.status}
                        type={c.status === 'confirmed' ? 'success' : c.status === 'pending' ? 'warning' : 'error'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('sender') && (
                    <td>
                      <WalletAddressCell address={c.sender} />
                    </td>
                  )}
                  {visibleColumns.includes('recipient') && (
                    <td>
                      <WalletAddressCell address={c.recipient} />
                    </td>
                  )}
                  {visibleColumns.includes('txHash') && (
                    <td>
                      <TransactionHashCell txHash={c.txHash} />
                    </td>
                  )}
                  {visibleColumns.includes('token') && <td className="text-gray-650 font-bold">{c.token}</td>}
                  {visibleColumns.includes('amount') && <td className="text-gray-900 font-bold">{c.amount}</td>}
                  {visibleColumns.includes('chain') && <td>{c.chain}</td>}
                  {visibleColumns.includes('blockNumber') && <td className="font-mono text-xs text-gray-600">{c.blockNumber}</td>}
                  {visibleColumns.includes('confirmations') && <td className="font-semibold text-gray-650">{c.confirmations} confs</td>}
                  {visibleColumns.includes('createdAt') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleString()}
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
