'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, WalletAddressCell } from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
  DetailDrawer,
} from '../../../components/ui/DataTable';
import { teamReportRepository } from '../../../repositories';
import { MockTeamReportRow } from '../../../mocks/db';
import { Users } from 'lucide-react';

export default function TeamReportsPage() {
  const [reports, setReports] = useState<MockTeamReportRow[]>([]);
  const [leaderIdFilter, setLeaderIdFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');

  useEffect(() => {
    teamReportRepository.listReports().then((reps) => {
      setReports(reps);
    }).catch(console.error);
  }, []);


  const [appliedFilters, setAppliedFilters] = useState({
    leaderId: '',
    username: '',
    wallet: '',
  });

  const [sortKey, setSortKey] = useState<keyof MockTeamReportRow>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedLeader, setSelectedLeader] = useState<MockTeamReportRow | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'leaderUsername', label: 'Leader' },
    { key: 'directUsersCount', label: 'Direct Users' },
    { key: 'descendantsCount', label: 'Total Descendants' },
    { key: 'incomeSummary', label: 'Income Summary' },
    { key: 'expenditureSummary', label: 'Expenditure Summary' },
    { key: 'cumulativeCollection', label: 'Cumulative Collection' },
    { key: 'cumulativeWithdrawals', label: 'Cumulative Withdrawals' },
    { key: 'verifiedUsdc', label: 'Verified USDC' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      leaderId: leaderIdFilter,
      username: usernameFilter,
      wallet: walletFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setLeaderIdFilter('');
    setUsernameFilter('');
    setWalletFilter('');
    setAppliedFilters({
      leaderId: '',
      username: '',
      wallet: '',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockTeamReportRow;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filtered = reports
    .filter((r) => {
      const f = appliedFilters;
      const matchesLeaderId = f.leaderId ? r.leaderId.toLowerCase().includes(f.leaderId.toLowerCase()) : true;
      const matchesUsername = f.username ? r.leaderUsername.toLowerCase().includes(f.username.toLowerCase()) : true;
      const matchesWallet = f.wallet ? r.leaderAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      return matchesLeaderId && matchesUsername && matchesWallet;
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
        title="Team Reports"
        subtitle="Affiliate hierarchy network stakers performance metrics."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="team_reports"
            />
          </div>
        }
      />

      <FilterBar>
        <FilterField label="Leader ID">
          <input
            type="text"
            placeholder="u-..."
            value={leaderIdFilter}
            onChange={(e) => setLeaderIdFilter(e.target.value)}
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors shrink-0"
          >
            Search
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-1.5 rounded transition-colors shrink-0"
          >
            Reset
          </button>
        </div>
      </FilterBar>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                {visibleColumns.includes('leaderUsername') && (
                  <th>
                    <SortHeader
                      label="Leader"
                      sortKey="leaderUsername"
                      currentSortKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                )}
                <th>Leader Wallet</th>
                {visibleColumns.includes('directUsersCount') && <th>Direct Users</th>}
                {visibleColumns.includes('descendantsCount') && <th>Total Descendants</th>}
                {visibleColumns.includes('incomeSummary') && <th>Income Summary</th>}
                {visibleColumns.includes('expenditureSummary') && <th>Expenditure Summary</th>}
                {visibleColumns.includes('cumulativeCollection') && <th>Cumulative Collection</th>}
                {visibleColumns.includes('cumulativeWithdrawals') && <th>Cumulative Withdrawals</th>}
                {visibleColumns.includes('verifiedUsdc') && <th>Verified USDC</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('leaderUsername') && <td className="text-gray-805 font-bold">{r.leaderUsername}</td>}
                  <td>
                    <WalletAddressCell address={r.leaderAddress} />
                  </td>
                  {visibleColumns.includes('directUsersCount') && <td className="font-semibold text-gray-800">{r.directUsersCount} users</td>}
                  {visibleColumns.includes('descendantsCount') && <td className="text-gray-650">{r.descendantsCount} total</td>}
                  {visibleColumns.includes('incomeSummary') && <td className="text-green-600 font-bold">{r.incomeSummary}</td>}
                  {visibleColumns.includes('expenditureSummary') && <td className="text-red-600 font-bold">{r.expenditureSummary}</td>}
                  {visibleColumns.includes('cumulativeCollection') && <td className="text-gray-700 font-semibold">{r.cumulativeCollection}</td>}
                  {visibleColumns.includes('cumulativeWithdrawals') && <td className="text-gray-700 font-semibold">{r.cumulativeWithdrawals}</td>}
                  {visibleColumns.includes('verifiedUsdc') && <td className="text-teal-primary font-bold">{r.verifiedUsdc}</td>}
                  <td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLeader(r)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> Subordinates
                    </button>
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

      {/* Subordinates tree view detail drawer */}
      <DetailDrawer
        isOpen={!!selectedLeader}
        title={`Subordinates Tree: ${selectedLeader?.leaderUsername}`}
        onClose={() => setSelectedLeader(null)}
      >
        {selectedLeader && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 border-b pb-2">Direct Referrals (Level 1)</h3>
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 border rounded flex justify-between items-center text-[11px]">
                <span className="font-mono">user_2 (u-2)</span>
                <span className="font-bold text-teal-primary">Active</span>
              </div>
              <div className="p-2 bg-gray-50 border rounded flex justify-between items-center text-[11px]">
                <span className="font-mono">user_7 (u-7)</span>
                <span className="font-bold text-gray-400">Suspended</span>
              </div>
            </div>

            <h3 className="text-xs font-bold text-gray-900 border-b pb-2 mt-4">Total Downline Yield Pool</h3>
            <div className="text-xs font-bold text-gray-800">
              {selectedLeader.cumulativeCollection} total funds swept.
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
