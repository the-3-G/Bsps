import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, StatusBadge } from '../../../../components/ui/Reusables';
import { Headset, Send, ArrowLeft, UserCheck, Lock, ShieldAlert, CheckCircle, Copy, Check, Sparkles, Tag, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getFirebaseFirestore, getFirebaseFunctions, getFirebaseAuth } from '@bspc/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
  walletAddress?: string;
  clientAlias?: string;
  customNote?: string;
  source: string;
  status: 'waiting' | 'assigned' | 'active' | 'closed' | 'blocked';
  assignedAgentUid?: string;
  subject?: string;
  createdAtTime?: string;
}

export function ThreadClient() {
  const params = useParams();
  const conversationId = params?.conversationId as string;

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [convDetails, setConvDetails] = useState<ConvDetails | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [notesList, setNotesList] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client ID name and custom note states
  const [editingAlias, setEditingAlias] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  const [aliasSavedMsg, setAliasSavedMsg] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock || !conversationId) {
      setConvDetails({
        conversationId: 'conv-8921',
        guestLabel: 'User_4765 (0x16db...4765)',
        clientAlias: 'Argalw Addis',
        walletAddress: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765',
        customNote: 'VIP member requesting node voucher',
        guestId: 'guest-mock',
        source: 'receive_voucher',
        status: 'active',
        assignedAgentUid: 'Support Agent Alpha',
        subject: 'Voucher Request',
        createdAtTime: 'Today 10:15 AM',
      });
      setEditingAlias('Argalw Addis');
      setEditingNote('VIP member requesting node voucher');
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
          senderType: 'user',
          senderName: 'Argalw Addis',
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
          const walletAddr = data.walletAddress || (data.userUid?.startsWith('0x') ? data.userUid : '') || '';
          const alias = data.clientAlias || data.idName || '';
          const fallbackLabel = walletAddr ? `User_${walletAddr.slice(-4).toUpperCase()}` : (data.guestLabel || `Guest ${data.guestId?.slice(-4) || ''}`);

          setConvDetails({
            conversationId: snap.id,
            guestLabel: alias || fallbackLabel,
            clientAlias: alias,
            walletAddress: walletAddr,
            customNote: data.customNote || '',
            guestId: data.guestId || '',
            source: data.source || 'general_support',
            status: data.status || 'waiting',
            assignedAgentUid: data.assignedAgentUid || 'Unassigned',
            subject: data.subject || 'Support Request',
            createdAtTime: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : 'Recently',
          });
          if (alias) {
            setEditingAlias(alias);
          } else if (walletAddr) {
            setEditingAlias((prev) => prev || `User_${walletAddr.slice(-4).toUpperCase()}`);
          }
          if (data.customNote) {
            setEditingNote(data.customNote);
          }
        }
      });

      // 3. Listen to messages (realtime onSnapshot)
      const msgsRef = collection(db, 'chatConversations', conversationId, 'messages');
      const qMsgs = query(msgsRef, orderBy('createdAt', 'asc'), limit(100));
      const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
        const list: ThreadMessage[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          let sName = 'Guest';
          if (data.senderType === 'agent') {
            sName = 'Agent Support';
          } else if (data.senderType === 'system') {
            sName = 'System';
          } else if (data.senderName) {
            sName = data.senderName;
          } else if (data.senderWalletAddress || (data.senderUid && data.senderUid.startsWith('0x'))) {
            const w = data.senderWalletAddress || data.senderUid;
            sName = `User_${w.slice(-4).toUpperCase()}`;
          } else if (data.senderUid) {
            sName = `Guest ${data.senderUid.slice(-4).toUpperCase()}`;
          }

          list.push({
            id: d.id,
            senderType: data.senderType || 'guest',
            senderName: sName,
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

  const handleSaveClientAliasAndNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!conversationId) return;

    setIsSavingAlias(true);
    setAliasSavedMsg(null);

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setConvDetails((prev) =>
        prev
          ? {
              ...prev,
              clientAlias: editingAlias.trim(),
              guestLabel: editingAlias.trim() || prev.guestLabel,
              customNote: editingNote.trim(),
            }
          : null
      );
      setAliasSavedMsg('✓ Client ID & Note saved!');
      setIsSavingAlias(false);
      setTimeout(() => setAliasSavedMsg(null), 3500);
      return;
    }

    try {
      const db = getFirebaseFirestore();
      const convDocRef = doc(db, 'chatConversations', conversationId);
      const trimmedAlias = editingAlias.trim();
      const trimmedNote = editingNote.trim();

      const convUpdates: Record<string, any> = {
        clientAlias: trimmedAlias || null,
        guestLabel: trimmedAlias || (convDetails?.walletAddress ? `User_${convDetails.walletAddress.slice(-4).toUpperCase()}` : convDetails?.guestLabel || 'Guest'),
        customNote: trimmedNote || null,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(convDocRef, convUpdates);

      // If user has a wallet address, sync alias & note to their users doc as well
      const walletAddr = convDetails?.walletAddress;
      if (walletAddr) {
        const uid = walletAddr.toLowerCase();
        const userDocRef = doc(db, 'users', uid);
        await setDoc(
          userDocRef,
          {
            username: trimmedAlias || `User_${uid.slice(-4).toUpperCase()}`,
            clientAlias: trimmedAlias || null,
            adminNote: trimmedNote || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setAliasSavedMsg('✓ Client ID & Note saved!');
      setTimeout(() => setAliasSavedMsg(null), 3500);
    } catch (err) {
      console.error('Failed to save client alias/note:', err);
      setErrorMessage('Failed to save client ID note.');
    } finally {
      setIsSavingAlias(false);
    }
  };

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

    const isSparkUat = process.env.NEXT_PUBLIC_SPARK_UAT_MODE === 'true';
    if (isSparkUat) {
      try {
        const auth = getFirebaseAuth();
        const agentUid = auth.currentUser?.uid || 'support-agent';
        const msgsRef = collection(db, 'chatConversations', conversationId, 'messages');
        await addDoc(msgsRef, {
          senderType: 'agent',
          senderUid: agentUid,
          messageType: 'text',
          text: cleanText,
          createdAt: serverTimestamp(),
        });
        await updateDoc(convDocRef, {
          status: 'active',
          userUnreadCount: 1,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr: any) {
        console.error('Direct Firestore reply failed:', fsErr);
        setErrorMessage(fsErr?.message || 'Failed to send reply.');
      }
      return;
    }

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
      console.warn('Cloud Function reply unavailable. Falling back to direct Firestore:', err);
      try {
        const auth = getFirebaseAuth();
        const agentUid = auth.currentUser?.uid || 'support-agent';
        const msgsRef = collection(db, 'chatConversations', conversationId, 'messages');
        await addDoc(msgsRef, {
          senderType: 'agent',
          senderUid: agentUid,
          messageType: 'text',
          text: cleanText,
          createdAt: serverTimestamp(),
        });
        await updateDoc(convDocRef, {
          status: 'active',
          userUnreadCount: 1,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr: any) {
        console.error('Firestore fallback reply failed:', fsErr);
        setErrorMessage(fsErr?.message || 'Failed to send reply.');
      }
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
    const isSparkUat = process.env.NEXT_PUBLIC_SPARK_UAT_MODE === 'true';
    const db = getFirebaseFirestore();
    const convDocRef = doc(db, 'chatConversations', conversationId);

    if (isSparkUat) {
      try {
        await updateDoc(convDocRef, { status: 'closed', updatedAt: serverTimestamp() });
      } catch (fsErr) {
        console.error('Direct Firestore close failed:', fsErr);
        setErrorMessage('Failed to close conversation.');
      }
      return;
    }

    try {
      const functions = getFirebaseFunctions();
      const closeFn = httpsCallable<{ conversationId: string; resolutionNote?: string }, { success: boolean }>(
        functions,
        'closeSupportConversation'
      );
      await closeFn({ conversationId, resolutionNote: 'Support agent marked this thread resolved.' });
    } catch (err: any) {
      console.warn('Cloud Function close unavailable. Falling back to direct Firestore:', err);
      try {
        await updateDoc(convDocRef, { status: 'closed', updatedAt: serverTimestamp() });
      } catch (fsErr) {
        console.error('Firestore fallback close failed:', fsErr);
        setErrorMessage('Failed to close conversation.');
      }
    }
  };

  const handleBlockUser = async () => {
    if (!conversationId) return;
    const isSparkUat = process.env.NEXT_PUBLIC_SPARK_UAT_MODE === 'true';
    const db = getFirebaseFirestore();
    const convDocRef = doc(db, 'chatConversations', conversationId);

    if (isSparkUat) {
      try {
        await updateDoc(convDocRef, { status: 'blocked', updatedAt: serverTimestamp() });
      } catch (fsErr) {
        console.error('Direct Firestore block failed:', fsErr);
        setErrorMessage('Failed to block user.');
      }
      return;
    }

    try {
      const functions = getFirebaseFunctions();
      const blockFn = httpsCallable<{ conversationId: string; reason?: string }, { success: boolean }>(
        functions,
        'blockSupportUser'
      );
      await blockFn({ conversationId, reason: 'Abusive support interaction.' });
    } catch (err: any) {
      console.warn('Cloud Function block unavailable. Falling back to direct Firestore:', err);
      try {
        await updateDoc(convDocRef, { status: 'blocked', updatedAt: serverTimestamp() });
      } catch (fsErr) {
        console.error('Firestore fallback block failed:', fsErr);
        setErrorMessage('Failed to block user.');
      }
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
              disabled={convDetails?.status === 'blocked'}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-primary disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || convDetails?.status === 'blocked'}
              className="bg-teal-primary hover:bg-teal-hover disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded inline-flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send Reply
            </button>
          </form>
        </div>

        {/* Sidebar Info & Notes (1 col) */}
        <div className="space-y-4">
          {/* Client Identity & Identification Note Box */}
          <div className="bg-white rounded border border-gray-200 p-4 space-y-3 shadow-sm text-xs">
            <div className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" /> Client Identity & Identification
              </div>
              {convDetails?.clientAlias && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300">
                  Identified
                </span>
              )}
            </div>

            {aliasSavedMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] rounded font-semibold text-center">
                {aliasSavedMsg}
              </div>
            )}

            {/* Wallet Address Display */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Connected Wallet Address
              </label>
              {convDetails?.walletAddress ? (
                <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-800">
                  <span className="truncate mr-1 font-bold text-teal-800" title={convDetails.walletAddress}>
                    {convDetails.walletAddress}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (convDetails.walletAddress) {
                          navigator.clipboard.writeText(convDetails.walletAddress);
                          setCopiedWallet(true);
                          setTimeout(() => setCopiedWallet(false), 2000);
                        }
                      }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                      title="Copy Address"
                    >
                      {copiedWallet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <Link
                      href={`/admin/users?wallet=${convDetails.walletAddress}`}
                      className="text-[10px] bg-teal-600 hover:bg-teal-700 text-white font-sans font-bold px-2 py-0.5 rounded transition-colors"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 border border-dashed border-gray-200 rounded text-[11px] text-gray-500 italic">
                  Guest session (No wallet connected yet)
                </div>
              )}
            </div>

            {/* Custom Client ID Name / Alias Input */}
            <form onSubmit={handleSaveClientAliasAndNote} className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3 text-amber-600" /> Client ID Name / Alias
                </label>
                <input
                  type="text"
                  placeholder="e.g. Argalw Addis, VIP Client #1..."
                  value={editingAlias}
                  onChange={(e) => setEditingAlias(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Give an ID name to recognize this client across support and user records.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <StickyNote className="w-3 h-3 text-teal-600" /> Client Identification Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Contact info, VIP terms, or identification note..."
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingAlias}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 rounded transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {isSavingAlias ? 'Saving...' : 'Save Client ID & Note'}
              </button>
            </form>

            <div className="pt-2 border-t border-gray-100 space-y-1 font-mono text-[10px] text-gray-500">
              <div><span className="text-gray-400">UID:</span> {convDetails?.guestId?.slice(0, 16)}...</div>
              <div><span className="text-gray-400">Source:</span> {convDetails?.source}</div>
              <div><span className="text-gray-400">Created:</span> {convDetails?.createdAtTime}</div>
            </div>

            {convDetails?.status !== 'blocked' && (
              <div className="pt-2 flex flex-col gap-2">
                {convDetails?.status === 'closed' ? (
                  <button
                    onClick={async () => {
                      if (!conversationId) return;
                      try {
                        const db = getFirebaseFirestore();
                        const convDocRef = doc(db, 'chatConversations', conversationId);
                        await updateDoc(convDocRef, { status: 'active', updatedAt: serverTimestamp() });
                      } catch (err: any) {
                        console.error('Failed to reopen conversation:', err);
                        setErrorMessage('Failed to reopen conversation.');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold py-1.5 rounded transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Reopen Conversation
                  </button>
                ) : (
                  <button
                    onClick={handleCloseConversation}
                    className="w-full flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold py-1.5 rounded transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
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
