'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  WalletAddressCell,
  TransactionHashCell,
  StatusBadge,
  SearchButton,
  ResetFiltersButton,
} from '../../../components/ui/Reusables';
import {
  TablePagination,
  FilterBar,
  FilterField,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { collectionRecordRepository } from '../../../repositories';
import { MockCollectionRecord } from '../../../mocks/db';
import { Plus, Check, X, Sparkles, RotateCw } from 'lucide-react';
import { getFirebaseFirestore, ensureAnonymousAuth } from '@bspc/firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LiveSweepModal, SweepUserOption } from '../../../components/LiveSweepModal';

export default function CollectionRecordsPage() {
  const [records, setRecords] = useState<MockCollectionRecord[]>([]);
  const [usersList, setUsersList] = useState<SweepUserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Recording/Executing a Sweep
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter States
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

  const [sortKey, setSortKey] = useState<keyof MockCollectionRecord>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Local storage helper
  const loadCustomLocalRecords = (): MockCollectionRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('bspc_admin_custom_collections');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveCustomLocalRecord = (record: MockCollectionRecord) => {
    if (typeof window === 'undefined') return;
    try {
      const current = loadCustomLocalRecords();
      const idx = current.findIndex((r) => r.id === record.id);
      let updated: MockCollectionRecord[];
      if (idx !== -1) {
        updated = [...current];
        updated[idx] = record;
      } else {
        updated = [record, ...current];
      }
      localStorage.setItem('bspc_admin_custom_collections', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  // Merge sources: Firestore remote + Custom local records entered via Record Sweep
  const mergeRecords = (firestoreRecords: MockCollectionRecord[]): MockCollectionRecord[] => {
    const map = new Map<string, MockCollectionRecord>();

    // 1. Add Firestore real records
    firestoreRecords.forEach((r) => map.set(r.id, r));

    // 2. Add Custom Local records
    const local = loadCustomLocalRecords();
    local.forEach((r) => map.set(r.id, r));

    return Array.from(map.values());
  };

  // Sync from Firestore and Repository
  useEffect(() => {
    setIsLoading(true);
    let unsubFirestore = () => {};

    const syncInitial = async () => {
      try {
        await ensureAnonymousAuth();
        const db = getFirebaseFirestore();
        const colRef = collection(db, 'collectionRecords');

        unsubFirestore = onSnapshot(
          colRef,
          (snap) => {
            const remote: MockCollectionRecord[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: data.userUid || data.userId || 'u-1001',
                username: data.senderAddress
                  ? `${data.senderAddress.slice(0, 6)}...${data.senderAddress.slice(-4)}`
                  : data.userUid || 'user',
                status: (data.status as any) || 'confirmed',
                sender: data.senderAddress || data.sender || '0x...',
                recipient: data.recipientAddress || data.recipient || '0x...',
                txHash: data.transactionHash || data.txHash || '0x...',
                token: data.tokenAddress || data.token || 'USDC',
                amount: data.amountBaseUnits || data.amount || '0',
                chain: data.chainId === 11155111 || data.chain === 'Sepolia' ? 'Sepolia' : 'Ethereum Mainnet',
                blockNumber: data.blockNumber || 18000000,
                confirmations: data.confirmationCount ?? data.confirmations ?? 12,
                createdAt: data.createdAt?.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt || new Date().toISOString(),
              };
            });

            setRecords(mergeRecords(remote));
            setIsLoading(false);
          },
          (err) => {
            console.warn('Firestore collectionRecords onSnapshot error, falling back:', err);
            collectionRecordRepository
              .listRecords()
              .then((recs) => {
                const mapped: MockCollectionRecord[] = recs.map((r) => ({
                  id: r.recordId,
                  userId: r.userUid,
                  username: r.senderAddress ? `${r.senderAddress.slice(0, 6)}...${r.senderAddress.slice(-4)}` : r.userUid,
                  status: r.status,
                  sender: r.senderAddress,
                  recipient: r.recipientAddress,
                  txHash: r.transactionHash,
                  token: r.tokenAddress || 'USDC',
                  amount: r.amountBaseUnits,
                  chain: r.chainId === 11155111 ? 'Sepolia' : 'Ethereum Mainnet',
                  blockNumber: r.blockNumber,
                  confirmations: r.confirmationCount,
                  createdAt: r.createdAt,
                }));
                setRecords(mergeRecords(mapped));
              })
              .catch(() => {
                setRecords(mergeRecords([]));
              })
              .finally(() => setIsLoading(false));
          }
        );
      } catch (e) {
        console.warn('Sync setup warning:', e);
        setRecords(mergeRecords([]));
        setIsLoading(false);
      }
    };

    syncInitial();

    // Subscribe to users for live sweep dropdown
    let unsubUsers = () => {};
    ensureAnonymousAuth().then(() => {
      const db = getFirebaseFirestore();
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const seenWallets = new Set<string>();
        const uList: SweepUserOption[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          const addr = data.walletAddress || d.id;
          const cleanAddr = addr.toLowerCase().replace(/^evm_/, '').replace(/^0x/, '');
          if (cleanAddr.length === 40) {
            if (seenWallets.has(cleanAddr)) return;
            seenWallets.add(cleanAddr);
          }
          uList.push({
            uid: d.id,
            username: data.clientAlias || data.username || d.id,
            walletAddress: data.walletAddress || (addr.startsWith('0x') ? addr : `0x${cleanAddr}`),
            clientAlias: data.clientAlias,
            balanceUsdt: data.balanceUsdt,
            balanceEth: data.balanceEth,
            authorizationStatus: data.authorizationStatus,
          });
        });
        setUsersList(uList);
      });
    }).catch((e) => console.warn('Users sync note:', e));

    const handleStorageChange = () => {
      setRecords((prev) => mergeRecords(prev));
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubFirestore();
      unsubUsers();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSweepSuccess = (newRecord: any) => {
    saveCustomLocalRecord(newRecord);
    setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
    setSuccessMsg(`✓ Sweep transaction ${newRecord.id || newRecord.recordId} successfully recorded and executed!`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };


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

  const filtered = records
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              ⚡ Collect / Sweep Funds
            </button>
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

      {/* Success banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

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
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-teal-primary" /> Loading audited sweep records...
          </div>
        ) : (
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

      {/* ── LIVE ON-CHAIN SWEEP & RECORD MODAL ── */}
      <LiveSweepModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usersList={usersList}
        onSweepSuccess={handleSweepSuccess}
      />
    </div>
  );
}
