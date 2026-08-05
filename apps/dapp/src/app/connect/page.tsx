'use client';

import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useRouter } from 'next/navigation';
import { Wallet, ShieldCheck, Cpu } from 'lucide-react';

export default function ConnectPage() {
  const { connectWallet, isConnected, isConnecting, error } = useWeb3();
  const router = useRouter();
  const [showSignPrompt, setShowSignPrompt] = useState(false);

  const handleConnect = async () => {
    // Stage 1: Detect and request address
    // Stage 2: Prompt signed challenge nonce
    setShowSignPrompt(true);
  };

  const handleSign = async () => {
    await connectWallet();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">Connect Wallet</h2>
        <p className="text-xs text-slate-400">Establish authorization credentials via EVM signature.</p>
      </div>

      {!showSignPrompt ? (
        <div className="space-y-3">
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 hover:border-teal-primary/60 rounded-xl transition-all select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 text-teal-primary rounded-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">Bitget Wallet</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Connect via injected EIP-1193 provider</div>
              </div>
            </div>
          </button>

          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 hover:border-teal-primary/60 rounded-xl transition-all select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 text-slate-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">WalletConnect Fallback</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Scan QR code using mobile device</div>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-teal-primary" />
            <h3 className="text-xs font-bold text-slate-200">Signature Authorization Required</h3>
          </div>
          <div className="text-slate-400 text-[10px] space-y-2 leading-relaxed font-mono p-2 bg-slate-950 rounded border border-slate-850">
            <div>domain: bspc.io</div>
            <div>address: 0x952...BAfe5</div>
            <div>nonce: 792b185cf1a90ee7</div>
            <div>issued-at: {new Date().toISOString()}</div>
            <div>expiry: {new Date(Date.now() + 600000).toISOString()}</div>
            <div className="text-amber-400 font-bold border-t border-slate-800 pt-1 mt-1">
              Signing this message does NOT cost gas or initiate a smart contract transaction.
            </div>
          </div>

          <button
            onClick={handleSign}
            className="w-full bg-teal-primary hover:bg-teal-hover text-white text-xs font-bold py-2 rounded transition-colors"
          >
            Verify & Sign Challenge
          </button>
        </div>
      )}

      {error && <p className="text-[10px] text-red-500 text-center font-bold">{error}</p>}
    </div>
  );
}
