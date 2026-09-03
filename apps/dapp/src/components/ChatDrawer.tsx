'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Headset, Shield, Circle, CheckCheck, Loader2 } from 'lucide-react';
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseFunctions } from '@bspc/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, addDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';

interface ChatMessage {
  id: string;
  senderType: 'guest' | 'user' | 'agent' | 'system';
  senderUid: string;
  text: string;
  timestamp: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: 'receive_voucher' | 'floating_chat' | 'side_menu' | 'general_support';
}

export function ChatDrawer({ isOpen, onClose, initialSource = 'general_support' }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [guestLabel, setGuestLabel] = useState('Guest');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'assigned' | 'active' | 'closed' | 'blocked'>('waiting');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  // Auth and Conversation Initialization helper
  const initSession = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    const functions = getFirebaseFunctions();

    setIsCreating(true);
    setErrorMessage(null);

    let currentUser = auth.currentUser;
    let uidToUse = currentUser?.uid || null;

    if (!currentUser) {
      try {
        const res = await signInAnonymously(auth);
        currentUser = res.user;
        uidToUse = currentUser.uid;
      } catch (err: any) {
        console.warn('Anonymous sign-in unavailable, using local guest session:', err?.message || err);
        let localGuestId = localStorage.getItem('bspc_support_guest_id');
        if (!localGuestId) {
          localGuestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
          localStorage.setItem('bspc_support_guest_id', localGuestId);
        }
        uidToUse = localGuestId;
      }
    }

    if (uidToUse) {
      setUserUid(uidToUse);
      const shortCode = uidToUse.slice(-4).toUpperCase();
      setGuestLabel(`Guest ${shortCode}`);

      // Try to retrieve and verify stored conversation ID
      const storedConvId = localStorage.getItem('bspc_support_conversation_id');
      let validConvId = null;

      if (storedConvId) {
        try {
          const convDocRef = doc(db, 'chatConversations', storedConvId);
          const convSnap = await getDoc(convDocRef);
          if (convSnap.exists()) {
            const data = convSnap.data();
            // Verify ownership
            if (data.guestId === uidToUse || data.authenticatedUid === uidToUse) {
              validConvId = storedConvId;
              setStatus(data.status);
            }
          }
        } catch (e) {
          console.warn('Failed to verify stored conversation ID:', e);
        }
      }

      if (validConvId) {
        setConversationId(validConvId);
        setIsCreating(false);
        return validConvId;
      } else {
        // Clear stale state
        localStorage.removeItem('bspc_support_conversation_id');

        try {
          const newConvRef = doc(collection(db, 'chatConversations'));
          const newId = newConvRef.id;
          const now = serverTimestamp();

          await setDoc(newConvRef, {
            guestId: uidToUse,
            authenticatedUid: uidToUse,
            guestLabel: `Guest ${shortCode}`,
            status: 'waiting',
            assignedAgentUid: null,
            source: initialSource,
            subject: initialSource === 'receive_voucher' ? 'Voucher Request' : 'General Inquiry',
            createdAt: now,
            updatedAt: now,
            lastMessageAt: now,
            userUnreadCount: 0,
            agentUnreadCount: 0,
          });

          // Add initial system message if voucher request
          if (initialSource === 'receive_voucher') {
            const msgRef = collection(db, 'chatConversations', newId, 'messages');
            await addDoc(msgRef, {
              conversationId: newId,
              senderType: 'system',
              senderUid: 'system',
              text: 'Hello. Please tell us how we can assist you with your voucher.',
              messageType: 'text',
              createdAt: now,
            });
          }

          localStorage.setItem('bspc_support_conversation_id', newId);
          setConversationId(newId);
          setStatus('waiting');
          setIsCreating(false);
          return newId;
        } catch (fsErr: any) {
          console.error('Firestore conversation creation failed:', fsErr);
          setErrorMessage(fsErr?.message || 'Failed to connect to customer support.');
          setIsCreating(false);
          return null;
        }
      }
    }
    setIsCreating(false);
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;
    const auth = getFirebaseAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      initSession();
    });

    return () => {
      unsubscribeAuth();
    };
  }, [isOpen]);



  // Real-time Firestore Subscriptions (Conversation status and Messages)
  useEffect(() => {
    if (!conversationId || !isOpen) return;

    const db = getFirebaseFirestore();

    // 1. Listen to conversation status & agent typing
    const convDocRef = doc(db, 'chatConversations', conversationId);
    const unsubConv = onSnapshot(convDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStatus(data.status);
        setIsAgentTyping(data.agentTyping === true);

        // Mark user unread count as cleared if we are looking at it
        if (data.userUnreadCount && data.userUnreadCount > 0) {
          updateDoc(convDocRef, {
            userUnreadCount: 0,
            updatedAt: serverTimestamp(),
          }).catch((err) => console.warn('Failed to reset userUnreadCount:', err));
        }
      }
    });

    // 2. Listen to messages (ordered by createdAt, limited to 50)
    const msgsRef = collection(db, 'chatConversations', conversationId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'), limit(50));

    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const loadedMsgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        loadedMsgs.push({
          id: d.id,
          senderType: data.senderType || 'guest',
          senderUid: data.senderUid || '',
          text: data.text || '',
          timestamp: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });
      setMessages(loadedMsgs);
    });

    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [conversationId, isOpen]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!conversationId) return;

    const now = Date.now();
    if (now - lastTypingTimeRef.current > 3000) {
      lastTypingTimeRef.current = now;
      const db = getFirebaseFirestore();
      const convDocRef = doc(db, 'chatConversations', conversationId);
      updateDoc(convDocRef, { guestTyping: true }).catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        updateDoc(convDocRef, { guestTyping: false }).catch(() => {});
      }, 5000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {

    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await initSession();
      if (!activeConvId) {
        setErrorMessage('Could not establish a secure support session. Please tap retry above.');
        return;
      }
    }

    if (status === 'closed' || status === 'blocked') {
      setErrorMessage('This support conversation has been closed or blocked.');
      return;
    }

    // Client-side abuse checks
    if (cleanText.length > 1000) {
      setErrorMessage('Message exceeds the maximum limit of 1000 characters.');
      return;
    }

    setInputText('');
    setErrorMessage(null);

    // Cancel typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const db = getFirebaseFirestore();
    const convDocRef = doc(db, 'chatConversations', activeConvId);
    updateDoc(convDocRef, { guestTyping: false }).catch(() => {});

    try {
      const msgsRef = collection(db, 'chatConversations', activeConvId, 'messages');
      // Direct Firestore message write
      await addDoc(msgsRef, {
        conversationId: activeConvId,
        senderType: 'guest',
        senderUid: userUid || 'unknown',
        messageType: 'text',
        text: cleanText,
        createdAt: serverTimestamp(),
      });

      // Update last message preview & increment agent unread counter
      await updateDoc(convDocRef, {
        lastMessagePreview: cleanText.slice(0, 100),
        lastMessageAt: serverTimestamp(),
        agentUnreadCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage('Failed to send message. Please verify authorization.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-950 flex flex-col h-full border-x border-slate-800 shadow-2xl relative">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">BSP Support Center</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {guestLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-2 h-2 fill-current ${
                  status === 'waiting' ? 'text-amber-400 animate-pulse' :
                  status === 'blocked' ? 'text-red-500' :
                  status === 'closed' ? 'text-gray-500' : 'text-teal-400'
                }`} />
                <span className="text-[10px] text-slate-400">
                  {status === 'waiting' && 'Waiting for Support Agent...'}
                  {(status === 'assigned' || status === 'active') && 'Support Agent Connected'}
                  {status === 'closed' && 'Conversation Closed'}
                  {status === 'blocked' && 'User Blocked'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950 flex flex-col">
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Official BSP Customer Service. Confidential & Encrypted Session.
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/30 border border-red-900/60 text-red-300 text-xs rounded-xl text-center flex flex-col items-center gap-2 shadow-sm">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => initSession()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
              >
                Retry Session Connection
              </button>
            </div>
          )}

          {isCreating ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              <span className="text-xs text-slate-400">Connecting securely to support...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              No messages yet. Say hello to get started.
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {messages.map((msg) => {
                const isGuest = msg.senderType === 'guest' || msg.senderType === 'user';
                const isSystem = msg.senderType === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-300">
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isGuest ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isGuest
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                      <span>{msg.timestamp}</span>
                      {isGuest && <CheckCheck className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isAgentTyping && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl max-w-[140px] mt-2 font-semibold">
              <span className="text-[10px] text-slate-400 italic">Agent typing</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder={status === 'closed' || status === 'blocked' ? "Conversation is inactive" : "Type message to support..."}
            value={inputText}
            onChange={handleInputChange}
            disabled={isCreating || status === 'closed' || status === 'blocked'}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isCreating || status === 'closed' || status === 'blocked'}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold p-2.5 rounded-xl transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
