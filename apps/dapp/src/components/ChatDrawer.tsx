'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Headset, Shield, Circle, CheckCheck } from 'lucide-react';
import { getFirebaseAuth, getFirebaseFirestore } from '@bspc/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderType: 'system',
      senderUid: 'system',
      text: 'Hello. Please tell us how we can assist you with your voucher.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [guestLabel, setGuestLabel] = useState('Guest 4821');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'agent_connected' | 'active'>('waiting');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  // Anonymous auth initialization & Firestore subscription
  useEffect(() => {
    if (!isOpen) return;

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();

      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        let currentUid = user?.uid;

        if (!user) {
          try {
            const anonRes = await signInAnonymously(auth);
            currentUid = anonRes.user.uid;
          } catch {
            // Fallback for mock mode
            currentUid = `guest-${Math.floor(1000 + Math.random() * 9000)}`;
          }
        }

        if (currentUid) {
          const shortCode = currentUid.slice(-4).toUpperCase();
          setGuestLabel(`Guest ${shortCode}`);

          const convId = `conv-${currentUid.slice(-6)}`;
          setConversationId(convId);

          try {
            const convRef = doc(db, 'chatConversations', convId);
            await setDoc(
              convRef,
              {
                conversationId: convId,
                guestId: currentUid,
                guestLabel: `Guest ${shortCode}`,
                status: 'waiting',
                source: initialSource,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            const msgsRef = collection(db, 'chatConversations', convId, 'messages');
            const q = query(msgsRef, orderBy('createdAt', 'asc'));

            const unsubMsgs = onSnapshot(q, (snapshot) => {
              if (!snapshot.empty) {
                const loadedMsgs: ChatMessage[] = snapshot.docs.map((d) => {
                  const data = d.data();
                  return {
                    id: d.id,
                    senderType: data.senderType || 'guest',
                    senderUid: data.senderUid || '',
                    text: data.text || '',
                    timestamp: data.createdAt?.toDate
                      ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  };
                });
                setMessages(loadedMsgs);
              }
            });

            return () => unsubMsgs();
          } catch {
            // Silently maintain local state in mock mode
          }
        }
      });

      return () => unsubscribeAuth();
    } catch {
      // Mock mode fallback
    }
  }, [isOpen, initialSource]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderType: 'guest',
      senderUid: 'guest-me',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    const sentText = inputText;
    setInputText('');

    try {
      const db = getFirebaseFirestore();
      if (conversationId) {
        const msgsRef = collection(db, 'chatConversations', conversationId, 'messages');
        await addDoc(msgsRef, {
          conversationId,
          senderType: 'guest',
          senderUid: guestLabel,
          text: sentText,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      // Ignore if offline mock
    }

    // Auto-reply simulation for interactive demo experience
    setTimeout(() => {
      setIsAgentTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsAgentTyping(false);
      setStatus('agent_connected');
      setMessages((prev) => [
        ...prev,
        {
          id: `m-agent-${Date.now()}`,
          senderType: 'agent',
          senderUid: 'agent-01',
          text: `Hello ${guestLabel}, thank you for contacting Customer Service. A support agent is reviewing your voucher request. Please stand by for guidance.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-950 flex flex-col h-full border-x border-slate-800 shadow-2xl relative">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-100">BSP Support Center</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                  {guestLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-2 h-2 fill-current ${status === 'waiting' ? 'text-amber-400 animate-pulse' : 'text-teal-400'}`} />
                <span className="text-[10px] text-slate-400">
                  {status === 'waiting' ? 'Waiting for Support Agent...' : 'Support Agent Connected'}
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
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950">
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Official BSP Customer Service. Confidential & Encrypted Session.
          </div>

          {messages.map((msg) => {
            const isGuest = msg.senderType === 'guest';
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

          {isAgentTyping && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl max-w-[140px]">
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
            placeholder="Type message to support..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold p-2.5 rounded-xl transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
