'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, StatusBadge } from '../../../../components/ui/Reusables';
import { Headset, Send, ArrowLeft, UserCheck, Lock, ShieldAlert, CheckCircle, Copy, Check, Sparkles, Tag, StickyNote, Search, Zap, Link2, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getFirebaseFirestore, getFirebaseFunctions, getFirebaseAuth } from '@bspc/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp, where, getDocs, Timestamp } from 'firebase/firestore';
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

  // Client ID name, wallet, and custom note states
  const [editingAlias, setEditingAlias] = useState('');
  const [editingWallet, setEditingWallet] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  const [aliasSavedMsg, setAliasSavedMsg] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [copiedMsgAddress, setCopiedMsgAddress] = useState<string | null>(null);
  const [copiedThreadMsgId, setCopiedThreadMsgId] = useState<string | null>(null);

  // Helper to extract Ethereum, Tron, or Crypto addresses from message text
  const extractAddresses = (text: string): string[] => {
    if (!text) return [];
    const ethMatches = text.match(/0x[a-fA-F0-9]{40}/g) || [];
    const tronMatches = text.match(/\bT[1-9A-HJ-NP-za-km-z]{33}\b/g) || [];
    return Array.from(new Set([...ethMatches, ...tronMatches]));
  };

  const handleCopyMsgAddress = (addr: string) => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedMsgAddress(addr);
    setTimeout(() => setCopiedMsgAddress(null), 2500);
  };

  const handleCopyThreadText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedThreadMsgId(id);
    setTimeout(() => setCopiedThreadMsgId(null), 2500);
  };

  // Registered user list for quick linking
  const [registeredUsers, setRegisteredUsers] = useState<{ uid: string; walletAddress: string; username: string }[]>([]);

  // Suggested match state for unlinked guest tickets
  interface SuggestedUser {
    uid: string;
    walletAddress: string;
    username: string;
    registrationTime: Date;
    timeDiffLabel: string;
  }
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedUser[]>([]);
  const [isLinkingUser, setIsLinkingUser] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  useEffect(() => {
    // Load registered users for quick dropdown
    try {
      const db = getFirebaseFirestore();
      getDocs(collection(db, 'users')).then((snap) => {
        const uList: any[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const addr = data.walletAddress || (d.id.startsWith('0x') ? d.id : '');
          if (addr) {
            uList.push({
              uid: d.id,
              walletAddress: addr,
              username: data.clientAlias || data.username || `User_${addr.slice(-4).toUpperCase()}`,
            });
          }
        });
        if (uList.length === 0) {
          uList.push(
            { uid: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765', walletAddress: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765', username: 'Argalw Addis (0x16db...4765)' },
            { uid: '0x149534751f4f85Af01ce291FD2be194c8950441d', walletAddress: '0x149534751f4f85Af01ce291FD2be194c8950441d', username: 'User_441D (0x1495...441d)' }
          );
        }
        setRegisteredUsers(uList);
      }).catch(() => {
        setRegisteredUsers([
          { uid: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765', walletAddress: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765', username: 'Argalw Addis (0x16db...4765)' },
          { uid: '0x149534751f4f85Af01ce291FD2be194c8950441d', walletAddress: '0x149534751f4f85Af01ce291FD2be194c8950441d', username: 'User_441D (0x1495...441d)' }
        ]);
      });
    } catch (_) {
      setRegisteredUsers([
        { uid: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765', walletAddress: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765', username: 'Argalw Addis (0x16db...4765)' },
        { uid: '0x149534751f4f85Af01ce291FD2be194c8950441d', walletAddress: '0x149534751f4f85Af01ce291FD2be194c8950441d', username: 'User_441D (0x1495...441d)' }
      ]);
    }

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock || !conversationId) {
      const isC9 = conversationId === 'C9tN8j7LjQWfYNtX3Fd';
      setConvDetails({
        conversationId: isC9 ? 'C9tN8j7LjQWfYNtX3Fd' : (conversationId || 'conv-8921'),
        guestLabel: 'Argalw Addis (0x16db...4765)',
        clientAlias: 'Argalw Addis',
        walletAddress: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765',
        customNote: 'VIP Type C Staker (511,000 USDT Deposit)',
        guestId: 'guest-2871',
        source: 'receive_voucher',
        status: 'active',
        assignedAgentUid: 'Support Agent Alpha',
        subject: 'Voucher Request',
        createdAtTime: 'Today 07:32 AM',
      });
      setEditingAlias('Argalw Addis');
      setEditingWallet('0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765');
      setEditingNote('VIP Type C Staker (511,000 USDT Deposit)');
      setMessages([
        {
          id: 'm1',
          senderType: 'system',
          senderName: 'System',
          text: 'Conversation initiated via Receive Voucher prompt.',
          timestamp: '07:30 AM',
        },
        {
          id: 'm2',
          senderType: 'user',
          senderName: 'Argalw Addis (0x16db...4765)',
          text: 'I am an existing customer and i have an us...',
          timestamp: '07:32 AM',
        },
      ]);
      setNotesList(['Verified client 0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765 with Type C smart contract.']);
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
            guestLabel: alias ? `${alias} (${walletAddr ? walletAddr.slice(0, 6) + '...' + walletAddr.slice(-4) : fallbackLabel})` : fallbackLabel,
            clientAlias: alias,
            walletAddress: walletAddr,
            customNote: data.customNote || '',
            guestId: data.guestId || data.userUid || '',
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
          if (walletAddr) {
            setEditingWallet(walletAddr);
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

  // Query for suggested user matches when ticket has no wallet address
  useEffect(() => {
    if (!convDetails || convDetails.walletAddress || !convDetails.createdAtTime) return;
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      setSuggestedMatches([{
        uid: 'evm_16dbdb5a6ab9ca0e6a4236721ec4eea290b94765',
        walletAddress: '0x16dbdb5a6ab9ca0e6a4236721ec4eea290b94765',
        username: 'User_4765',
        registrationTime: new Date(),
        timeDiffLabel: '3 min after ticket',
      }]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const db = getFirebaseFirestore();
        const ticketTime = new Date(convDetails.createdAtTime!);
        if (isNaN(ticketTime.getTime())) return;

        const windowMs = 5 * 60 * 1000; // 5 minutes
        const startTime = Timestamp.fromDate(new Date(ticketTime.getTime() - windowMs));
        const endTime = Timestamp.fromDate(new Date(ticketTime.getTime() + windowMs));

        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('registrationTime', '>=', startTime),
          where('registrationTime', '<=', endTime),
          orderBy('registrationTime', 'asc'),
          limit(5)
        );

        const snapshot = await getDocs(q);
        const matches: SuggestedUser[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const wallet = data.walletAddress || '';
          if (!wallet) return;

          const regTime = data.registrationTime?.toDate?.() || new Date();
          const diffMs = regTime.getTime() - ticketTime.getTime();
          const diffMin = Math.round(Math.abs(diffMs) / 60000);
          const direction = diffMs >= 0 ? 'after' : 'before';
          const timeDiffLabel = diffMin === 0 ? 'same time as ticket' : `${diffMin} min ${direction} ticket`;

          matches.push({
            uid: d.id,
            walletAddress: wallet,
            username: data.username || `User_${wallet.slice(-4).toUpperCase()}`,
            registrationTime: regTime,
            timeDiffLabel,
          });
        });
        setSuggestedMatches(matches);
      } catch (err) {
        console.warn('Failed to fetch suggested matches:', err);
      }
    };

    fetchSuggestions();
  }, [convDetails?.walletAddress, convDetails?.createdAtTime]);

  // Handle linking a suggested user to this conversation
  const handleLinkSuggestedUser = async (user: SuggestedUser) => {
    if (!conversationId) return;
    setIsLinkingUser(true);
    try {
      const db = getFirebaseFirestore();
      const convDocRef = doc(db, 'chatConversations', conversationId);
      await updateDoc(convDocRef, {
        walletAddress: user.walletAddress,
        walletAddressLowercase: user.walletAddress.toLowerCase(),
        userUid: user.walletAddress.toLowerCase(),
        guestLabel: user.username,
        clientAlias: user.username,
        updatedAt: serverTimestamp(),
      });
      setEditingAlias(user.username);
      setSuggestedMatches([]);
      setAliasSavedMsg(`✓ Linked to ${user.username}`);
      setTimeout(() => setAliasSavedMsg(null), 3500);
    } catch (err) {
      console.error('Failed to link suggested user:', err);
      setErrorMessage('Failed to link user to conversation.');
    } finally {
      setIsLinkingUser(false);
    }
  };

  const handleSaveClientAliasAndNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!conversationId) return;

    setIsSavingAlias(true);
    setAliasSavedMsg(null);

    let normWallet = editingWallet.trim();
    if (normWallet && !normWallet.startsWith('0x') && /^[0-9a-fA-F]{40}$/.test(normWallet)) {
      normWallet = `0x${normWallet}`;
    }

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMock) {
      setConvDetails((prev) =>
        prev
          ? {
              ...prev,
              clientAlias: editingAlias.trim(),
              walletAddress: normWallet || prev.walletAddress,
              guestLabel: editingAlias.trim() || (normWallet ? `User_${normWallet.slice(-4).toUpperCase()}` : prev.guestLabel),
              customNote: editingNote.trim(),
            }
          : null
      );
      setAliasSavedMsg('✓ Client ID, Wallet & Note saved!');
      setIsSavingAlias(false);
      setShowWalletInput(false);
      setTimeout(() => setAliasSavedMsg(null), 3500);
      return;
    }

    try {
      const db = getFirebaseFirestore();
      const convDocRef = doc(db, 'chatConversations', conversationId);
      const trimmedAlias = editingAlias.trim();
      const trimmedNote = editingNote.trim();
      const effectiveWallet = normWallet || convDetails?.walletAddress || null;

      const convUpdates: Record<string, any> = {
        clientAlias: trimmedAlias || null,
        walletAddress: effectiveWallet,
        walletAddressLowercase: effectiveWallet ? effectiveWallet.toLowerCase() : null,
        userUid: effectiveWallet ? effectiveWallet.toLowerCase() : (convDetails?.guestId || null),
        guestLabel: trimmedAlias
          ? `${trimmedAlias} (${effectiveWallet ? effectiveWallet.slice(0, 6) + '...' + effectiveWallet.slice(-4) : (convDetails?.guestId ? 'Guest ' + convDetails.guestId.slice(-4) : 'Guest')})`
          : (effectiveWallet ? `User_${effectiveWallet.slice(-4).toUpperCase()}` : convDetails?.guestLabel || 'Guest'),
        customNote: trimmedNote || null,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(convDocRef, convUpdates);

      // If user has a wallet address, sync alias & note to their users doc as well
      if (effectiveWallet) {
        const uid = effectiveWallet.toLowerCase();
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

      setConvDetails((prev) =>
        prev
          ? {
              ...prev,
              clientAlias: trimmedAlias,
              walletAddress: effectiveWallet || undefined,
              guestLabel: convUpdates.guestLabel,
              customNote: trimmedNote,
            }
          : null
      );

      setAliasSavedMsg('✓ Client ID, ETH Address & Note saved!');
      setShowWalletInput(false);
      setTimeout(() => setAliasSavedMsg(null), 3500);
    } catch (err) {
      console.error('Failed to save client alias/note/wallet:', err);
      setErrorMessage('Failed to save client ID note.');
    } finally {
      setIsSavingAlias(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                  <div key={m.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 text-center font-mono whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                );
              }

              const detectedAddresses = extractAddresses(m.text);

              return (
                <div key={m.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} group`}>
                  <div className="text-[10px] font-bold text-gray-500 mb-0.5">{m.senderName}</div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words font-sans shadow-sm ${
                      isAgent
                        ? 'bg-teal-primary text-white font-normal rounded-tr-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <div>{m.text}</div>

                    {/* Detected Crypto / Wallet Address Copy Widget */}
                    {detectedAddresses.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-teal-600/40 space-y-2">
                        {detectedAddresses.map((addr) => (
                          <div
                            key={addr}
                            className={`p-2 rounded-lg flex items-center justify-between gap-2 border ${
                              isAgent
                                ? 'bg-teal-800/60 border-teal-600/60 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${isAgent ? 'text-teal-200' : 'text-teal-700'}`}>
                                Wallet / Deposit Address
                              </span>
                              <span className="font-mono text-[11px] font-bold truncate select-all">
                                {addr}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyMsgAddress(addr)}
                              className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shrink-0 transition-all shadow-sm active:scale-95 ${
                                copiedMsgAddress === addr
                                  ? 'bg-emerald-500 text-white'
                                  : isAgent
                                  ? 'bg-white text-teal-900 hover:bg-gray-100'
                                  : 'bg-teal-600 hover:bg-teal-700 text-white'
                              }`}
                            >
                              {copiedMsgAddress === addr ? (
                                <>
                                  <Check className="w-3 h-3 text-white" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy Address
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 px-1 text-[9px] text-gray-400 font-mono">
                    <span>{m.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyThreadText(m.text, m.id)}
                      className="hover:text-gray-600 text-gray-400 inline-flex items-center gap-0.5 transition-colors"
                      title="Copy message text"
                    >
                      {copiedThreadMsgId === m.id ? (
                        <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Copied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          <Copy className="w-2.5 h-2.5" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Response Templates & Reply Form */}
          <div className="p-3 bg-white border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-amber-500" /> Templates:
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyText(
`Dear User:

Congratulations! Your application for the 218,000 USDC smart contract savings plan is now officially active.

The system has successfully received and deposited your transfer of 15,325 USDC, and the funds have been automatically added to your smart contract plan. You can click "Plan" → "Records" to view your contract details and fund status in real time.

As an incentive for this contract, the blockchain system will reward you with an additional 17.7 ETH, which has been simultaneously distributed to your contract. You can view the details on the contract plan interface.

Currently, your 15,325 USDC is accruing interest at a daily rate of 2.7%. The system will settle and distribute the returns periodically.

Friendly Reminder: Currently, your smart contract plan has completed 15,325 USDC, with a remaining balance of 202,675 USDC. To ensure you maximize your returns and enjoy the full contract interest rate and returns, please replenish the remaining amount as soon as possible. The earlier you replenish, the more total interest you will receive.

Thank you for your trust and cooperation. The blockchain system will continue to provide you with a secure, efficient, and transparent asset growth experience.`
                  );
                }}
                className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-medium whitespace-nowrap transition-colors"
              >
                📜 Smart Contract Plan Active
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyText(
`Dear User:

Your deposit has been successfully confirmed on the blockchain and credited to your account balance.

Please check your asset overview page to view your updated balance. If you have any further questions, feel free to contact us at any time.`
                  );
                }}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded font-medium whitespace-nowrap transition-colors"
              >
                💰 Deposit Confirmed
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyText(
`Dear User:

Your reward voucher has been successfully granted to your wallet. You can claim and activate it directly from the Plan & Rewards section.

Thank you for choosing BSP Smart Contract platform!`
                  );
                }}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded font-medium whitespace-nowrap transition-colors"
              >
                🎁 Voucher Granted
              </button>
            </div>

            <form onSubmit={handleSendReply} className="space-y-1.5">
              <div className="flex gap-2 items-end">
                <textarea
                  rows={3}
                  placeholder="Type official support reply (Press Shift+Enter for new paragraph, Enter to send)..."
                  value={replyText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                  disabled={convDetails?.status === 'blocked'}
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:outline-none focus:border-teal-primary disabled:opacity-40 resize-y font-sans leading-relaxed min-h-[60px] max-h-[180px]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || convDetails?.status === 'blocked'}
                  className="bg-teal-primary hover:bg-teal-hover disabled:opacity-40 text-white font-bold text-xs px-4 py-3 rounded-lg inline-flex items-center gap-1.5 transition-colors h-fit self-end shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                <span>Enter = Send • Shift + Enter = New Paragraph / Line spacing</span>
                <span>Multiline paragraphs fully preserved</span>
              </div>
            </form>
          </div>
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

            {/* Wallet Address Display & Linking */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Connected ETH Wallet Address
                </label>
                {convDetails?.walletAddress && !showWalletInput && (
                  <button
                    onClick={() => setShowWalletInput(true)}
                    className="text-[10px] text-teal-600 hover:text-teal-800 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" /> Change Address
                  </button>
                )}
              </div>

              {convDetails?.walletAddress && !showWalletInput ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-teal-50/80 border border-teal-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-800 uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Verified ETH Wallet
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (convDetails.walletAddress) {
                              navigator.clipboard.writeText(convDetails.walletAddress);
                              setCopiedWallet(true);
                              setTimeout(() => setCopiedWallet(false), 2000);
                            }
                          }}
                          className="p-1 hover:bg-teal-100 rounded text-teal-700 transition-colors"
                          title="Copy Address"
                        >
                          {copiedWallet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="font-mono text-[11px] font-bold text-teal-950 break-all select-all bg-white px-2 py-1 rounded border border-teal-200">
                      {convDetails.walletAddress}
                    </div>

                    {/* Staking / Smart Contract Summary Badge */}
                    <div className="bg-amber-50 border border-amber-200 rounded p-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        ⚡ Type C Staker (511,000 USDT Deposit)
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300 uppercase">
                        Redeemed
                      </span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Link
                        href={`/admin/users?wallet=${convDetails.walletAddress}`}
                        className="flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white font-sans font-bold text-[10px] py-1 rounded transition-colors"
                      >
                        👤 View User Profile
                      </Link>
                      <Link
                        href={`/admin/pledges?wallet=${convDetails.walletAddress}`}
                        className="flex-1 text-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans font-bold text-[10px] py-1 rounded transition-colors"
                      >
                        ⚡ Smart Contract
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      ⚠️ {convDetails?.walletAddress ? 'Update ETH Address' : 'Bind ETH Address to Ticket'}
                    </span>
                    {showWalletInput && convDetails?.walletAddress && (
                      <button
                        onClick={() => setShowWalletInput(false)}
                        className="text-[10px] text-gray-500 hover:text-gray-700"
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-amber-700">
                    Bind this conversation to a client&apos;s ETH address so you can see their balance, staking terms, and ID name.
                  </p>

                  <input
                    type="text"
                    placeholder="Paste 0x16db... address"
                    value={editingWallet}
                    onChange={(e) => setEditingWallet(e.target.value)}
                    className="w-full font-mono text-[11px] border border-amber-300 rounded px-2.5 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                  />

                  {/* Registered Users Quick Select */}
                  {registeredUsers.length > 0 && (
                    <select
                      value={editingWallet}
                      onChange={(e) => {
                        setEditingWallet(e.target.value);
                        const found = registeredUsers.find((u) => u.walletAddress === e.target.value);
                        if (found) {
                          setEditingAlias(found.username.split(' (')[0]);
                        }
                      }}
                      className="w-full text-[10px] border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none"
                    >
                      <option value="">-- Quick Select Registered Client --</option>
                      {registeredUsers.map((u) => (
                        <option key={u.uid} value={u.walletAddress}>
                          {u.username} ({u.walletAddress.slice(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  )}
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
                  placeholder="e.g. VIP member, requested voucher, Type C staker..."
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingAlias}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {isSavingAlias ? 'Saving...' : '💾 Save Client ID, ETH Address & Note'}
              </button>
            </form>

            <div className="pt-2 border-t border-gray-100 space-y-1 font-mono text-[10px] text-gray-600 bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">WALLET / UID:</span>
                <span className="font-bold text-teal-800 truncate max-w-[170px]" title={convDetails?.walletAddress || convDetails?.guestId || conversationId}>
                  {convDetails?.walletAddress ? `${convDetails.walletAddress.slice(0, 10)}...${convDetails.walletAddress.slice(-6)}` : (convDetails?.guestId || conversationId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">SOURCE:</span>
                <span className="font-semibold">{convDetails?.source || 'receive_voucher'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CREATED:</span>
                <span>{convDetails?.createdAtTime || 'Today'}</span>
              </div>
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
