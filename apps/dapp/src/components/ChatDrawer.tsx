'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Headset,
  Shield,
  Circle,
  CheckCheck,
  Loader2,
  Copy,
  Check,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Maximize2,
  ExternalLink,
  Clipboard,
} from 'lucide-react';
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseFunctions } from '@bspc/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, addDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { useWeb3 } from '../context/Web3Context';
import { uploadToCloudinary, formatFileSize } from '../utils/cloudinary';

import { httpsCallable } from 'firebase/functions';

interface ChatMessage {
  id: string;
  senderType: 'guest' | 'user' | 'agent' | 'system';
  senderUid: string;
  text: string;
  timestamp: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: 'receive_voucher' | 'floating_chat' | 'side_menu' | 'general_support';
}

export function ChatDrawer({ isOpen, onClose, initialSource = 'general_support' }: ChatDrawerProps) {
  const { address } = useWeb3();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [guestLabel, setGuestLabel] = useState('Guest');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'assigned' | 'active' | 'closed' | 'blocked'>('waiting');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Attachment, Input, and Lightbox states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Robust universal clipboard copy helper (supports mobile WebViews and non-secure contexts)
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (e) {
      console.warn('Clipboard copy fallback error:', e);
      return false;
    }
  };

  // Helper to extract Ethereum, Tron, or Crypto addresses from message text
  const extractAddresses = (text: string): string[] => {
    if (!text) return [];
    const ethMatches = text.match(/0x[a-fA-F0-9]{40}/gi) || [];
    const tronMatches = text.match(/\bT[1-9A-HJ-NP-za-km-z]{33}\b/g) || [];
    const bracketMatches = Array.from(text.matchAll(/copy\[([^\]]+)\]/gi)).map(m => m[1]?.trim()).filter(Boolean);
    return Array.from(new Set([...ethMatches, ...tronMatches, ...bracketMatches]));
  };

  // Clean formatting tags like copy[...] from raw message text for clean user display
  const formatMessageText = (text: string): string => {
    if (!text) return '';
    return text.replace(/copy\[([^\]]+)\]/gi, '$1');
  };

  const handleCopyText = async (text: string, id: string) => {
    if (!text) return;
    const ok = await copyToClipboard(formatMessageText(text));
    if (ok) {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2500);
    }
  };

  const handleCopyAddress = async (addr: string) => {
    if (!addr) return;
    const ok = await copyToClipboard(addr.trim());
    if (ok) {
      setCopiedAddress(addr);
      setTimeout(() => setCopiedAddress(null), 2500);
    }
  };

  const pingTypingIndicator = () => {
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

  // Clipboard Paste handler: handles both image screenshots and text reliably
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check if user pasted an image file from clipboard (e.g. screenshot via Ctrl+V or mobile)
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          if (file.size > 15 * 1024 * 1024) {
            setErrorMessage('Pasted image exceeds 15MB limit.');
            return;
          }
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setFilePreviewUrl(url);
          setErrorMessage(null);
          return;
        }
      }
    }

    // 2. Also check clipboard items for image blob
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            if (blob.size > 15 * 1024 * 1024) {
              setErrorMessage('Pasted image exceeds 15MB limit.');
              return;
            }
            setSelectedFile(blob);
            const url = URL.createObjectURL(blob);
            setFilePreviewUrl(url);
            setErrorMessage(null);
            return;
          }
        }
      }
    }

    // 3. Robust Text Paste for Mobile WebViews & Desktop:
    const pastedText = clipboardData.getData('text/plain') || clipboardData.getData('text');
    if (pastedText) {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? inputText.length;
      const end = textarea?.selectionEnd ?? inputText.length;
      const updatedText = inputText.substring(0, start) + pastedText + inputText.substring(end);
      setInputText(updatedText);

      pingTypingIndicator();

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + pastedText.length;
        }
      }, 0);
    }
  };

  // Quick Paste button: triggers native clipboard readText or focuses for mobile paste
  const handleQuickPaste = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText((prev) => (prev ? `${prev} ${text}` : text));
          pingTypingIndicator();
          textareaRef.current?.focus();
          return;
        }
      }
    } catch (err) {
      console.warn('Quick paste readText error:', err);
    }
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Attachment size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
    setErrorMessage(null);
  };

  const handleRemoveSelectedFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      const currentWallet = address || null;
      const initialLabel = currentWallet ? `User_${currentWallet.slice(-4).toUpperCase()}` : `Guest ${shortCode}`;
      setGuestLabel(initialLabel);

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
            if (data.guestId === uidToUse || data.authenticatedUid === uidToUse || (currentWallet && data.walletAddress?.toLowerCase() === currentWallet.toLowerCase())) {
              validConvId = storedConvId;
              setStatus(data.status);

              // Update wallet address if connected
              if (currentWallet && (!data.walletAddress || data.walletAddress.toLowerCase() !== currentWallet.toLowerCase())) {
                updateDoc(convDocRef, {
                  walletAddress: currentWallet,
                  walletAddressLowercase: currentWallet.toLowerCase(),
                  userUid: currentWallet.toLowerCase(),
                  updatedAt: serverTimestamp(),
                }).catch(() => {});
              }
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
            walletAddress: currentWallet,
            walletAddressLowercase: currentWallet ? currentWallet.toLowerCase() : null,
            userUid: currentWallet ? currentWallet.toLowerCase() : uidToUse,
            guestLabel: initialLabel,
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

  // Auto-link wallet address to existing guest conversation when user connects wallet
  useEffect(() => {
    if (!address) return;

    const storedConvId = localStorage.getItem('bspc_support_conversation_id');
    if (!storedConvId) return;

    try {
      const db = getFirebaseFirestore();
      const convDocRef = doc(db, 'chatConversations', storedConvId);

      const walletLabel = `User_${address.slice(-4).toUpperCase()}`;

      updateDoc(convDocRef, {
        walletAddress: address,
        walletAddressLowercase: address.toLowerCase(),
        userUid: address.toLowerCase(),
        guestLabel: walletLabel,
        updatedAt: serverTimestamp(),
      }).then(() => {
        setGuestLabel(walletLabel);
      }).catch((err) => {
        console.warn('Auto-link wallet to conversation failed:', err);
      });
    } catch (err) {
      console.warn('Auto-link wallet error:', err);
    }
  }, [address]);

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
          messageType: data.messageType || (data.attachmentUrl ? 'image' : 'text'),
          attachmentUrl: data.attachmentUrl || undefined,
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    pingTypingIndicator();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText && !selectedFile) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await initSession();
      if (!activeConvId) {
        setErrorMessage('Could not establish a secure support session. Please tap retry above.');
        return;
      }
    }

    if (status === 'blocked') {
      setErrorMessage('This support conversation has been blocked.');
      return;
    }

    // Client-side abuse checks
    if (cleanText.length > 2000) {
      setErrorMessage('Message exceeds the maximum limit of 2000 characters.');
      return;
    }

    let uploadedUrl: string | undefined = undefined;
    let uploadedType: 'text' | 'image' | 'file' = 'text';

    if (selectedFile) {
      try {
        setIsUploading(true);
        const res = await uploadToCloudinary(selectedFile);
        uploadedUrl = res.secureUrl;
        uploadedType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      } catch (uploadErr: any) {
        console.error('Attachment upload failed:', uploadErr);
        setErrorMessage(uploadErr?.message || 'Attachment upload failed. Please try again.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    setInputText('');
    handleRemoveSelectedFile();
    setErrorMessage(null);

    // Cancel typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const db = getFirebaseFirestore();
    const convDocRef = doc(db, 'chatConversations', activeConvId);
    updateDoc(convDocRef, { guestTyping: false }).catch(() => {});

    try {
      const msgsRef = collection(db, 'chatConversations', activeConvId, 'messages');
      const senderUidToSave = address ? address.toLowerCase() : (userUid || 'unknown');
      const senderNameToSave = address ? `User_${address.slice(-4).toUpperCase()}` : guestLabel;

      const msgDocData: Record<string, any> = {
        conversationId: activeConvId,
        senderType: address ? 'user' : 'guest',
        senderUid: senderUidToSave,
        senderName: senderNameToSave,
        senderWalletAddress: address || null,
        messageType: uploadedType,
        text: cleanText,
        createdAt: serverTimestamp(),
      };
      if (uploadedUrl) {
        msgDocData.attachmentUrl = uploadedUrl;
      }

      await addDoc(msgsRef, msgDocData);

      // Update last message preview, reactivate status if closed, & increment agent unread counter
      const previewText = cleanText || (uploadedType === 'image' ? '📷 [Image]' : '📎 [Attachment]');
      const convUpdates: Record<string, any> = {
        lastMessagePreview: previewText.slice(0, 100),
        lastMessageAt: serverTimestamp(),
        agentUnreadCount: increment(1),
        updatedAt: serverTimestamp(),
      };
      if (address) {
        convUpdates.walletAddress = address;
        convUpdates.walletAddressLowercase = address.toLowerCase();
        convUpdates.userUid = address.toLowerCase();
      }
      if (status === 'closed') {
        convUpdates.status = 'active';
      }

      await updateDoc(convDocRef, convUpdates);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage('Failed to send message. Please verify authorization.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex justify-center bg-black/80 backdrop-blur-sm touch-manipulation"
      onPaste={handlePaste}
    >
      <div className="w-full max-w-md bg-slate-950 flex flex-col h-[100dvh] max-h-[100dvh] border-x border-slate-800 shadow-2xl relative overscroll-contain">
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
                  'text-teal-400'
                }`} />
                <span className="text-[10px] text-slate-400">
                  {status === 'waiting' && 'Waiting for Support Agent...'}
                  {(status === 'assigned' || status === 'active') && 'Support Agent Connected'}
                  {status === 'closed' && 'Support Connected (Send to continue)'}
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

                const detectedAddresses = extractAddresses(msg.text);

                return (
                  <div key={msg.id} className={`flex flex-col ${isGuest ? 'items-end' : 'items-start'} group`}>
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words font-sans shadow-md ${
                        isGuest
                          ? 'bg-amber-500 text-slate-950 font-normal rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {/* Render Image or File Attachment */}
                      {msg.attachmentUrl && (
                        <div className="mb-2">
                          {msg.messageType === 'file' ? (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`p-2.5 rounded-xl flex items-center gap-2 border text-xs font-sans transition-colors ${
                                isGuest
                                  ? 'bg-amber-600/30 border-amber-600/40 text-slate-950 hover:bg-amber-600/40'
                                  : 'bg-slate-950/80 border-slate-700/80 text-slate-200 hover:bg-slate-950'
                              }`}
                            >
                              <FileText className={`w-4 h-4 shrink-0 ${isGuest ? 'text-slate-950' : 'text-amber-400'}`} />
                              <span className="truncate flex-1 font-mono text-[11px]">Attachment File</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            </a>
                          ) : (
                            <div className="relative rounded-xl overflow-hidden group/img border border-black/10 bg-black/20">
                              <img
                                src={msg.attachmentUrl}
                                alt="Chat Attachment"
                                className="max-h-60 w-auto rounded-xl object-contain cursor-zoom-in hover:opacity-95 transition-all shadow-sm"
                                onClick={() => setLightboxUrl(msg.attachmentUrl!)}
                                loading="lazy"
                              />
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(msg.attachmentUrl!)}
                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm shadow"
                                title="Zoom Image"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.text && <div>{formatMessageText(msg.text)}</div>}

                      {/* Detected Crypto / Wallet Address Copy Widget */}
                      {detectedAddresses.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                          {detectedAddresses.map((addr) => (
                            <div
                              key={addr}
                              className={`p-2.5 rounded-xl flex items-center justify-between gap-2 border shadow-sm ${
                                isGuest
                                  ? 'bg-amber-600/30 border-amber-600/40 text-slate-950'
                                  : 'bg-slate-950 border-emerald-500/40 text-slate-100'
                              }`}
                            >
                              <div className="flex flex-col min-w-0 pr-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isGuest ? 'text-amber-950 font-extrabold' : 'text-emerald-400'}`}>
                                  WALLET / DEPOSIT ADDRESS
                                </span>
                                <span className="font-mono text-[11px] font-bold truncate select-all text-white">
                                  {addr}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyAddress(addr)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shrink-0 transition-all shadow-sm active:scale-95 ${
                                  copiedAddress === addr
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isGuest
                                    ? 'bg-slate-950 text-amber-400 hover:bg-slate-900'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold'
                                }`}
                              >
                                {copiedAddress === addr ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Copy Address
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-slate-500 font-mono">
                      <span>{msg.timestamp}</span>
                      {isGuest && <CheckCheck className="w-3 h-3 text-amber-500" />}
                      {msg.text && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="hover:text-slate-300 text-slate-500 inline-flex items-center gap-0.5 transition-colors"
                          title="Copy message text"
                        >
                          {copiedMsgId === msg.id ? (
                            <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Copied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5">
                              <Copy className="w-2.5 h-2.5" /> Copy
                            </span>
                          )}
                        </button>
                      )}
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
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          {/* Staged File Preview */}
          {selectedFile && (
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl mb-2 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2.5 min-w-0">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-200 truncate max-w-[200px]">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveSelectedFile}
                disabled={isUploading}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCreating || isUploading || status === 'blocked'}
              className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all self-end shrink-0 disabled:opacity-40"
              title="Attach image (Cloudinary)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleQuickPaste}
              disabled={isCreating || isUploading || status === 'blocked'}
              className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all self-end shrink-0 disabled:opacity-40"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={status === 'blocked' ? "Conversation is blocked" : "Type message (Shift+Enter for new line)..."}
              value={inputText}
              onChange={handleInputChange}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={isCreating || isUploading || status === 'blocked'}
              style={{ fontSize: '16px' }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[16px] sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500/60 disabled:opacity-40 resize-none max-h-24 font-sans leading-relaxed"
            />
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isCreating || isUploading || status === 'blocked'}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold p-2.5 rounded-xl transition-all self-end shrink-0"
              title={isUploading ? "Uploading..." : "Send"}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

        {/* Lightbox Modal */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="w-full max-w-4xl flex justify-between items-center mb-3 px-2" onClick={(e) => e.stopPropagation()}>
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Original
              </a>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxUrl}
                alt="Full View"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
