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
import { mockCollections, MockCollectionRecord } from '../../../mocks/db';
import { Plus, Check, X, Sparkles, Database, RotateCw } from 'lucide-react';
import { getFirebaseFirestore, ensureAnonymousAuth } from '@bspc/firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function CollectionRecordsPage() {
  const [records, setRecords] = useState<MockCollectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Recording a Sweep
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formId, setFormId] = useState('');
  const [formUserId, setFormUserId] = useState('u-1001');
  const [formSender, setFormSender] = useState('');
  const [formRecipient, setFormRecipient] = useState('0xd1dd0000000000000000000000000000b6107000');
  const [formToken, setFormToken] = useState('USDC');
  const [formAmount, setFormAmount] = useState('5,000');
  const [formChain, setFormChain] = useState<'Sepolia' | 'Ethereum Mainnet'>('Sepolia');
  const [formStatus, setFormStatus] = useState<'confirmed' | 'pending' | 'failed'>('confirmed');
  const [formTxHash, setFormTxHash] = useState('');
  const [formConfirmations, setFormConfirmations] = useState('12');

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

  // Merge sources: Custom local (highest) + Firestore remote + Fallback mock
  const mergeRecords = (firestoreRecords: MockCollectionRecord[]): MockCollectionRecord[] => {
    const map = new Map<string, MockCollectionRecord>();

    // 1. If both Firestore and Local are empty, populate with fallback sample records
    const local = loadCustomLocalRecords();
    if (firestoreRecords.length === 0 && local.length === 0) {
      mockCollections.forEach((r) => map.set(r.id, r));
    } else if (firestoreRecords.length === 0) {
      // Include fallback mocks alongside local additions
      mockCollections.forEach((r) => map.set(r.id, r));
    }

    // 2. Add Firestore records
    firestoreRecords.forEach((r) => map.set(r.id, r));

    // 3. Add Custom Local records (highest priority)
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

    const handleStorageChange = () => {
      setRecords((prev) => mergeRecords(prev));
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const openRecordModal = () => {
    const randomHex = Math.random().toString(16).slice(2, 10);
    setFormId(`swp-${Date.now().toString(16).slice(-6)}`);
    setFormUserId(`u-${Math.floor(Math.random() * 900 + 100)}`);
    setFormSender(`0x${randomHex.padStart(40, 'a')}`);
    setFormRecipient('0xd1dd0000000000000000000000000000b6107000');
    setFormToken('USDC');
    setFormAmount('5,000');
    setFormChain('Sepolia');
    setFormStatus('confirmed');
    setFormTxHash(`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`);
    setFormConfirmations('12');
    setIsModalOpen(true);
  };

  const handleSaveSweepRecord = async () => {
    setIsSaving(true);
    try {
      const newRecord: MockCollectionRecord = {
        id: formId.trim() || `swp-${Date.now()}`,
        userId: formUserId.trim() || 'u-1001',
        username: `${formSender.slice(0, 6)}...${formSender.slice(-4)}`,
        status: formStatus,
        sender: formSender.trim(),
        recipient: formRecipient.trim(),
        txHash: formTxHash.trim() || `0x${Math.random().toString(16).slice(2)}`,
        token: formToken,
        amount: formAmount.trim(),
        chain: formChain,
        blockNumber: 18000000 + Math.floor(Math.random() * 5000),
        confirmations: parseInt(formConfirmations, 10) || 12,
        createdAt: new Date().toISOString(),
      };

      // 1. Save to local storage for instant persistent display
      saveCustomLocalRecord(newRecord);

      // 2. Try writing to Firestore
      try {
        await ensureAnonymousAuth();
        const db = getFirebaseFirestore();
        await setDoc(doc(db, 'collectionRecords', newRecord.id), {
          recordId: newRecord.id,
          userUid: newRecord.userId,
          senderAddress: newRecord.sender,
          recipientAddress: newRecord.recipient,
          chainId: newRecord.chain === 'Sepolia' ? 11155111 : 1,
          chain: newRecord.chain,
          tokenAddress: newRecord.token,
          token: newRecord.token,
          amountBaseUnits: newRecord.amount,
          amount: newRecord.amount,
          transactionHash: newRecord.txHash,
          txHash: newRecord.txHash,
          confirmationCount: newRecord.confirmations,
          status: newRecord.status,
          blockNumber: newRecord.blockNumber,
          createdAt: serverTimestamp(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore collection record sync note:', fsErr);
      }

      setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
      setSuccessMsg(`✓ Sweep transaction ${newRecord.id} recorded successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save sweep record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Seed sample records to Firestore
  const handleSeedSamplesToFirestore = async () => {
    setIsLoading(true);
    try {
      await ensureAnonymousAuth();
      const db = getFirebaseFirestore();
      const samplesToSeed = mockCollections.slice(0, 5);

      for (const s of samplesToSeed) {
        await setDoc(doc(db, 'collectionRecords', s.id), {
          recordId: s.id,
          userUid: s.userId,
          senderAddress: s.sender,
          recipientAddress: s.recipient,
          chainId: 11155111,
          chain: 'Sepolia',
          tokenAddress: s.token,
          amountBaseUnits: s.amount,
          transactionHash: s.txHash,
          confirmationCount: s.confirmations,
          status: s.status,
          blockNumber: s.blockNumber,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      setSuccessMsg('✓ 5 Audited Sweep records successfully seeded to Firestore!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to seed records to Firestore:', err);
    } finally {
      setIsLoading(false);
    }
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
              onClick={openRecordModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Sweep
            </button>
            <button
              onClick={handleSeedSamplesToFirestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
              title="Populate 5 sample audited sweep transactions into Firestore"
            >
              <Database className="w-3.5 h-3.5" />
              Seed to Cloud
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

      {/* ── RECORD SWEEP MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold">Record Collection Sweep</h3>
                  <p className="text-[11px] text-teal-100">Log audited treasury sweep transaction</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-teal-200 hover:text-white p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Sweep Record ID</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g. swp-101"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">User ID / Tag</label>
                  <input
                    type="text"
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    placeholder="e.g. u-1001"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Sender Wallet (User)</label>
                  <input
                    type="text"
                    value={formSender}
                    onChange={(e) => setFormSender(e.target.value)}
                    placeholder="0x..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Recipient Wallet (Treasury)</label>
                  <input
                    type="text"
                    value={formRecipient}
                    onChange={(e) => setFormRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Token</label>
                  <select
                    value={formToken}
                    onChange={(e) => setFormToken(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-teal-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Sweep Amount</label>
                  <input
                    type="text"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 5,000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Network Chain</label>
                  <select
                    value={formChain}
                    onChange={(e) => setFormChain(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Sepolia">Sepolia Testnet</option>
                    <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Confirmation Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Transaction Hash</label>
                  <input
                    type="text"
                    value={formTxHash}
                    onChange={(e) => setFormTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Block Confirmations</label>
                  <input
                    type="number"
                    value={formConfirmations}
                    onChange={(e) => setFormConfirmations(e.target.value)}
                    placeholder="12"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSweepRecord}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white shadow transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {isSaving ? 'Recording...' : 'Save Sweep Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
