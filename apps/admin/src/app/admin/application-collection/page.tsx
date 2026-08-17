'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Landmark, ArrowRight } from 'lucide-react';
import { PageHeader, StatusBadge, SearchButton, ResetFiltersButton } from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { applicationRepository } from '../../../repositories';


interface ApplicationRequest {
  id: string;
  submissionTime: string;
  userId: string;
  username: string;
  userAddress: string;
  group: string;
  handler: string;
  amount: string;
  status: 'approved' | 'rejected' | 'pending';
  reviewReason?: string;
  reviewer?: string;
  reviewTime?: string;
}

export default function ApplicationCollectionPage() {
  const [requests, setRequests] = useState<ApplicationRequest[]>([]);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    applicationRepository.listRequests().then((reqs) => {
      setRequests(
        reqs.map((r) => ({
          id: r.requestId,
          submissionTime: r.submittedAt,
          userId: r.userUid,
          username: r.walletAddress ? `${r.walletAddress.slice(0, 6)}...${r.walletAddress.slice(-4)}` : r.userUid,
          userAddress: r.walletAddress,
          group: r.requestType || 'Standard',
          handler: r.reviewedBy || 'system',
          amount: r.amountBaseUnits,
          status: r.status,
          reviewReason: r.reviewReason,
          reviewer: r.reviewedBy,
          reviewTime: r.reviewedAt,
        }))
      );
    }).catch(console.error);
  }, []);


  const [appliedFilters, setAppliedFilters] = useState({
    username: '',
    wallet: '',
    status: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof ApplicationRequest>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'submissionTime', label: 'Submission Time' },
    { key: 'userId', label: 'User ID' },
    { key: 'username', label: 'User' },
    { key: 'group', label: 'Group' },
    { key: 'handler', label: 'Handler' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'State' },
    { key: 'reviewReason', label: 'Review Reason' },
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'reviewTime', label: 'Review Time' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      username: usernameFilter,
      wallet: walletFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUsernameFilter('');
    setWalletFilter('');
    setStatusFilter('all');
    setAppliedFilters({
      username: '',
      wallet: '',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof ApplicationRequest;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filtered = requests
    .filter((r) => {
      const f = appliedFilters;
      const matchesUsername = f.username ? r.username.toLowerCase().includes(f.username.toLowerCase()) : true;
      const matchesWallet = f.wallet ? r.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesStatus = f.status === 'all' || r.status === f.status;
      return matchesUsername && matchesWallet && matchesStatus;
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
        title="Application Requests"
        subtitle="Automatic Sweeper configurations and node lease requests."
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/loans"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
            >
              <Landmark className="w-3.5 h-3.5" />
              Manage Loan Requests
            </Link>
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="application_requests_export"
            />
          </div>
        }
      />

      {/* Banner linking to Loan Requests */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Looking for <strong>User Credit & Loan Applications</strong>? Review collateral coverage and approve loan requests in the dedicated portal.
          </span>
        </div>
        <Link
          href="/admin/loans"
          className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
        >
          Open Loan Requests Portal <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>


      <FilterBar>
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
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
                {visibleColumns.includes('userId') && <th>User ID</th>}
                {visibleColumns.includes('username') && <th>User</th>}
                {visibleColumns.includes('group') && <th>Group</th>}
                {visibleColumns.includes('handler') && <th>Handler</th>}
                {visibleColumns.includes('amount') && <th>Amount</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('reviewReason') && <th>Review Reason</th>}
                {visibleColumns.includes('reviewer') && <th>Reviewer</th>}
                {visibleColumns.includes('reviewTime') && <th>Review Time</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{r.id}</td>}
                  {visibleColumns.includes('submissionTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(r.submissionTime).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{r.userId}</td>}
                  {visibleColumns.includes('username') && <td className="text-gray-800 font-semibold">{r.username}</td>}
                  {visibleColumns.includes('group') && <td>{r.group}</td>}
                  {visibleColumns.includes('handler') && <td>{r.handler}</td>}
                  {visibleColumns.includes('amount') && <td className="font-bold text-gray-800">{r.amount}</td>}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={r.status}
                        type={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('reviewReason') && <td className="text-gray-600 truncate max-w-[150px]">{r.reviewReason || '-'}</td>}
                  {visibleColumns.includes('reviewer') && <td>{r.reviewer || '-'}</td>}
                  {visibleColumns.includes('reviewTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {r.reviewTime ? new Date(r.reviewTime).toLocaleString() : '-'}
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
