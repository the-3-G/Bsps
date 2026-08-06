'use client';

import React from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useRouter } from 'next/navigation';
import { Wallet, ShieldCheck, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';

export default function ConnectPage() {
  const {
    connectWallet,
    requestChallengeAndSign,
    disconnectWallet,
    switchNetwork,
    isConnected,
    isConnecting,
    error,
    providerName,
    isBitgetWalletAvailable,
    isUnsupportedNetwork,
    authStep,
    challengeMessage,
    address,
  } = useWeb3();
  const router = useRouter();

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleSign = async () => {
    await requestChallengeAndSign();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6 pt-4 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-slate-100">Connect & Authenticate Wallet</h2>
        <p className="text-xs text-slate-400">Establish secure session credentials via EVM personal signature.</p>
      </div>

      {isUnsupportedNetwork && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Unsupported Network (Sepolia Testnet Required)</span>
          </div>
          <button
            onClick={() => switchNetwork(11155111)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
          >
            Switch
          </button>
        </div>
      )}

      {isConnected ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-center">
          <div className="flex justify-center text-teal-primary">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Wallet Authenticated</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">{address}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-teal-primary hover:bg-teal-hover text-white text-xs font-bold py-2 rounded transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={disconnectWallet}
              className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : authStep === 'challenge_ready' || authStep === 'signing' || authStep === 'verifying' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-teal-primary" />
            <h3 className="text-xs font-bold text-slate-200">Signature Authorization Required</h3>
          </div>

          <div className="text-slate-300 text-[10px] space-y-2 leading-relaxed font-mono p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap max-h-48">
            {challengeMessage}
          </div>

          <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded text-amber-400 text-[10px] font-bold">
            Signing this request authenticates your wallet session ONLY. It does NOT cost gas or initiate a blockchain transaction.
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSign}
              disabled={isConnecting}
              className="flex-1 bg-teal-primary hover:bg-teal-hover disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded transition-colors"
            >
              {authStep === 'signing'
                ? 'Check Wallet Prompt...'
                : authStep === 'verifying'
                ? 'Verifying Signature...'
                : 'Sign Challenge & Log In'}
            </button>
            <button
              onClick={disconnectWallet}
              className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 hover:border-teal-primary/60 disabled:opacity-50 rounded-xl transition-all select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 text-teal-primary rounded-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">
                  {isBitgetWalletAvailable ? 'Bitget Wallet (Detected)' : 'Bitget Wallet / Injected Provider'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isBitgetWalletAvailable ? 'Connect via Bitget EIP-1193 provider' : `Connect via ${providerName}`}
                </div>
              </div>
            </div>
            {isBitgetWalletAvailable && <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">Active</span>}
          </button>

          {!isBitgetWalletAvailable && (
            <a
              href="https://web3.bitget.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-850 hover:border-slate-750 text-slate-400 rounded-xl transition-all text-xs"
            >
              <span className="text-[11px]">Download / Open in Bitget Wallet app</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-500 text-center font-bold">{error}</p>}
    </div>
  );
}
