'use client';

import React, { useState } from 'react';
import {
  PageHeader,
  StatusBadge,
  TransactionHashCell,
  SearchButton,
  ResetFiltersButton,
} from '../../../components/ui/Reusables';
import {
  FilterBar,
  FilterField,
  TablePagination,
  ConfirmationDialog,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { mockWithdrawals, MockWithdrawalRequest } from '../../../mocks/db';
import { ShieldAlert } from 'lucide-react';

export default function WithdrawalsPage() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    username: '',
    wallet: '',
    status: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockWithdrawalRequest>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Review states
  const [reviewReq, setReviewReq] = useState<MockWithdrawalRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'clarification' | 'submit' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'submissionTime', label: 'Submission Time' },
    { key: 'username', label: 'User' },
    { key: 'group', label: 'Group' },
    { key: 'handler', label: 'Handler' },
    { key: 'amount', label: 'Amount' },
    { key: 'handlingFee', label: 'Handling Fee' },
    { key: 'status', label: 'State' },
    { key: 'reviewReason', label: 'Review Reason' },
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'reviewTime', label: 'Review Time' },
    { key: 'txHash', label: 'Transaction Hash' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      username: usernameFilter,
      wallet: walletFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setUsernameFilter('');
    setWalletFilter('');
    setStatusFilter('all');
    setAppliedFilters({
      userId: '',
      username: '',
      wallet: '',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockWithdrawalRequest;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const handleActionConfirm = () => {
    if (reviewReq && reviewAction) {
      const idx = mockWithdrawals.findIndex((w) => w.id === reviewReq.id);
      if (idx !== -1) {
        let nextStatus: MockWithdrawalRequest['status'] = reviewReq.status;
        let hash = reviewReq.txHash;

        if (reviewAction === 'approve') {
          nextStatus = 'approved';
          hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        } else if (reviewAction === 'reject') {
          nextStatus = 'rejected';
        } else if (reviewAction === 'clarification') {
          nextStatus = 'clarification';
        } else if (reviewAction === 'submit') {
          nextStatus = 'submitted';
        }

        mockWithdrawals[idx] = {
          ...mockWithdrawals[idx],
          status: nextStatus,
          reviewReason: reviewAction === 'reject' ? rejectionReason : undefined,
          reviewer: 'admin_bspc',
          reviewTime: new Date().toISOString(),
          txHash: hash,
        };
      }
      setIsConfirmOpen(false);
      setReviewReq(null);
      setReviewAction(null);
      setRejectionReason('');
    }
  };

  const filtered = mockWithdrawals
    .filter((w) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? w.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesUsername = f.username ? w.username.toLowerCase().includes(f.username.toLowerCase()) : true;
      const matchesWallet = f.wallet ? w.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesStatus = f.status === 'all' || w.status === f.status;
      return matchesUserId && matchesUsername && matchesWallet && matchesStatus;
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
        title="Withdrawals Ledger"
        subtitle="Staking yields and deposits sweeps payout authorizations."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="withdrawals_ledgers"
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
        <FilterField label="State">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-855 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="clarification">Clarification</option>
            <option value="submitted">Submitted</option>
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
                {visibleColumns.includes('submissionTime') && <th>Submission Time</th>}
                {visibleColumns.includes('username') && <th>User</th>}
                {visibleColumns.includes('group') && <th>Group</th>}
                {visibleColumns.includes('handler') && <th>Handler</th>}
                {visibleColumns.includes('amount') && <th>Amount</th>}
                {visibleColumns.includes('handlingFee') && <th>Handling Fee</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('reviewReason') && <th>Review Reason</th>}
                {visibleColumns.includes('reviewer') && <th>Reviewer</th>}
                {visibleColumns.includes('reviewTime') && <th>Review Time</th>}
                {visibleColumns.includes('txHash') && <th>Transaction Hash</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{w.id}</td>}
                  {visibleColumns.includes('submissionTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(w.submissionTime).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('username') && <td className="text-gray-800 font-semibold">{w.username}</td>}
                  {visibleColumns.includes('group') && <td>{w.group}</td>}
                  {visibleColumns.includes('handler') && <td>{w.handler}</td>}
                  {visibleColumns.includes('amount') && <td className="font-bold text-gray-850">{w.amount}</td>}
                  {visibleColumns.includes('handlingFee') && <td className="text-gray-600">{w.handlingFee}</td>}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={w.status}
                        type={w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'error' : w.status === 'pending' ? 'warning' : 'info'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('reviewReason') && <td className="text-gray-600 max-w-[150px] truncate" title={w.reviewReason}>{w.reviewReason || '-'}</td>}
                  {visibleColumns.includes('reviewer') && <td>{w.reviewer || '-'}</td>}
                  {visibleColumns.includes('reviewTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {w.reviewTime ? new Date(w.reviewTime).toLocaleString() : '-'}
                    </td>
                  )}
                  {visibleColumns.includes('txHash') && (
                    <td>{w.txHash ? <TransactionHashCell txHash={w.txHash} /> : '-'}</td>
                  )}
                  <td className="text-right whitespace-nowrap space-x-1">
                    {w.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => {
                            setReviewReq(w);
                            setReviewAction('approve');
                            setIsConfirmOpen(true);
                          }}
                          className="bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setReviewReq(w);
                            setReviewAction('reject');
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setReviewReq(w);
                            setReviewAction('clarification');
                            setIsConfirmOpen(true);
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                        >
                          Clarify
                        </button>
                      </>
                    ) : w.status === 'approved' ? (
                      <button
                        onClick={() => {
                          setReviewReq(w);
                          setReviewAction('submit');
                          setIsConfirmOpen(true);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                      >
                        Submit Tx
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Closed</span>
                    )}
                  </td>
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

      {/* Review Dialog for Reject (requires input reason) */}
      {reviewReq && reviewAction === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden select-none">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-bold text-gray-900">Rejection Audit Reason</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Please describe the administrative reason for rejecting {reviewReq.username}&apos;s withdrawal.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Audit description..."
                className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-teal-primary text-gray-800"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-2 p-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setReviewReq(null);
                  setReviewAction(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={!rejectionReason.trim()}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold rounded transition-all"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Box */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title={reviewAction === 'submit' ? 'Submit to Blockchain Node' : reviewAction === 'approve' ? 'Approve Settlement Payout' : reviewAction === 'reject' ? 'Reject Staking Yield' : 'Request Signature Clarification'}
        message={`Are you sure you want to proceed with action ${reviewAction} on withdrawal ${reviewReq?.id}?`}
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setIsConfirmOpen(false);
          if (reviewAction !== 'reject') {
            setReviewReq(null);
            setReviewAction(null);
          }
        }}
        isDestructive={reviewAction === 'reject'}
      />
    </div>
  );
}
