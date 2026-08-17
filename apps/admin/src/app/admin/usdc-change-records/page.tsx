'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, WalletAddressCell, TransactionHashCell } from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { ledgerRepository } from '../../../repositories';
import { MockUSDCLedgerRecord } from '../../../mocks/db';
import { Plus } from 'lucide-react';

export default function USDCChangeRecordsPage() {
  const [ledgerData, setLedgerData] = useState<MockUSDCLedgerRecord[]>([]);
  const [reasonFilter, setReasonFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  useEffect(() => {
    ledgerRepository.listEntries().then((entries) => {
      setLedgerData(
        entries.map((e) => ({
          id: e.entryId,
          userId: e.userUid,
          userAddress: e.walletAddress,
          previousAmount: e.previousBaseUnits,
          changeAmount: e.changeBaseUnits,
          newAmount: e.resultingBaseUnits,
          changeReason: e.reasonCode,
          relatedEntity: e.relatedEntityId,
          txHash: e.transactionHash || '',
          actor: e.actorUid,
          source: e.source,
          createdAt: e.createdAt,
        }))
      );
    }).catch(console.error);
  }, []);


  const [sortKey, setSortKey] = useState<keyof MockUSDCLedgerRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // New adjustment states
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newReason, setNewReason] = useState('');

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'userAddress', label: 'Wallet Address' },
    { key: 'previousAmount', label: 'Previous Amount' },
    { key: 'changeAmount', label: 'Change Amount' },
    { key: 'newAmount', label: 'New Amount' },
    { key: 'changeReason', label: 'Change Reason' },
    { key: 'relatedEntity', label: 'Related Entity' },
    { key: 'txHash', label: 'Transaction Hash' },
    { key: 'actor', label: 'Actor' },
    { key: 'source', label: 'Source' },
    { key: 'createdAt', label: 'Created Time' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSort = (key: string) => {
    const k = key as keyof MockUSDCLedgerRecord;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserId && newAmount && newReason) {
      const adjustment: MockUSDCLedgerRecord = {
        id: `led-adj-${ledgerData.length + 1}`,
        userId: newUserId,
        userAddress: '0x0000000000000000000000000000000000000000',
        previousAmount: 'N/A',
        changeAmount: `${newAmount} USDC`,
        newAmount: 'Calculated On-chain',
        changeReason: `Manual Balance Correction: ${newReason}`,
        relatedEntity: 'System Correction',
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        actor: 'admin_bspc',
        source: 'manual admin correction',
        createdAt: new Date().toISOString(),
      };
      setLedgerData([adjustment, ...ledgerData]);
      setIsAdjustOpen(false);
      setNewUserId('');
      setNewAmount('');
      setNewReason('');
      setCurrentPage(1);
    }
  };

  const filtered = ledgerData
    .filter((r) => reasonFilter === 'all' || r.changeReason.toLowerCase().includes(reasonFilter.toLowerCase()))
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
        title="USDC Change Records"
        subtitle="Financial ledger tracking balance alterations and transactions."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdjustOpen(true)}
              className="inline-flex items-center gap-1.5 bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-3 py-1.5 rounded transition-all shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Adjustment
            </button>
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="usdc_change_records"
            />
          </div>
        }
      />

      <FilterBar>
        <FilterField label="Filter by Reason">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-855 focus:outline-none"
          >
            <option value="all">All Reasons</option>
            <option value="deposit">Deposit Swept</option>
            <option value="win">Win Order</option>
            <option value="distribution">Yield Distribution</option>
            <option value="correction">Corrections</option>
          </select>
        </FilterField>
      </FilterBar>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                {visibleColumns.includes('id') && <th><SortHeader label="ID" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /></th>}
                {visibleColumns.includes('userId') && <th>User ID</th>}
                {visibleColumns.includes('userAddress') && <th>Wallet Address</th>}
                {visibleColumns.includes('previousAmount') && <th>Previous Amount</th>}
                {visibleColumns.includes('changeAmount') && <th>Change Amount</th>}
                {visibleColumns.includes('newAmount') && <th>New Amount</th>}
                {visibleColumns.includes('changeReason') && <th>Change Reason</th>}
                {visibleColumns.includes('relatedEntity') && <th>Related Entity</th>}
                {visibleColumns.includes('txHash') && <th>Transaction Hash</th>}
                {visibleColumns.includes('actor') && <th>Actor</th>}
                {visibleColumns.includes('source') && <th>Source</th>}
                {visibleColumns.includes('createdAt') && <th>Created Time</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{l.id}</td>}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{l.userId}</td>}
                  {visibleColumns.includes('userAddress') && (
                    <td>
                      <WalletAddressCell address={l.userAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('previousAmount') && <td>{l.previousAmount}</td>}
                  {visibleColumns.includes('changeAmount') && <td className="text-gray-800 font-bold">{l.changeAmount}</td>}
                  {visibleColumns.includes('newAmount') && <td className="text-gray-700 font-semibold">{l.newAmount}</td>}
                  {visibleColumns.includes('changeReason') && <td className="text-gray-600 max-w-[200px] truncate" title={l.changeReason}>{l.changeReason}</td>}
                  {visibleColumns.includes('relatedEntity') && <td>{l.relatedEntity}</td>}
                  {visibleColumns.includes('txHash') && (
                    <td>
                      <TransactionHashCell txHash={l.txHash} />
                    </td>
                  )}
                  {visibleColumns.includes('actor') && <td className="font-semibold text-gray-500">{l.actor}</td>}
                  {visibleColumns.includes('source') && <td className="text-xs text-gray-500">{l.source}</td>}
                  {visibleColumns.includes('createdAt') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
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

      {/* Manual Balance Correction Dialog */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <form onSubmit={handleAddAdjustment} className="bg-white rounded border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden select-none">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Authorize USDC Balance Adjustment</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">User ID</label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="u-1"
                  className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Adjustment Amount (USDC)</label>
                <input
                  type="text"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="+100 or -50"
                  className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Correction Reason</label>
                <textarea
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Reason for balance correction audit..."
                  className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-3 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold rounded transition-all"
              >
                Submit Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
