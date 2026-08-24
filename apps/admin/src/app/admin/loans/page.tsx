'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  StatusBadge,
  WalletAddressCell,
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
  DetailDrawer,
} from '../../../components/ui/DataTable';
import { loanRepository } from '../../../repositories';
import { DbLoanRequest } from '@bspc/types';
import { ShieldAlert, RotateCw, Landmark, CheckCircle, XCircle } from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function LoansPage() {
  const [loansList, setLoansList] = useState<DbLoanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [userUidFilter, setUserUidFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    userUid: '',
    wallet: '',
    status: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof DbLoanRequest>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Drawer / Dialog states
  const [selectedLoan, setSelectedLoan] = useState<DbLoanRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewTargetStatus, setReviewTargetStatus] = useState<'approved' | 'rejected' | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const allColumns = [
    { key: 'loanId', label: 'Loan ID' },
    { key: 'userUid', label: 'User ID' },
    { key: 'walletAddress', label: 'Wallet Address' },
    { key: 'amountUsdt', label: 'Amount (USDT)' },
    { key: 'interestRate', label: 'Interest Rate' },
    { key: 'termDays', label: 'Term (Days)' },
    { key: 'collateralUsdt', label: 'Collateral' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Requested Time' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const loadLoans = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await loanRepository.listLoanRequests();
      setLoansList(data);
    } catch (err: unknown) {
      console.warn('Failed to load loan requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();

    try {
      const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (!useMock) {
        const db = getFirebaseFirestore();
        const colRef = collection(db, 'loanRequests');
        const unsub = onSnapshot(
          colRef,
          (snap) => {
            const liveLoans: DbLoanRequest[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                loanId: d.id,
                userUid: data.userUid || '',
                walletAddress: data.walletAddress || '',
                amountUsdt: data.amountUsdt || '0 USDT',
                interestRate: data.interestRate || '0.05%/day',
                termDays: data.termDays || 14,
                collateralUsdt: data.collateralUsdt || '0 USDT',
                status: data.status || 'pending',
                reviewReason: data.reviewReason,
                reviewedBy: data.reviewedBy,
                reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
              } as DbLoanRequest;
            });
            setLoansList(liveLoans);
            setIsLoading(false);
          },
          (err) => {
            console.warn('Real-time loanRequests snapshot notice:', err);
            setIsLoading(false);
          }
        );
        return () => unsub();
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setAppliedFilters({
      userUid: userUidFilter,
      wallet: walletFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserUidFilter('');
    setWalletFilter('');
    setStatusFilter('all');
    setAppliedFilters({
      userUid: '',
      wallet: '',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof DbLoanRequest;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const handleConfirmReview = async () => {
    if (!selectedLoan || !reviewTargetStatus) return;
    try {
      setErrorMsg(null);
      await loanRepository.reviewLoanRequest(
        selectedLoan.loanId,
        reviewTargetStatus,
        reviewReason,
        'super_admin'
      );
      await loadLoans();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error?.message || 'Failed to update loan request status.');
    } finally {
      setIsReviewDialogOpen(false);
      setSelectedLoan(null);
      setReviewTargetStatus(null);
      setReviewReason('');
    }
  };

  const filteredLoans = loansList
    .filter((l) => {
      const f = appliedFilters;
      const matchesUid = f.userUid ? l.userUid.toLowerCase().includes(f.userUid.toLowerCase()) : true;
      const matchesWallet = f.wallet ? l.walletAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesStatus = f.status === 'all' || l.status === f.status;
      return matchesUid && matchesWallet && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortKey] || '';
      const bVal = b[sortKey] || '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalRowCount = filteredLoans.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginatedLoans = filteredLoans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const pendingCount = loansList.filter((l) => l.status === 'pending').length;
  const approvedCount = loansList.filter((l) => l.status === 'approved' || l.status === 'active').length;
  const repaidCount = loansList.filter((l) => l.status === 'repaid').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Loan Requests & Credit Management"
        subtitle="Review loan applications, monitor credit limits, collateral coverage, and repayments."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filteredLoans as unknown as Record<string, unknown>[]}
              filename="loan_requests_export"
            />
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Requests</div>
            <div className="text-lg font-bold text-gray-800">{loansList.length}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded border border-amber-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Review</div>
            <div className="text-lg font-bold text-amber-800">{pendingCount}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active / Approved</div>
            <div className="text-lg font-bold text-emerald-800">{approvedCount}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded border border-purple-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Repaid Loans</div>
            <div className="text-lg font-bold text-purple-800">{repaidCount}</div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <FilterBar>
        <FilterField label="User ID">
          <input
            type="text"
            placeholder="u-..."
            value={userUidFilter}
            onChange={(e) => setUserUidFilter(e.target.value)}
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
        <FilterField label="Loan Status">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="repaid">Repaid</option>
            <option value="rejected">Rejected</option>
          </select>
        </FilterField>

        <div className="flex items-center gap-2">
          <SearchButton onClick={handleSearch} />
          <ResetFiltersButton onClick={handleReset} />
        </div>
      </FilterBar>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-teal-primary" /> Loading loan requests...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse dense-table">
              <thead>
                <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                  {visibleColumns.includes('loanId') && (
                    <th>
                      <SortHeader
                        label="Loan ID"
                        sortKey="loanId"
                        currentSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                  )}
                  {visibleColumns.includes('userUid') && <th>User ID</th>}
                  {visibleColumns.includes('walletAddress') && <th>Wallet Address</th>}
                  {visibleColumns.includes('amountUsdt') && <th>Loan Amount</th>}
                  {visibleColumns.includes('interestRate') && <th>Daily APR</th>}
                  {visibleColumns.includes('termDays') && <th>Term</th>}
                  {visibleColumns.includes('collateralUsdt') && <th>Collateral</th>}
                  {visibleColumns.includes('status') && <th>Status</th>}
                  {visibleColumns.includes('createdAt') && <th>Requested Time</th>}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedLoans.map((loan) => (
                  <tr key={loan.loanId} className="hover:bg-gray-50/50">
                    {visibleColumns.includes('loanId') && (
                      <td className="font-mono text-gray-700 font-bold">{loan.loanId}</td>
                    )}
                    {visibleColumns.includes('userUid') && (
                      <td className="font-mono text-gray-600">{loan.userUid}</td>
                    )}
                    {visibleColumns.includes('walletAddress') && (
                      <td>
                        <WalletAddressCell address={loan.walletAddress} />
                      </td>
                    )}
                    {visibleColumns.includes('amountUsdt') && (
                      <td className="font-mono text-emerald-600 font-bold">{loan.amountUsdt}</td>
                    )}
                    {visibleColumns.includes('interestRate') && (
                      <td className="font-mono text-blue-600 font-semibold">{loan.interestRate}</td>
                    )}
                    {visibleColumns.includes('termDays') && (
                      <td className="font-semibold text-gray-700">{loan.termDays} Days</td>
                    )}
                    {visibleColumns.includes('collateralUsdt') && (
                      <td className="font-mono text-slate-600">{loan.collateralUsdt}</td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td>
                        <StatusBadge
                          status={loan.status}
                          type={
                            loan.status === 'approved' || loan.status === 'active' || loan.status === 'repaid'
                              ? 'success'
                              : loan.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                        />
                      </td>
                    )}
                    {visibleColumns.includes('createdAt') && (
                      <td className="text-gray-500 font-mono text-[11px]">
                        {new Date(loan.createdAt).toLocaleString()}
                      </td>
                    )}
                    <td className="text-right whitespace-nowrap space-x-1 py-2">
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-[11px] font-semibold"
                      >
                        Detail
                      </button>
                      {loan.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setReviewTargetStatus('approved');
                              setIsReviewDialogOpen(true);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[11px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setReviewTargetStatus('rejected');
                              setIsReviewDialogOpen(true);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded text-[11px] font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPageCount={totalPageCount}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
          totalRowCount={totalRowCount}
        />
      </div>

      {/* Detail Drawer */}
      {selectedLoan && !isReviewDialogOpen && (
        <DetailDrawer
          isOpen={!!selectedLoan}
          title={`Loan Detail: ${selectedLoan.loanId}`}
          onClose={() => setSelectedLoan(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Borrower Wallet</label>
              <div className="text-xs font-mono font-bold text-gray-800 mt-1">{selectedLoan.walletAddress}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Requested Loan Amount</label>
              <div className="text-sm font-bold text-emerald-600 mt-1">{selectedLoan.amountUsdt}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pledged Collateral</label>
              <div className="text-sm font-bold text-blue-600 mt-1">{selectedLoan.collateralUsdt}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Daily APR & Term</label>
              <div className="text-xs font-semibold text-gray-800 mt-1">
                {selectedLoan.interestRate} for {selectedLoan.termDays} Days
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</label>
              <div className="mt-1">
                <StatusBadge status={selectedLoan.status} type={selectedLoan.status === 'approved' || selectedLoan.status === 'repaid' ? 'success' : 'warning'} />
              </div>
            </div>
            {selectedLoan.reviewReason && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Review Note</label>
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 mt-1">{selectedLoan.reviewReason}</div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}

      {/* Review Dialog */}
      <ConfirmationDialog
        isOpen={isReviewDialogOpen}
        title={reviewTargetStatus === 'approved' ? 'Approve Loan Request' : 'Reject Loan Request'}
        message={`Confirm ${reviewTargetStatus?.toUpperCase()} for loan ${selectedLoan?.loanId} (${selectedLoan?.amountUsdt}).`}
        onConfirm={handleConfirmReview}
        onCancel={() => {
          setIsReviewDialogOpen(false);
          setReviewTargetStatus(null);
          setReviewReason('');
        }}
        isDestructive={reviewTargetStatus === 'rejected'}
      />
    </div>
  );
}
