'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, StatusBadge } from '../../../../components/ui/Reusables';
import { Headset, Send, ArrowLeft, UserCheck, Lock, ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getFirebaseFirestore, getFirebaseFunctions, getFirebaseAuth } from '@bspc/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface ThreadMessage {
  id: string;
  senderType: 'guest' | 'user' | 'agent' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

interface ConvDetails {
  conversationId: string;
  guestLabel: string;
  guestId: string;
  source: string;
  status: 'waiting' | 'assigned' | 'active' | 'closed' | 'blocked';
  assignedAgentUid?: string;
  subject?: string;
  createdAtTime?: string;
}

export default function CustomerServiceThreadPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [convDetails, setConvDetails] = useState<ConvDetails | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [notesList, setNotesList] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock || !conversationId) {
      setConvDetails({
        conversationId: 'conv-8921',
        guestLabel: 'Guest 4821',
        guestId: 'guest-mock',
        source: 'receive_voucher',
        status: 'active',
        assignedAgentUid: 'Support Agent Alpha',
        subject: 'Voucher Request',
        createdAtTime: 'Today 10:15 AM',
      });
      setMessages([
        {
          id: 'm1',
          senderType: 'system',
          senderName: 'System',
          text: 'Conversation initiated via Receive Voucher prompt.',
          timestamp: '10:15 AM',
        },
        {
          id: 'm2',
          senderType: 'guest',
          senderName: 'Guest 4821',
          text: 'Hello. I would like to inquire about the voucher eligibility for node staking.',
          timestamp: '10:16 AM',
        },
      ]);
      setNotesList(['Verified IP source Singapore. No abusive logs.']);
      return;
    }

    try {
      const db = getFirebaseFirestore();

      // 1. Clear agent unread counter when viewing
      const convDocRef = doc(db, 'chatConversations', conversationId);
      updateDoc(convDocRef, { agentUnreadCount: 0 }).catch(() => {});

      // 2. Listen to conversation metadata
      const unsubConv = onSnapshot(convDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setConvDetails({
            conversationId: snap.id,
            guestLabel: data.guestLabel || `Guest ${data.guestId?.slice(-4) || ''}`,
            guestId: data.guestId || '',
            source: data.source || 'general_support',
            status: data.status || 'waiting',
            assignedAgentUid: data.assignedAgentUid || 'Unassigned',
            subject: data.subject || 'Support Request',
            createdAtTime: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : 'Recently',
          });
        }
      });

      // 3. Listen to messages (realtime onSnapshot)
      const msgsRef = collection(db, 'chatConversations', conversationId, 'messages');
      const qMsgs = query(msgsRef, orderBy('createdAt', 'asc'), limit(100));
      const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
        const list: ThreadMessage[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            senderType: data.senderType || 'guest',
            senderName: data.senderType === 'agent' ? 'Agent Support' : data.senderType === 'system' ? 'System' : data.senderUid?.slice(-4).toUpperCase() ? `Guest ${data.senderUid?.slice(-4).toUpperCase()}` : 'Guest',
            text: data.text || '',
            timestamp: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
          });
        });
        setMessages(list);
      });

      // 4. Listen to internal notes
      const notesRef = collection(db, 'chatConversations', conversationId, 'internalNotes');
      const qNotes = query(notesRef, orderBy('createdAt', 'asc'));
      const unsubNotes = onSnapshot(qNotes, (snapshot) => {
        const list: string[] = [];
        snapshot.forEach((d) => {
          list.push(d.data().text || '');
        });
        setNotesList(list);
      });

      return () => {
        unsubConv();
        unsubMsgs();
        unsubNotes();
      };
    } catch (e) {
      console.error('Failed to setup thread subscription:', e);
    }
  }, [conversationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    if (!conversationId) return;

    const now = Date.now();
    if (now - lastTypingTimeRef.current > 3000) {
      lastTypingTimeRef.current = now;
      const db = getFirebaseFirestore();
      const convDocRef = doc(db, 'chatConversations', conversationId);
      updateDoc(convDocRef, { agentTyping: true }).catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        updateDoc(convDocRef, { agentTyping: false }).catch(() => {});
      }, 5000);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = replyText.trim();
    if (!cleanText) return;

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          senderType: 'agent',
          senderName: 'Current Support Agent',
          text: cleanText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setReplyText('');
      return;
    }

    setReplyText('');
    setErrorMessage(null);

    // Cancel typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const db = getFirebaseFirestore();
    const convDocRef = doc(db, 'chatConversations', conversationId);
    updateDoc(convDocRef, { agentTyping: false }).catch(() => {});

    try {
      const functions = getFirebaseFunctions();
      const sendMsgFn = httpsCallable<{ conversationId: string; text: string; messageType: string }, { messageId: string }>(
        functions,
        'sendAgentMessage'
      );
      await sendMsgFn({
        conversationId,
        text: cleanText,
        messageType: 'text',
      });
    } catch (err: any) {
      console.error('Failed to send agent reply:', err);
      setErrorMessage(err.message || 'Failed to send reply.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNote = internalNote.trim();
    if (!cleanNote) return;

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setNotesList((prev) => [...prev, cleanNote]);
      setInternalNote('');
      return;
    }

    setInternalNote('');
    try {
      const db = getFirebaseFirestore();
      const notesRef = collection(db, 'chatConversations', conversationId, 'internalNotes');
      await addDoc(notesRef, {
        text: cleanNote,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Failed to add internal note:', err);
      setErrorMessage('Failed to add internal note.');
    }
  };

  const handleCloseConversation = async () => {
    if (!conversationId) return;
    try {
      const functions = getFirebaseFunctions();
      const closeFn = httpsCallable<{ conversationId: string; resolutionNote?: string }, { success: boolean }>(
        functions,
        'closeSupportConversation'
      );
      await closeFn({ conversationId, resolutionNote: 'Support agent marked this thread resolved.' });
    } catch (err: any) {
      console.error('Failed to close conversation:', err);
      setErrorMessage('Failed to close conversation.');
    }
  };

  const handleBlockUser = async () => {
    if (!conversationId) return;
    try {
      const functions = getFirebaseFunctions();
      const blockFn = httpsCallable<{ conversationId: string; reason?: string }, { success: boolean }>(
        functions,
        'blockSupportUser'
      );
      await blockFn({ conversationId, reason: 'Abusive support interaction.' });
    } catch (err: any) {
      console.error('Failed to block user:', err);
      setErrorMessage('Failed to block user.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/admin/customer-service" className="inline-flex items-center gap-1 text-teal-600 font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
          {errorMessage}
        </div>
      )}

      <PageHeader
        title={`Support Conversation: ${conversationId}`}
        subtitle={`Live agent thread communication with ${convDetails?.guestLabel || 'Guest'}`}
        actions={
          <div className="flex items-center gap-2">
            {convDetails && <StatusBadge status={convDetails.status} />}
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
              {convDetails?.subject || 'Voucher Request'}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Main Chat Thread (2 cols) */}
        <div className="col-span-2 bg-white rounded border border-gray-200 shadow-sm flex flex-col h-[520px]">
          {/* Thread Header */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              <Headset className="w-4 h-4 text-amber-600" /> Live Chat Thread
            </div>
            <div className="text-[11px] text-gray-500 font-mono">Assigned: {convDetails?.assignedAgentUid || 'Unassigned'}</div>
          </div>

          {/* Thread Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.map((m) => {
              const isAgent = m.senderType === 'agent';
              const isSystem = m.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={m.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 text-center font-mono">
                    {m.text}
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                  <div className="text-[10px] font-bold text-gray-500 mb-0.5">{m.senderName}</div>
                  <div
                    className={`max-w-[75%] p-3 rounded-lg text-xs leading-relaxed ${
                      isAgent
                        ? 'bg-teal-primary text-white font-medium rounded-tr-none shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono mt-0.5">{m.timestamp}</div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder="Type official support reply..."
              value={replyText}
              onChange={handleInputChange}
              disabled={convDetails?.status === 'closed' || convDetails?.status === 'blocked'}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-primary disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || convDetails?.status === 'closed' || convDetails?.status === 'blocked'}
              className="bg-teal-primary hover:bg-teal-hover disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded inline-flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send Reply
            </button>
          </form>
        </div>

        {/* Sidebar Info & Notes (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded border border-gray-200 p-4 space-y-3 shadow-sm text-xs">
            <div className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" /> Guest Details
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-gray-600">
              <div><span className="text-gray-400">Guest ID:</span> {convDetails?.guestLabel || 'Guest'}</div>
              <div><span className="text-gray-400">UID:</span> {convDetails?.guestId?.slice(0, 16)}...</div>
              <div><span className="text-gray-400">Source:</span> {convDetails?.source}</div>
              <div><span className="text-gray-400">Created:</span> {convDetails?.createdAtTime}</div>
            </div>
            {convDetails?.status !== 'closed' && convDetails?.status !== 'blocked' && (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleCloseConversation}
                  className="w-full flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold py-1.5 rounded transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                </button>
                <button
                  onClick={handleBlockUser}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-1.5 rounded transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Block Support User
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded border border-gray-200 p-4 space-y-3 shadow-sm text-xs">
            <div className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" /> Internal Notes (Audited)
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notesList.map((note, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 text-[11px] text-gray-700">
                  {note}
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="Add internal note..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] py-1 rounded transition-colors"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

