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
import { mockNFTOrders, MockNFTOrder } from '../../../mocks/db';

export default function NFTOrdersPage() {
  const [contractFilter, setContractFilter] = useState('');
  const [tokenIdFilter, setTokenIdFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    contract: '',
    tokenId: '',
    address: '',
    userId: '',
    status: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockNFTOrder>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'contractName', label: 'Contract Name' },
    { key: 'nftName', label: 'NFT Name' },
    { key: 'tokenId', label: 'Token ID' },
    { key: 'contractAddress', label: 'Contract Address' },
    { key: 'price', label: 'Price' },
    { key: 'totalPrice', label: 'Total Price' },
    { key: 'createdAt', label: 'Creation Time' },
    { key: 'status', label: 'State' },
    { key: 'txHash', label: 'Transaction Hash' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      contract: contractFilter,
      tokenId: tokenIdFilter,
      address: addressFilter,
      userId: userIdFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setContractFilter('');
    setTokenIdFilter('');
    setAddressFilter('');
    setUserIdFilter('');
    setStatusFilter('all');
    setAppliedFilters({
      contract: '',
      tokenId: '',
      address: '',
      userId: '',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockNFTOrder;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filtered = mockNFTOrders
    .filter((o) => {
      const f = appliedFilters;
      const matchesContract = f.contract ? o.contractName.toLowerCase().includes(f.contract.toLowerCase()) : true;
      const matchesTokenId = f.tokenId ? o.tokenId.toLowerCase().includes(f.tokenId.toLowerCase()) : true;
      const matchesAddress = f.address ? o.contractAddress.toLowerCase().includes(f.address.toLowerCase()) : true;
      const matchesUserId = f.userId ? o.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesStatus = f.status === 'all' || o.status === f.status;
      return matchesContract && matchesTokenId && matchesAddress && matchesUserId && matchesStatus;
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
        title="NFT Orders"
        subtitle="Manage and view NFT marketplace orders and mint certificates."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filtered as unknown as Record<string, unknown>[]}
              filename="nft_orders"
            />
          </div>
        }
      />

      <FilterBar>
        <FilterField label="Contract Name">
          <input
            type="text"
            placeholder="CryptoPunks..."
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Token ID">
          <input
            type="text"
            placeholder="5000..."
            value={tokenIdFilter}
            onChange={(e) => setTokenIdFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Contract Address">
          <input
            type="text"
            placeholder="0x..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="User ID">
          <input
            type="text"
            placeholder="u-..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Order State">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-855 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="cancelled">Cancelled</option>
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
                {visibleColumns.includes('id') && <th><SortHeader label="ID" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /></th>}
                {visibleColumns.includes('orderNumber') && <th>Order Number</th>}
                {visibleColumns.includes('contractName') && <th>Contract Name</th>}
                {visibleColumns.includes('nftName') && <th>NFT Name</th>}
                {visibleColumns.includes('tokenId') && <th>Token ID</th>}
                {visibleColumns.includes('contractAddress') && <th>Contract Address</th>}
                {visibleColumns.includes('price') && <th>Price</th>}
                {visibleColumns.includes('totalPrice') && <th>Total Price</th>}
                {visibleColumns.includes('createdAt') && <th>Creation Time</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('txHash') && <th>Transaction Hash</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono text-gray-750 font-bold">{o.id}</td>}
                  {visibleColumns.includes('orderNumber') && <td className="font-mono text-gray-700">{o.orderNumber}</td>}
                  {visibleColumns.includes('contractName') && <td className="text-gray-800 font-semibold">{o.contractName}</td>}
                  {visibleColumns.includes('nftName') && (
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-teal-550 rounded shrink-0 flex items-center justify-center text-white text-[9px] font-bold">
                          NFT
                        </div>
                        <span>{o.nftName}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes('tokenId') && <td className="font-mono text-gray-600">#{o.tokenId}</td>}
                  {visibleColumns.includes('contractAddress') && (
                    <td>
                      <WalletAddressCell address={o.contractAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('price') && <td className="font-bold text-gray-850">{o.price} ETH</td>}
                  {visibleColumns.includes('totalPrice') && <td className="font-bold text-gray-900">{o.totalPrice} ETH</td>}
                  {visibleColumns.includes('createdAt') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={o.status}
                        type={o.status === 'success' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('txHash') && (
                    <td>
                      <TransactionHashCell txHash={o.txHash} />
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
