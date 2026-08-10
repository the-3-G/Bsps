'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, StatusBadge } from '../../../components/ui/Reusables';
import { FilterBar, FilterField, TablePagination, ExportButton } from '../../../components/ui/DataTable';
import { MessageSquare, Headset, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getFirebaseFirestore, getFirebaseFunctions, getFirebaseAuth } from '@bspc/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface MockConversation {
  conversationId: string;
  guestLabel: string;
  source: 'receive_voucher' | 'floating_chat' | 'side_menu' | 'general_support';
  status: 'waiting' | 'assigned' | 'active' | 'closed' | 'blocked';
  assignedAgent: string;
  lastMessage: string;
  lastMessageTime: string;
  userUnread: number;
}

const mockConversationsData: MockConversation[] = [
  {
    conversationId: 'conv-8921',
    guestLabel: 'Guest 4821',
    source: 'receive_voucher',
    status: 'waiting',
    assignedAgent: 'Unassigned',
    lastMessage: 'Hello. Please tell us how we can assist you with your voucher.',
    lastMessageTime: '10 mins ago',
    userUnread: 0,
  },
  {
    conversationId: 'conv-4309',
    guestLabel: 'Guest 9102',
    source: 'receive_voucher',
    status: 'assigned',
    assignedAgent: 'Support Agent Alpha',
    lastMessage: 'How do I claim the 500 USDT node voucher?',
    lastMessageTime: '25 mins ago',
    userUnread: 1,
  },
  {
    conversationId: 'conv-1102',
    guestLabel: 'Guest 3319',
    source: 'floating_chat',
    status: 'active',
    assignedAgent: 'Support Agent Bravo',
    lastMessage: 'Thank you! The voucher allocation is active.',
    lastMessageTime: '1 hour ago',
    userUnread: 0,
  },
  {
    conversationId: 'conv-0912',
    guestLabel: 'Guest 7721',
    source: 'general_support',
    status: 'closed',
    assignedAgent: 'Support Agent Alpha',
    lastMessage: 'Conversation closed by support.',
    lastMessageTime: '2 hours ago',
    userUnread: 0,
  },
];

