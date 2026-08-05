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

interface MockOptionOrder {
  orderNumber: string;
  userId: string;
  userAddress: string;
  tradingPair: string;
  direction: 'UP' | 'DOWN';
  contractPeriod: string;
  buyAmount: string;
  settlementAmount: string;
  fee: string;
  entryPrice: string;
  settlementPrice: string;
  startTime: string;
  endTime: string;
  status: 'win' | 'lose' | 'pending';
}

const mockOrders: MockOptionOrder[] = Array.from({ length: 15 }, (_, i) => ({
  orderNumber: `OPT-ORD-${2000 + i}`,
  userId: `u-${(i % 5) + 1}`,
  userAddress: `0x${(100 + i).toString(16).padStart(40, '0')}`,
  tradingPair: 'BTC/USDT',
  direction: i % 2 === 0 ? 'UP' : 'DOWN',
  contractPeriod: `${[60, 120, 300][i % 3]}s`,
  buyAmount: (100 * (i + 1)).toString(),
  settlementAmount: i % 3 === 0 ? (100 * (i + 1) * 1.85).toString() : '0',
  fee: (1.5 * (i + 1)).toFixed(2),
  entryPrice: (60000 + i * 150).toFixed(2),
  settlementPrice: (i % 3 === 0 ? 60500 + i * 150 : 59500 + i * 150).toFixed(2),
  startTime: new Date(2026, 7, 10 + i).toISOString(),
  endTime: new Date(2026, 7, 10 + i, 12, 5).toISOString(),
  status: i % 3 === 0 ? 'win' : i % 3 === 1 ? 'lose' : 'pending',
}));

export default function OptionsOrdersPage() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [pairFilter, setPairFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    wallet: '',
    orderNum: '',
    pair: 'all',
    status: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockOptionOrder>('orderNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'userId', label: 'User ID' },
    { key: 'userAddress', label: 'Wallet Address' },
    { key: 'tradingPair', label: 'Trading Pair' },
    { key: 'direction', label: 'Direction' },
    { key: 'contractPeriod', label: 'Contract Period' },
    { key: 'buyAmount', label: 'Buy Amount' },
    { key: 'settlementAmount', label: 'Revenue' },
    { key: 'fee', label: 'Fee' },
    { key: 'entryPrice', label: 'Entry Price' },
    { key: 'settlementPrice', label: 'Settlement Price' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'status', label: 'State' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      wallet: walletFilter,
      orderNum: orderFilter,
      pair: pairFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setWalletFilter('');
    setOrderFilter('');
    setPairFilter('all');
    setStatusFilter('all');
    setAppliedFilters({
      userId: '',
      wallet: '',
      orderNum: '',
      pair: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockOptionOrder;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filteredOrders = mockOrders
    .filter((o) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? o.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesWallet = f.wallet ? o.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesOrder = f.orderNum ? o.orderNumber.toLowerCase().includes(f.orderNum.toLowerCase()) : true;
      const matchesPair = f.pair === 'all' || o.tradingPair === f.pair;
      const matchesStatus = f.status === 'all' || o.status === f.status;
      return matchesUserId && matchesWallet && matchesOrder && matchesPair && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalRowCount = filteredOrders.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginated = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Options Orders"
        subtitle="Staking options, predictions, and asset leverage contracts."
        actions={
          <div className="flex gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1.5 rounded border border-amber-250 self-center">
              DEMO SIMULATION ONLY
            </span>
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filteredOrders as unknown as Record<string, unknown>[]}
              filename="options_orders"
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
        <FilterField label="Order Number">
          <input
            type="text"
            placeholder="OPT-ORD-..."
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Trading Pair">
          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="BTC/USDT">BTC/USDT</option>
          </select>
        </FilterField>
        <FilterField label="State">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-855 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="win">Win</option>
            <option value="lose">Lose</option>
            <option value="pending">Pending</option>
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
                {visibleColumns.includes('orderNumber') && <th><SortHeader label="Order Number" sortKey="orderNumber" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /></th>}
                {visibleColumns.includes('userId') && <th>User ID</th>}
                {visibleColumns.includes('userAddress') && <th>Wallet Address</th>}
                {visibleColumns.includes('tradingPair') && <th>Trading Pair</th>}
                {visibleColumns.includes('direction') && <th>Direction</th>}
                {visibleColumns.includes('contractPeriod') && <th>Contract Period</th>}
                {visibleColumns.includes('buyAmount') && <th>Buy Amount</th>}
                {visibleColumns.includes('settlementAmount') && <th>Revenue</th>}
                {visibleColumns.includes('fee') && <th>Fee</th>}
                {visibleColumns.includes('entryPrice') && <th>Entry Price</th>}
                {visibleColumns.includes('settlementPrice') && <th>Settlement Price</th>}
                {visibleColumns.includes('startTime') && <th>Start Time</th>}
                {visibleColumns.includes('endTime') && <th>End Time</th>}
                {visibleColumns.includes('status') && <th>State</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((o) => (
                <tr key={o.orderNumber} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('orderNumber') && <td className="font-mono text-gray-750 font-bold">{o.orderNumber}</td>}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{o.userId}</td>}
                  {visibleColumns.includes('userAddress') && (
                    <td>
                      <WalletAddressCell address={o.userAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('tradingPair') && <td className="text-gray-900 font-bold">{o.tradingPair}</td>}
                  {visibleColumns.includes('direction') && (
                    <td>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          o.direction === 'UP' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {o.direction}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('contractPeriod') && <td>{o.contractPeriod}</td>}
                  {visibleColumns.includes('buyAmount') && <td className="font-semibold text-gray-800">{o.buyAmount} USDT</td>}
                  {visibleColumns.includes('settlementAmount') && (
                    <td className="font-semibold text-gray-800">
                      {o.status === 'win' ? `${o.settlementAmount} USDT` : '-'}
                    </td>
                  )}
                  {visibleColumns.includes('fee') && <td>{o.fee} USDT</td>}
                  {visibleColumns.includes('entryPrice') && <td className="font-mono text-gray-600">${o.entryPrice}</td>}
                  {visibleColumns.includes('settlementPrice') && (
                    <td className="font-mono text-gray-600">
                      {o.status === 'pending' ? '-' : `$${o.settlementPrice}`}
                    </td>
                  )}
                  {visibleColumns.includes('startTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(o.startTime).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('endTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(o.endTime).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={o.status}
                        type={o.status === 'win' ? 'success' : o.status === 'lose' ? 'error' : 'warning'}
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
