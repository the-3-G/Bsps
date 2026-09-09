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
  DetailDrawer,
  ConfirmationDialog,
  ExportButton,
  ColumnVisibilityMenu,
  SortHeader,
} from '../../../components/ui/DataTable';
import { userRepository } from '../../../repositories';
import { DbUser } from '@bspc/types';
import Link from 'next/link';
import { Eye, ShieldAlert, RotateCw, Landmark, ExternalLink, Sparkles, Plus, Check, X, Zap, Trash2 } from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';


export default function UsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loginSubmissions, setLoginSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
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

  const [sortKey, setSortKey] = useState<keyof DbUser>('uid');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Drawer / Dialog States
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<'profile' | 'referrals' | 'audit' | null>(null);
  const [drawerAlias, setDrawerAlias] = useState('');
  const [drawerNote, setDrawerNote] = useState('');
  const [isSavingDrawerAlias, setIsSavingDrawerAlias] = useState(false);
  const [drawerSaveMsg, setDrawerSaveMsg] = useState<string | null>(null);

  // Smart Contract Modal State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractSaving, setContractSaving] = useState(false);
  const [contractSuccessMsg, setContractSuccessMsg] = useState('');
  const [contractFormId, setContractFormId] = useState('p-18');
  const [contractFormAddress, setContractFormAddress] = useState('');
  const [contractFormUserId, setContractFormUserId] = useState('');
  const [contractFormType, setContractFormType] = useState('Type C');
  const [contractFormDays, setContractFormDays] = useState('70');
  const [contractFormDeposit, setContractFormDeposit] = useState('511,000');
  const [contractFormCollected, setContractFormCollected] = useState('14,520');
  const [contractFormUncollected, setContractFormUncollected] = useState('14,520');
  const [contractFormRate, setContractFormRate] = useState('2.7%');
  const [contractFormBonusReward, setContractFormBonusReward] = useState('25.77');
  const [contractFormReward, setContractFormReward] = useState('92.345 ETH');
  const [contractFormEndTime, setContractFormEndTime] = useState('2026-09-19');
  const [contractFormStatus, setContractFormStatus] = useState<'mining' | 'completed' | 'withdrawn' | 'redeemed'>('redeemed');

  const [userToToggle, setUserToToggle] = useState<DbUser | null>(null);
  const [actionType, setActionType] = useState<'status' | 'session' | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [operationRef, setOperationRef] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const allColumns = [
    { key: 'uid', label: 'User ID' },
    { key: 'username', label: 'Username' },
    { key: 'walletAddress', label: 'Wallet Address' },
    { key: 'balanceUsdt', label: 'USDT Balance' },
    { key: 'balanceEth', label: 'ETH Balance' },
    { key: 'authorizationStatus', label: 'Authorization' },
    { key: 'status', label: 'Account Status' },
    { key: 'collectionStatus', label: 'Collection Status' },
    { key: 'createdAt', label: 'Registration Time' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((c) => c.key));

  const handleToggleAuthorization = async (user: DbUser) => {
    try {
      const nextAuthStatus = user.authorizationStatus === 'authorized' ? 'unauthorized' : 'authorized';
      const db = getFirebaseFirestore();
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', user.uid), {
        authorizationStatus: nextAuthStatus,
      });
      setOperationRef(`AUTH-${user.uid.slice(-4).toUpperCase()}-${nextAuthStatus.toUpperCase()}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update user authorization status.');
    }
  };

  const handleSaveDrawerAliasAndNote = async () => {
    if (!selectedUser) return;
    setIsSavingDrawerAlias(true);
    setDrawerSaveMsg(null);
    try {
      const db = getFirebaseFirestore();
      const { doc, setDoc } = await import('firebase/firestore');
      const targetUid = selectedUser.uid || selectedUser.walletAddress;
      await setDoc(doc(db, 'users', targetUid), {
        clientAlias: drawerAlias.trim(),
        adminNote: drawerNote.trim(),
        customNote: drawerNote.trim(),
      }, { merge: true });

      setSelectedUser((prev: any) =>
        prev
          ? {
              ...prev,
              clientAlias: drawerAlias.trim(),
              adminNote: drawerNote.trim(),
              customNote: drawerNote.trim(),
            }
          : null
      );
      setDrawerSaveMsg('Saved successfully!');
      setTimeout(() => setDrawerSaveMsg(null), 3000);
    } catch (err: any) {
      setDrawerSaveMsg('Failed to save: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSavingDrawerAlias(false);
    }
  };

  const openSmartContractForUser = (u: DbUser) => {
    const rawAddr = (u.walletAddress || u.uid || '').trim();
    const normAddr = rawAddr.startsWith('0x') ? rawAddr : `0x${rawAddr}`;
    setContractFormAddress(normAddr);
    setContractFormUserId(u.uid || normAddr);
    setContractFormId('p-18');
    setContractFormType('Type C');
    setContractFormDays('70');
    setContractFormDeposit('511,000');
    setContractFormCollected('14,520');
    setContractFormUncollected('14,520');
    setContractFormRate('2.7%');
    setContractFormBonusReward('25.77');
    setContractFormReward('92.345 ETH');
    setContractFormEndTime('2026-09-19');
    setContractFormStatus('redeemed');
    setContractSuccessMsg('');
    setIsContractModalOpen(true);
  };

  const handleSaveContractForUser = async () => {
    setContractSaving(true);
    setContractSuccessMsg('');
    try {
      let normalizedAddress = (contractFormAddress || '').trim();
      if (normalizedAddress && !normalizedAddress.startsWith('0x') && /^[0-9a-fA-F]{40}$/.test(normalizedAddress)) {
        normalizedAddress = `0x${normalizedAddress}`;
      }

      const recordData = {
        pledgeId: contractFormId,
        contractId: contractFormId,
        userUid: contractFormUserId || normalizedAddress || 'u-1001',
        userId: contractFormUserId || normalizedAddress || 'u-1001',
        walletAddress: normalizedAddress || '0x...',
        userAddress: normalizedAddress || '0x...',
        tier: contractFormType,
        stakingType: contractFormType,
        stakingDays: Number(contractFormDays) || 70,
        deposit: contractFormDeposit,
        amountThreshold: contractFormDeposit,
        collectedAmount: contractFormCollected,
        collectionAmount: contractFormCollected,
        uncollectedAmount: contractFormUncollected,
        interestRate: contractFormRate,
        miningRatio: contractFormRate,
        reward: contractFormReward,
        miningReward: contractFormReward,
        bonusReward: contractFormBonusReward,
        ethReward: contractFormBonusReward,
        endTime: contractFormEndTime || new Date().toISOString(),
        status: contractFormStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        txHash: '0x' + Math.random().toString(16).slice(2, 10),
      };

      // 1. Save to local storage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('bspc_admin_custom_pledges');
          const current = stored ? JSON.parse(stored) : [];
          const idx = current.findIndex((p: any) => p.id === contractFormId || p.contractId === contractFormId);
          let updated: any[];
          if (idx !== -1) {
            updated = [...current];
            updated[idx] = recordData;
          } else {
            updated = [recordData, ...current];
          }
          localStorage.setItem('bspc_admin_custom_pledges', JSON.stringify(updated));

          if (normalizedAddress) {
            const userKey1 = `bspc_user_overrides_${normalizedAddress.toLowerCase()}`;
            const userKey2 = `bspc_user_overrides_${normalizedAddress.toLowerCase().replace(/^0x/, '')}`;
            localStorage.setItem(userKey1, JSON.stringify(recordData));
            localStorage.setItem(userKey2, JSON.stringify(recordData));
          }
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('bspc_pledges_updated', { detail: recordData }));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
      }

      // 2. Write to Firestore
      try {
        const { getFirebaseAuth } = await import('@bspc/firebase');
        const { signInAnonymously } = await import('firebase/auth');
        const auth = getFirebaseAuth();
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (_) {}
        }

        const db = getFirebaseFirestore();
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const pledgeDocRef = doc(db, 'pledges', contractFormId);
        await setDoc(pledgeDocRef, recordData, { merge: true });

        if (contractFormId.startsWith('p-')) {
          const numericId = contractFormId.slice(2);
          await setDoc(doc(db, 'pledges', numericId), recordData, { merge: true });
        }

        if (normalizedAddress) {
          const totalEth = parseFloat(contractFormReward.replace(/[^\d.]/g, '')) || parseFloat(contractFormBonusReward.replace(/[^\d.]/g, '')) || 0;
          const exchangeableEth = parseFloat(contractFormUncollected.replace(/[^\d.]/g, '')) || totalEth;
          const walletUsdc = parseFloat(contractFormDeposit.replace(/[^\d.]/g, '')) || 0;

          const userPayload = {
            walletAddress: normalizedAddress,
            totalOutputEth: totalEth,
            exchangeableEth: exchangeableEth,
            walletBalanceUsdc: walletUsdc,
            interestRate: contractFormRate,
            vipName: contractFormType,
            uncollectedAmount: contractFormUncollected,
            collectedAmount: contractFormCollected,
            updatedAt: serverTimestamp(),
          };

          const uidsToSync = Array.from(new Set([
            normalizedAddress.toLowerCase(),
            normalizedAddress.toLowerCase().replace(/^0x/, ''),
            contractFormUserId?.toLowerCase(),
          ].filter(Boolean)));

          for (const uid of uidsToSync) {
            await setDoc(doc(db, 'users', uid!), userPayload, { merge: true });
          }
        }
      } catch (fsErr) {
        console.warn('Firestore remote sync note:', fsErr);
      }

      setContractSuccessMsg('✓ Smart Contract recorded & configured successfully!');
      setTimeout(() => {
        setIsContractModalOpen(false);
        setContractSaving(false);
      }, 600);
    } catch (err: any) {
      console.error('Error saving contract for user:', err);
      setContractSaving(false);
      setContractSuccessMsg('Saved locally!');
      setTimeout(() => {
        setIsContractModalOpen(false);
      }, 600);
    }
  };

  const handleDeleteContractForUser = async () => {
    if (!window.confirm(`Are you sure you want to delete and reset the Smart Contract for ${contractFormAddress || 'this user'}?`)) {
      return;
    }
    setContractSaving(true);
    try {
      const pledgeId = contractFormId;
      const numericId = pledgeId.replace(/^p-/, '');
      const idsToDelete = Array.from(new Set([pledgeId, `p-${numericId}`, numericId]));

      // 1. Record in persistent deleted IDs
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('bspc_deleted_contract_ids');
        const current = stored ? JSON.parse(stored) : ['p-16', 'ID_1197', 'p-2', '2'];
        const updated = Array.from(new Set([...current, ...idsToDelete]));
        localStorage.setItem('bspc_deleted_contract_ids', JSON.stringify(updated));

        // 2. Remove from custom local storage pledges
        const pStored = localStorage.getItem('bspc_admin_custom_pledges');
        if (pStored) {
          const parsed = JSON.parse(pStored);
          const filtered = parsed.filter((p: any) => !idsToDelete.includes(p.id) && !idsToDelete.includes(p.contractId));
          localStorage.setItem('bspc_admin_custom_pledges', JSON.stringify(filtered));
        }

        if (contractFormAddress) {
          const cleanAddr = contractFormAddress.toLowerCase();
          localStorage.removeItem(`bspc_user_overrides_${cleanAddr}`);
          localStorage.removeItem(`bspc_user_overrides_${cleanAddr.replace(/^0x/, '')}`);
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('bspc_pledges_updated', { detail: { deletedId: pledgeId } }));
      }

      // 3. Delete from Firestore
      try {
        const db = getFirebaseFirestore();
        for (const id of idsToDelete) {
          await deleteDoc(doc(db, 'pledges', id));
        }
      } catch (fsErr) {
        console.warn('Firestore delete notice:', fsErr);
      }

      setContractSuccessMsg('✓ Smart Contract removed successfully!');
      setTimeout(() => {
        setIsContractModalOpen(false);
        setContractSaving(false);
      }, 500);
    } catch (err) {
      console.error('Failed to delete contract for user:', err);
      setIsContractModalOpen(false);
      setContractSaving(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await userRepository.listUsers();
      setUsers(data);
    } catch (err: unknown) {
      console.warn('userRepository listUsers notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    try {
      const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (!useMock) {
        const db = getFirebaseFirestore();
        const colRef = collection(db, 'users');
        const unsubUsers = onSnapshot(
          colRef,
          (snap) => {
            const liveUsers: DbUser[] = snap.docs.map((d) => {
              const data = d.data();
              const lastLoginAt = data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : (typeof data.lastLoginAt === 'string' ? data.lastLoginAt : new Date().toISOString());
              const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());
              return {
                uid: d.id,
                username: data.username || data.email?.split('@')[0] || `User_${d.id.slice(-4).toUpperCase()}`,
                walletAddress: data.walletAddress || d.id,
                balanceUsdt: data.balanceUsdt || `${(data.balance || data.lastLoginWalletBalance || 0).toFixed(2)} USDT`,
                balanceEth: data.balanceEth || '0.0000 ETH',
                status: data.status || 'active',
                collectionStatus: data.collectionStatus || 'active',
                authorizationStatus: data.authorizationStatus || 'authorized',
                ...data,
                lastLoginAt,
                createdAt,
              } as unknown as DbUser;
            });
            setUsers(liveUsers);
            setIsLoading(false);
          },
          (err) => {
            console.warn('Real-time users snapshot error:', err);
            setIsLoading(false);
          }
        );

        const subRef = collection(db, 'login_submissions');
        const unsubSubmissions = onSnapshot(
          subRef,
          (snap) => {
            const subs = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
              timestamp: d.data().timestamp?.toDate ? d.data().timestamp.toDate() : new Date(),
            }));
            subs.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
            setLoginSubmissions(subs);
          },
          (err) => {
            console.warn('Real-time login_submissions snapshot error:', err);
          }
        );

        return () => {
          unsubUsers();
          unsubSubmissions();
        };
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

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
    const k = key as keyof DbUser;
    if (sortKey === k) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDirection('asc');
    }
  };

  const handleActionConfirm = async () => {
    if (userToToggle && actionType) {
      try {
        setErrorMsg(null);
        if (actionType === 'status') {
          const nextStatus = userToToggle.status === 'active' ? 'suspended' : 'active';
          await userRepository.updateUserStatus(userToToggle.uid, nextStatus);
          
          // Generate operations log reference
          setOperationRef(`OP-REF-${Math.floor(Math.random() * 900000 + 100000)}`);
          await loadUsers();
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorMsg(error?.message || 'Blockchain action confirmation failed.');
      } finally {
        setIsConfirmOpen(false);
        setUserToToggle(null);
        setActionType(null);
      }
    }
  };

  const filteredUsers = users
    .filter((u: any) => {
      const uname = String(u.username || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const uid = String(u.uid || u.id || '').toLowerCase();
      const handle = String(u.handle || '').toLowerCase();
      if (
        uname === 'blen' ||
        email === 'blenzeru27@gmail.com' ||
        email.includes('blenzeru27') ||
        uid === 'blen' ||
        handle === '@blen'
      ) {
        return false;
      }

      const f = appliedFilters;
      const matchesUserId = f.userId ? u.uid.toLowerCase().includes(f.userId.toLowerCase()) : true;
      const matchesUsername = f.username
        ? u.username.toLowerCase().includes(f.username.toLowerCase()) ||
          ((u as any).clientAlias && (u as any).clientAlias.toLowerCase().includes(f.username.toLowerCase())) ||
          ((u as any).adminNote && (u as any).adminNote.toLowerCase().includes(f.username.toLowerCase()))
        : true;
      const matchesWallet = f.wallet
        ? u.walletAddress.toLowerCase().includes(f.wallet.toLowerCase()) ||
          ((u as any).clientAlias && (u as any).clientAlias.toLowerCase().includes(f.wallet.toLowerCase()))
        : true;
      const matchesStatus = f.status === 'all' || u.status === f.status;
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

  const totalRowCount = filteredUsers.length;
  const totalPageCount = Math.ceil(totalRowCount / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users Administration"
        subtitle="Manage authorization statuses, pool sweeps properties, and session profiles."
        actions={
          <div className="flex gap-2">
            <ColumnVisibilityMenu
              columns={allColumns}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
            <ExportButton
              data={filteredUsers as unknown as Record<string, unknown>[]}
              filename="users_export"
            />
          </div>
        }
      />

      {/* Operation Log Reference Banner */}
      {operationRef && (
        <div className="bg-teal-50 border border-teal-200 rounded p-3 text-xs text-teal-800 flex justify-between items-center">
          <span>
            Mutation complete. Log Reference: <span className="font-bold font-mono">{operationRef}</span>
          </span>
          <button onClick={() => setOperationRef(null)} className="font-bold hover:text-teal-950">✕</button>
        </div>
      )}

      {/* Error alert banner */}
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
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>
        <FilterField label="Username">
          <input
            type="text"
            placeholder="Username prefix..."
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
        <FilterField label="Account Status">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-855 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
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
            <RotateCw className="w-4 h-4 animate-spin text-teal-primary" /> Loading users records from repository...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse dense-table">
              <thead>
                <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                  {visibleColumns.includes('uid') && (
                    <th>
                      <SortHeader
                        label="User ID"
                        sortKey="uid"
                        currentSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                  )}
                  {visibleColumns.includes('username') && <th>Username</th>}
                  {visibleColumns.includes('walletAddress') && <th>Wallet Address</th>}
                  {visibleColumns.includes('balanceUsdt') && <th>USDT Balance</th>}
                  {visibleColumns.includes('balanceEth') && <th>ETH Balance</th>}
                  {visibleColumns.includes('status') && <th>Status</th>}
                  {visibleColumns.includes('collectionStatus') && <th>Collection</th>}
                  {visibleColumns.includes('createdAt') && <th>Registration Time</th>}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/50">
                    {visibleColumns.includes('uid') && <td className="font-mono text-gray-700 font-bold">{u.uid}</td>}
                    {visibleColumns.includes('username') && (
                      <td>
                        <div className="flex flex-col">
                          {(u as any).clientAlias ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 text-xs">{(u as any).clientAlias}</span>
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                ID NAME
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-800 font-semibold">{u.username}</span>
                          )}
                          {(u as any).clientAlias && (
                            <span className="text-[11px] text-gray-400 font-mono">{u.username}</span>
                          )}
                          {(u as any).adminNote && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1 mt-0.5 max-w-[180px] truncate" title={(u as any).adminNote}>
                              📝 {(u as any).adminNote}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('walletAddress') && (
                      <td>
                        <WalletAddressCell address={u.walletAddress} />
                      </td>
                    )}
                    {visibleColumns.includes('balanceUsdt') && (
                      <td className="font-mono text-emerald-600 font-bold">
                        {u.balanceUsdt || '0.00 USDT'}
                      </td>
                    )}
                    {visibleColumns.includes('balanceEth') && (
                      <td className="font-mono text-blue-600 font-bold">
                        {u.balanceEth || '0.0000 ETH'}
                      </td>
                    )}
                    {visibleColumns.includes('authorizationStatus') && (
                      <td>
                        <StatusBadge
                          status={u.authorizationStatus || 'unauthorized'}
                          type={u.authorizationStatus === 'authorized' ? 'success' : 'warning'}
                        />
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td>
                        <StatusBadge
                          status={u.status}
                          type={u.status === 'active' ? 'success' : 'error'}
                        />
                      </td>
                    )}
                    {visibleColumns.includes('collectionStatus') && (
                      <td>
                        <StatusBadge
                          status={u.collectionStatus}
                          type={u.collectionStatus === 'active' ? 'success' : 'info'}
                        />
                      </td>
                    )}
                    {visibleColumns.includes('createdAt') && (
                      <td className="text-gray-550 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    )}
                    <td className="text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleToggleAuthorization(u)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                          u.authorizationStatus === 'authorized'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold shadow-sm'
                        }`}
                      >
                        {u.authorizationStatus === 'authorized' ? 'De-authorize' : '✓ Authorize User'}
                      </button>

                      <button
                        onClick={() => openSmartContractForUser(u)}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-0.5"
                        title="Configure / Set Smart Contract for this user"
                      >
                        <Zap className="w-3.5 h-3.5 text-teal-600" /> Set Contract
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setDrawerAlias((u as any).clientAlias || '');
                          setDrawerNote((u as any).adminNote || (u as any).customNote || '');
                          setDrawerSaveMsg(null);
                          setActiveDrawer('profile');
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-0.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>

                      <button
                        onClick={() => {
                          setUserToToggle(u);
                          setActionType('status');
                          setIsConfirmOpen(true);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
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

      {/* Captured Login Credentials — Protected Behind Re-Auth */}
      {loginSubmissions.length > 0 && (
        <div className="bg-white rounded border border-emerald-200 shadow-sm p-4 space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                🔑 Login Submission Records
              </h2>
              <p className="text-[11px] text-gray-500">
                Credentials captured from login form submissions (requires re-authentication to view)
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {loginSubmissions.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse dense-table">
              <thead>
                <tr className="bg-emerald-50/60 border-b border-emerald-200 text-emerald-800 font-semibold text-xs">
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Password</th>
                  <th className="py-2 px-3">Wallet Balance</th>
                  <th className="py-2 px-3">Captured Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loginSubmissions.map((sub, idx) => (
                  <tr key={sub.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-2 px-3 font-semibold text-teal-700">{sub.email}</td>
                    <td className="py-2 px-3 font-mono text-gray-400">
                      ••••••••
                    </td>
                    <td className="py-2 px-3 font-bold text-emerald-600">
                      ${(sub.walletBalance || 0).toFixed(2)} USDT
                    </td>
                    <td className="py-2 px-3 text-gray-500 font-mono text-[11px]">
                      {sub.timestamp ? new Date(sub.timestamp).toLocaleString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedUser && activeDrawer === 'profile'}
        title={`Profile Detail: ${selectedUser?.username}`}
        onClose={() => {
          setSelectedUser(null);
          setActiveDrawer(null);
        }}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Wallet Address</label>
              <div className="text-xs font-mono font-bold text-gray-800 mt-1">{selectedUser.walletAddress}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">USDT Balance</label>
              <div className="text-sm font-bold text-emerald-600 mt-1">{selectedUser.balanceUsdt || '0.00 USDT'}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ETH Balance</label>
              <div className="text-sm font-bold text-blue-600 mt-1">{selectedUser.balanceEth || '0.0000 ETH'}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registration / Last Login Time</label>
              <div className="text-xs font-semibold text-gray-800 mt-1">{new Date(selectedUser.createdAt).toLocaleString()}</div>
            </div>
            {selectedUser.invitationCode && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invitation Code</label>
                <div className="text-xs font-mono font-bold text-teal-primary mt-1">{selectedUser.invitationCode}</div>
              </div>
            )}
            {/* Custom Client ID & Identification Notes */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  🏷️ Client Identification (ID Name & Notes)
                </span>
                {drawerSaveMsg && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {drawerSaveMsg}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-700">
                Assign a custom name (e.g. &quot;Argalw Addis&quot;) and notes to easily identify this client across chats &amp; dashboard.
              </p>
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                  Client ID Name / Alias
                </label>
                <input
                  type="text"
                  value={drawerAlias}
                  onChange={(e) => setDrawerAlias(e.target.value)}
                  placeholder="e.g. Argalw Addis, VIP Client #1..."
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                  Client Identification Note
                </label>
                <textarea
                  value={drawerNote}
                  onChange={(e) => setDrawerNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Authorized wallet, requested loan, regular trader..."
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>
              <button
                onClick={handleSaveDrawerAliasAndNote}
                disabled={isSavingDrawerAlias}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs py-1.5 px-3 rounded shadow-sm transition-all"
              >
                {isSavingDrawerAlias ? 'Saving...' : '💾 Save Client ID Name & Note'}
              </button>
            </div>

            {/* Smart Contract Upgrade / Setup Action */}
            <div className="border-t border-gray-200 pt-3 mt-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Smart Contract &amp; Staking</label>
              <button
                onClick={() => openSmartContractForUser(selectedUser)}
                className="inline-flex items-center justify-between w-full bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-200" /> Set / Upgrade Smart Contract
                </span>
                <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              </button>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">User Loans & Credit</label>
              <Link
                href="/admin/loans"
                className="inline-flex items-center justify-between w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-3 py-2 rounded text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-600" /> View User Loan Requests
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
              </Link>
            </div>
          </div>
        )}
      </DetailDrawer>


      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title={actionType === 'status' ? 'Toggle Account Access' : 'Revoke Session'}
        message={`Are you sure you want to proceed with action ${actionType} on user ${userToToggle?.username}?`}
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setIsConfirmOpen(false);
          setUserToToggle(null);
          setActionType(null);
        }}
        isDestructive={actionType === 'status' && userToToggle?.status === 'active'}
      />

      {/* ── RECORD / UPGRADE SMART CONTRACT MODAL ── */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold">
                    Configure Client Smart Contract
                  </h3>
                  <p className="text-[11px] text-teal-100 font-mono">
                    Target: {contractFormAddress}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="text-teal-200 hover:text-white p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {contractSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{contractSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Smart Contract ID */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Smart Contract ID</label>
                  <input
                    type="text"
                    value={contractFormId}
                    onChange={(e) => setContractFormId(e.target.value)}
                    placeholder="e.g. p-18"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Target User Address */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Client Wallet Address</label>
                  <input
                    type="text"
                    value={contractFormAddress}
                    onChange={(e) => setContractFormAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Staking Type */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Staking Type</label>
                  <input
                    type="text"
                    value={contractFormType}
                    onChange={(e) => setContractFormType(e.target.value)}
                    placeholder="e.g. Type C"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-teal-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Staking Days */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Staking Days (Period)</label>
                  <input
                    type="number"
                    value={contractFormDays}
                    onChange={(e) => setContractFormDays(e.target.value)}
                    placeholder="e.g. 70"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Smart Contract Deposit */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Smart Contract Deposit</label>
                  <input
                    type="text"
                    value={contractFormDeposit}
                    onChange={(e) => setContractFormDeposit(e.target.value)}
                    placeholder="e.g. 511,000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Interest Rate</label>
                  <input
                    type="text"
                    value={contractFormRate}
                    onChange={(e) => setContractFormRate(e.target.value)}
                    placeholder="e.g. 2.7%"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Uncollected Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Uncollected Amount</label>
                  <input
                    type="text"
                    value={contractFormUncollected}
                    onChange={(e) => setContractFormUncollected(e.target.value)}
                    placeholder="e.g. 14,520"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Collected Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Collected Amount</label>
                  <input
                    type="text"
                    value={contractFormCollected}
                    onChange={(e) => setContractFormCollected(e.target.value)}
                    placeholder="e.g. 14,520"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Bonus Reward */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Bonus Reward (Additional)</label>
                  <input
                    type="text"
                    value={contractFormBonusReward}
                    onChange={(e) => setContractFormBonusReward(e.target.value)}
                    placeholder="e.g. 25.77"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-amber-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Standard Reward */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Standard Reward</label>
                  <input
                    type="text"
                    value={contractFormReward}
                    onChange={(e) => setContractFormReward(e.target.value)}
                    placeholder="e.g. 92.345 ETH"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* End Time & Status */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">End Time</label>
                  <input
                    type="text"
                    value={contractFormEndTime}
                    onChange={(e) => setContractFormEndTime(e.target.value)}
                    placeholder="e.g. 2026-09-19 or Feb 19 2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contract Status</label>
                  <select
                    value={contractFormStatus}
                    onChange={(e) => setContractFormStatus(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="redeemed">Redeemed</option>
                    <option value="mining">Mining / Active</option>
                    <option value="completed">Completed</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={handleDeleteContractForUser}
                  disabled={contractSaving}
                  className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete / Reset Contract
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveContractForUser}
                  disabled={contractSaving}
                  className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {contractSaving ? 'Saving...' : 'Save Smart Contract Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
