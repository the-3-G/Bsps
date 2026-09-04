'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  StatusBadge,
  WalletAddressCell,
  TransactionHashCell,
  SearchButton,
  ResetFiltersButton,
} from '../../../components/ui/Reusables';
import {
  FilterBar,
  FilterField,
  TablePagination,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { mockPledges, MockPledgeRecord } from '../../../mocks/db';
import { pledgeRepository, userRepository } from '../../../repositories';
import { Plus, Edit3, X, Check, Sparkles } from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

export default function PledgesPage() {
  const [pledgesList, setPledgesList] = useState<MockPledgeRecord[]>([]);
  const [userList, setUserList] = useState<{ uid: string; walletAddress: string; username: string }[]>([]);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Modal State for Adding/Editing Smart Contract
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPledge, setEditingPledge] = useState<MockPledgeRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form Fields matching Client request
  const [formContractId, setFormContractId] = useState('1197');
  const [formUserAddress, setFormUserAddress] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formStakingType, setFormStakingType] = useState('VIP1');
  const [formStakingDays, setFormStakingDays] = useState('36');
  const [formDeposit, setFormDeposit] = useState('57,980');
  const [formCollectedAmount, setFormCollectedAmount] = useState('26,151,358');
  const [formUncollectedAmount, setFormUncollectedAmount] = useState('0');
  const [formInterestRate, setFormInterestRate] = useState('0.28334%');
  const [formReward, setFormReward] = useState('0.00 ETH');
  const [formBonusReward, setFormBonusReward] = useState('3.1 ETH');
  const [formEndTime, setFormEndTime] = useState('');
  const [formStatus, setFormStatus] = useState<'mining' | 'completed' | 'withdrawn' | 'redeemed'>('mining');

  useEffect(() => {
    // Load users for selection dropdown
    userRepository.listUsers().then((users) => {
      setUserList(users.map((u) => ({ uid: u.uid, walletAddress: u.walletAddress, username: u.username })));
    }).catch(() => {});

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setPledgesList(mockPledges);
      return;
    }

    // Real-time Firestore sync
    try {
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'pledges');
      const unsub = onSnapshot(colRef, (snap) => {
        const live: MockPledgeRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            contractId: data.contractId || d.id,
            userId: data.userUid || data.userId || 'u-1001',
            userAddress: data.walletAddress || data.userAddress || '0x...',
            tier: data.tier || data.stakingType || 'VIP1',
            stakingType: data.stakingType || data.tier || 'VIP1',
            stakingDays: Number(data.stakingDays || 36),
            interestRate: data.interestRate || data.miningRatio || '0.28334%',
            deposit: data.deposit || data.amountThreshold || '57,980',
            amountThreshold: data.deposit || data.amountThreshold || '57,980',
            miningRatio: data.interestRate || data.miningRatio || '0.28334%',
            miningReward: data.reward || data.miningReward || '0 ETH',
            collectionAmount: data.collectedAmount || data.collectionAmount || '0',
            uncollectedAmount: data.uncollectedAmount || '0',
            topUpAmount: data.topUpAmount || '0',
            ethReward: data.bonusReward || data.ethReward || '0 ETH',
            bonusReward: data.bonusReward || data.ethReward || '0 ETH',
            participationTime: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.participationTime || new Date().toISOString(),
            endTime: data.endTime || data.endAt || 'Active',
            status: data.status || 'mining',
            txHash: data.transactionHash || data.txHash || '0x' + Math.random().toString(16).slice(2, 10),
          };
        });
        setPledgesList(live.length > 0 ? live : mockPledges);
      });
      return () => unsub();
    } catch {
      pledgeRepository.listPledges().then((items: any[]) => {
        if (items && items.length > 0) {
          setPledgesList(items as any);
        } else {
          setPledgesList(mockPledges);
        }
      });
    }
  }, []);

  const openCreateModal = () => {
    setEditingPledge(null);
    setFormContractId(`ID_${Math.floor(1000 + Math.random() * 9000)}`);
    setFormUserAddress(userList[0]?.walletAddress || '');
    setFormUserId(userList[0]?.uid || 'u-1001');
    setFormStakingType('VIP1');
    setFormStakingDays('36');
    setFormDeposit('57,980');
    setFormCollectedAmount('26,151,358');
    setFormUncollectedAmount('0');
    setFormInterestRate('0.28334%');
    setFormReward('0.00 ETH');
    setFormBonusReward('3.1 ETH');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 36);
    setFormEndTime(futureDate.toISOString().slice(0, 16));
    setFormStatus('mining');
    setSaveSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (pledge: MockPledgeRecord) => {
    setEditingPledge(pledge);
    setFormContractId(pledge.contractId || pledge.id);
    setFormUserAddress(pledge.userAddress);
    setFormUserId(pledge.userId);
    setFormStakingType(pledge.stakingType || pledge.tier || 'VIP1');
    setFormStakingDays(String(pledge.stakingDays || 36));
    setFormDeposit(pledge.deposit || pledge.amountThreshold || '57,980');
    setFormCollectedAmount(pledge.collectionAmount || '26,151,358');
    setFormUncollectedAmount(pledge.uncollectedAmount || '0');
    setFormInterestRate(pledge.interestRate || pledge.miningRatio || '0.28334%');
    setFormReward(pledge.miningReward || '0.00 ETH');
    setFormBonusReward(pledge.bonusReward || pledge.ethReward || '3.1 ETH');
    setFormEndTime(pledge.endTime || new Date().toISOString().slice(0, 16));
    setFormStatus(pledge.status);
    setSaveSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleSaveSmartContract = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const recordData = {
        pledgeId: formContractId,
        contractId: formContractId,
        userUid: formUserId || 'u-1001',
        userId: formUserId || 'u-1001',
        walletAddress: formUserAddress || '0x...',
        userAddress: formUserAddress || '0x...',
        tier: formStakingType,
        stakingType: formStakingType,
        stakingDays: Number(formStakingDays) || 36,
        deposit: formDeposit,
        amountThreshold: formDeposit,
        collectedAmount: formCollectedAmount,
        collectionAmount: formCollectedAmount,
        uncollectedAmount: formUncollectedAmount,
        interestRate: formInterestRate,
        miningRatio: formInterestRate,
        reward: formReward,
        miningReward: formReward,
        bonusReward: formBonusReward,
        ethReward: formBonusReward,
        endTime: formEndTime || new Date().toISOString(),
        status: formStatus,
        createdAt: editingPledge ? editingPledge.participationTime : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        txHash: editingPledge ? editingPledge.txHash : '0x' + Math.random().toString(16).slice(2, 10),
      };

      const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (useMock || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        if (pledgeRepository.createOrUpdatePledge) {
          await pledgeRepository.createOrUpdatePledge(recordData as any);
        }
        setPledgesList((prev) => {
          const idx = prev.findIndex((p) => p.id === formContractId || p.contractId === formContractId);
          const mappedRecord: MockPledgeRecord = {
            id: formContractId,
            contractId: formContractId,
            userId: formUserId,
            userAddress: formUserAddress,
            tier: formStakingType,
            stakingType: formStakingType,
            stakingDays: Number(formStakingDays),
            deposit: formDeposit,
            amountThreshold: formDeposit,
            collectionAmount: formCollectedAmount,
            uncollectedAmount: formUncollectedAmount,
            interestRate: formInterestRate,
            miningRatio: formInterestRate,
            miningReward: formReward,
            bonusReward: formBonusReward,
            topUpAmount: '0',
            ethReward: formBonusReward,
            participationTime: new Date().toISOString(),
            endTime: formEndTime,
            status: formStatus,
            txHash: recordData.txHash,
          };
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = mappedRecord;
            return next;
          }
          return [mappedRecord, ...prev];
        });
      } else {
        const db = getFirebaseFirestore();
        const docRef = doc(db, 'pledges', formContractId);
        await setDoc(docRef, recordData, { merge: true });
      }

      setSaveSuccessMsg('✓ Smart Contract saved successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSaving(false);
      }, 1000);
    } catch (err) {
      console.error('Error saving smart contract:', err);
      setIsSaving(false);
    }
  };

  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    wallet: '',
    state: 'all',
    tier: 'all',
  });

  const [sortKey, setSortKey] = useState<keyof MockPledgeRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'id', label: 'Contract ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'userAddress', label: 'Wallet Address' },
    { key: 'tier', label: 'Staking Type' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'interestRate', label: 'Interest Rate' },
    { key: 'collectionAmount', label: 'Collected Amount' },
    { key: 'bonusReward', label: 'Bonus Reward' },
    { key: 'endTime', label: 'End Time' },
    { key: 'status', label: 'State' },
    { key: 'actions', label: 'Actions' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleSearch = () => {
    setAppliedFilters({
      userId: userIdFilter,
      wallet: walletFilter,
      state: stateFilter,
      tier: tierFilter,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setWalletFilter('');
    setStateFilter('all');
    setTierFilter('all');
    setAppliedFilters({
      userId: '',
      wallet: '',
      state: 'all',
      tier: 'all',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    const k = key as keyof MockPledgeRecord;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const filteredPledges = pledgesList
    .filter((p) => {
      const f = appliedFilters;
      const matchesUserId = f.userId ? p.userId.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesWallet = f.wallet ? p.userAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
      const matchesState = f.state === 'all' || p.status === f.state;
      const matchesTier = f.tier === 'all' || (p.tier && p.tier.toLowerCase().includes(f.tier.toLowerCase()));
      return matchesUserId && matchesWallet && matchesState && matchesTier;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalRowCount = filteredPledges.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginated = filteredPledges.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Upgrade Smart Contract Management"
        subtitle="Record, upgrade, and configure custom smart contract terms for every client."
        actions={
          <div className="flex gap-2 items-center">
            <button
              onClick={openCreateModal}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Record Smart Contract
            </button>

            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filteredPledges as unknown as Record<string, unknown>[]}
              filename="pledges_report"
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
        <FilterField label="State">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="mining">Mining</option>
            <option value="completed">Completed</option>
            <option value="redeemed">Redeemed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </FilterField>
        <FilterField label="Staking Type">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-850 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="VIP1">VIP1</option>
            <option value="VIP2">VIP2</option>
            <option value="VIP3">VIP3</option>
            <option value="VIP4">VIP4</option>
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
                {visibleColumns.includes('id') && <th><SortHeader label="Contract ID" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /></th>}
                {visibleColumns.includes('userId') && <th>User ID</th>}
                {visibleColumns.includes('userAddress') && <th>Wallet Address</th>}
                {visibleColumns.includes('tier') && <th>Staking Type</th>}
                {visibleColumns.includes('deposit') && <th>Deposit</th>}
                {visibleColumns.includes('interestRate') && <th>Interest Rate</th>}
                {visibleColumns.includes('collectionAmount') && <th>Collected Amount</th>}
                {visibleColumns.includes('bonusReward') && <th>Bonus Reward</th>}
                {visibleColumns.includes('endTime') && <th>End Time</th>}
                {visibleColumns.includes('status') && <th>State</th>}
                {visibleColumns.includes('actions') && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  {visibleColumns.includes('id') && <td className="font-mono font-bold text-gray-700">{p.contractId || p.id}</td>}
                  {visibleColumns.includes('userId') && <td className="font-mono text-gray-600">{p.userId}</td>}
                  {visibleColumns.includes('userAddress') && (
                    <td>
                      <WalletAddressCell address={p.userAddress} />
                    </td>
                  )}
                  {visibleColumns.includes('tier') && <td className="text-teal-700 font-bold">{p.stakingType || p.tier}</td>}
                  {visibleColumns.includes('deposit') && <td className="font-bold text-gray-800">{p.deposit || p.amountThreshold}</td>}
                  {visibleColumns.includes('interestRate') && <td className="text-teal-primary font-bold">{p.interestRate || p.miningRatio}</td>}
                  {visibleColumns.includes('collectionAmount') && <td className="text-gray-800 font-semibold">{p.collectionAmount}</td>}
                  {visibleColumns.includes('bonusReward') && <td className="font-mono text-amber-600 font-bold">{p.bonusReward || p.ethReward}</td>}
                  {visibleColumns.includes('endTime') && (
                    <td className="text-gray-500 font-mono text-[11px]">
                      {p.endTime}
                    </td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td>
                      <StatusBadge
                        status={p.status}
                        type={p.status === 'mining' ? 'info' : p.status === 'redeemed' ? 'success' : 'warning'}
                      />
                    </td>
                  )}
                  {visibleColumns.includes('actions') && (
                    <td className="text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-2.5 py-1 rounded text-xs transition-all inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Adjust
                      </button>
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

      {/* ── RECORD / UPGRADE SMART CONTRACT MODAL FOR ADMIN ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">
                  {editingPledge ? 'Adjust Client Smart Contract' : 'Upgrade Smart Contract for Client'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-teal-200 hover:text-white p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {saveSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Smart Contract ID */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Smart Contract ID</label>
                  <input
                    type="text"
                    value={formContractId}
                    onChange={(e) => setFormContractId(e.target.value)}
                    placeholder="e.g. ID 1197"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Target User */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Select Client</label>
                  {userList.length > 0 ? (
                    <select
                      value={formUserAddress}
                      onChange={(e) => {
                        const selected = userList.find((u) => u.walletAddress === e.target.value);
                        setFormUserAddress(e.target.value);
                        if (selected) setFormUserId(selected.uid);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {userList.map((u) => (
                        <option key={u.uid} value={u.walletAddress}>
                          {u.username} ({u.walletAddress.slice(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formUserAddress}
                      onChange={(e) => setFormUserAddress(e.target.value)}
                      placeholder="Wallet Address 0x..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                {/* Staking Type */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Staking Type</label>
                  <input
                    type="text"
                    value={formStakingType}
                    onChange={(e) => setFormStakingType(e.target.value)}
                    placeholder="e.g. VIP1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-teal-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Staking Days / Period */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Staking Days (Period)</label>
                  <input
                    type="number"
                    value={formStakingDays}
                    onChange={(e) => setFormStakingDays(e.target.value)}
                    placeholder="e.g. 36 days"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Minimum Investment / Deposit */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Smart Contract Deposit</label>
                  <input
                    type="text"
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(e.target.value)}
                    placeholder="e.g. 57,980"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Collected Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Collected Amount</label>
                  <input
                    type="text"
                    value={formCollectedAmount}
                    onChange={(e) => setFormCollectedAmount(e.target.value)}
                    placeholder="e.g. 26,151,358"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Interest Rate</label>
                  <input
                    type="text"
                    value={formInterestRate}
                    onChange={(e) => setFormInterestRate(e.target.value)}
                    placeholder="e.g. 0.28334%"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Bonus Reward */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Bonus Reward (Additional)</label>
                  <input
                    type="text"
                    value={formBonusReward}
                    onChange={(e) => setFormBonusReward(e.target.value)}
                    placeholder="e.g. 3.1 ETH"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-amber-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Uncollected Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Uncollected Amount</label>
                  <input
                    type="text"
                    value={formUncollectedAmount}
                    onChange={(e) => setFormUncollectedAmount(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Reward */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Standard Reward</label>
                  <input
                    type="text"
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    placeholder="e.g. 0.00 ETH"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* End Time & Status */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contract Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="mining">Mining / Active</option>
                    <option value="completed">Completed</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveSmartContract}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Smart Contract Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