export default function CustomerServiceAdminPage() {
  const [conversations, setConversations] = useState<MockConversation[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setConversations(mockConversationsData);
      return;
    }

    try {
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'chatConversations');
      const q = query(colRef, orderBy('updatedAt', 'desc'), limit(100));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: MockConversation[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            conversationId: d.id,
            guestLabel: data.guestLabel || `Guest ${data.guestId?.slice(-4) || ''}`,
            source: data.source || 'general_support',
            status: data.status || 'waiting',
            assignedAgent: data.assignedAgentUid || 'Unassigned',
            lastMessage: data.lastMessagePreview || '',
            lastMessageTime: data.lastMessageAt?.toDate
              ? data.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            userUnread: data.agentUnreadCount ? 1 : 0,
          });
        });
        setConversations(list);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Failed to setup firestore listener:', e);
    }
  }, []);

  const filtered = conversations.filter((c) => {
    const matchesSearch = searchFilter
      ? c.conversationId.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.guestLabel.toLowerCase().includes(searchFilter.toLowerCase())
      : true;
    const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignToMe = async (id: string) => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === id ? { ...c, status: 'assigned', assignedAgent: 'Current Support Agent' } : c
        )
      );
      return;
    }

    const isSparkUat = process.env.NEXT_PUBLIC_SPARK_UAT_MODE === 'true';
    const db = getFirebaseFirestore();
    const auth = getFirebaseAuth();
    const agentUid = auth.currentUser?.uid || 'support-agent';

    if (isSparkUat) {
      try {
        await updateDoc(doc(db, 'chatConversations', id), {
          assignedAgentUid: agentUid,
          status: 'assigned',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Direct Firestore assign failed:', err);
      }
      return;
    }

    try {
      const functions = getFirebaseFunctions();
      const assignFn = httpsCallable<{ conversationId: string }, { success: boolean }>(
        functions,
        'assignSupportAgent'
      );
      await assignFn({ conversationId: id });
    } catch (err) {
      console.warn('Cloud Function assign unavailable. Falling back to direct Firestore:', err);
      try {
        await updateDoc(doc(db, 'chatConversations', id), {
          assignedAgentUid: agentUid,
          status: 'assigned',
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.error('Firestore fallback assign failed:', fsErr);
      }
    }
  };

  const handleClose = async (id: string) => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setConversations((prev) =>
        prev.map((c) => (c.conversationId === id ? { ...c, status: 'closed' } : c))
      );
      return;
    }

    const isSparkUat = process.env.NEXT_PUBLIC_SPARK_UAT_MODE === 'true';
    const db = getFirebaseFirestore();

    if (isSparkUat) {
      try {
        await updateDoc(doc(db, 'chatConversations', id), {
          status: 'closed',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Direct Firestore close failed:', err);
      }
      return;
    }

    try {
      const functions = getFirebaseFunctions();
      const closeFn = httpsCallable<{ conversationId: string; resolutionNote?: string }, { success: boolean }>(
        functions,
        'closeSupportConversation'
      );
      await closeFn({ conversationId: id, resolutionNote: 'Closed from admin queue.' });
    } catch (err) {
      console.warn('Cloud Function close unavailable. Falling back to direct Firestore:', err);
      try {
        await updateDoc(doc(db, 'chatConversations', id), {
          status: 'closed',
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.error('Firestore fallback close failed:', fsErr);
      }
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customer Service Operations"
        subtitle="Real-time support tickets, voucher inquiry queues, and active chat management."
        actions={
          <ExportButton data={filtered as unknown as Record<string, unknown>[]} filename="customer_service_tickets" />
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-200">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Waiting Queues</div>
            <div className="text-lg font-bold text-gray-900">
              {conversations.filter((c) => c.status === 'waiting').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Active Sessions</div>
            <div className="text-lg font-bold text-gray-900">
              {conversations.filter((c) => c.status === 'active' || c.status === 'assigned').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-green-50 rounded-lg text-green-600 border border-green-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Resolved Today</div>
            <div className="text-lg font-bold text-gray-900">
              {conversations.filter((c) => c.status === 'closed').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-lg text-red-600 border border-red-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Blocked Users</div>
            <div className="text-lg font-bold text-gray-900">
              {conversations.filter((c) => c.status === 'blocked').length}
            </div>
          </div>
        </div>
      </div>

      <FilterBar>
        <FilterField label="Search Guest / Conversation ID">
          <input
            type="text"
            placeholder="conv-..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          />
        </FilterField>

        <FilterField label="Status">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="assigned">Assigned</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="blocked">Blocked</option>
          </select>
        </FilterField>
      </FilterBar>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse dense-table text-xs">
          <thead>
            <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-500 font-semibold">
              <th>Conversation ID</th>
              <th>Guest Label</th>
              <th>Source</th>
              <th>Status</th>
              <th>Assigned Agent</th>
              <th>Last Message</th>
              <th>Time</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filtered.map((c) => (
              <tr key={c.conversationId} className="hover:bg-gray-50/80 transition-colors">
                <td className="font-mono font-bold text-gray-900">{c.conversationId}</td>
                <td className="font-semibold text-gray-800">{c.guestLabel}</td>
                <td>
                  <span className="bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded text-[10px] border border-gray-200">
                    {c.source}
                  </span>
                </td>
                <td>
                  <StatusBadge
                    status={
                      c.status === 'waiting'
                        ? 'pending'
                        : c.status === 'active' || c.status === 'assigned'
                        ? 'active'
                        : c.status === 'closed'
                        ? 'completed'
                        : 'suspended'
                    }
                  />
                </td>
                <td className="font-mono">{c.assignedAgent}</td>
                <td className="max-w-[220px] truncate text-gray-500">{c.lastMessage}</td>
                <td className="text-gray-400 text-[11px]">{c.lastMessageTime}</td>
                <td className="text-right space-x-1.5">
                  {c.status === 'waiting' && (
                    <button
                      onClick={() => handleAssignToMe(c.conversationId)}
                      className="bg-teal-primary hover:bg-teal-hover text-white text-[11px] font-bold px-2 py-1 rounded transition-colors"
                    >
                      Assign to Me
                    </button>
                  )}
                  {c.status !== 'closed' && (
                    <button
                      onClick={() => handleClose(c.conversationId)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-2 py-1 rounded transition-colors"
                    >
                      Close
                    </button>
                  )}
                  <Link
                    href={`/admin/customer-service/${c.conversationId}`}
                    className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded transition-colors"
                  >
                    Open Thread <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={1}
        totalPageCount={1}
        totalRowCount={filtered.length}
        rowsPerPage={10}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />
    </div>
  );
}
