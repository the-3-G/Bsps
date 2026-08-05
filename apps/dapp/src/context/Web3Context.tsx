'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Web3ContextType {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for persistent connection
    const cachedAddress = localStorage.getItem('user-address');
    const cachedChain = localStorage.getItem('user-chain-id');
    if (cachedAddress && cachedChain) {
      setIsConnected(true);
      setAddress(cachedAddress);
      setChainId(parseInt(cachedChain, 10));
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Simulation of EIP-1193 signature verification challenge flow
      const mockAddress = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5';
      const mockChainId = 1; // Ethereum Mainnet

      // 1. Get challenge nonce
      // 2. Sign message statement
      // 3. Authenticate Firebase session
      
      setIsConnected(true);
      setAddress(mockAddress);
      setChainId(mockChainId);
      localStorage.setItem('user-address', mockAddress);
      localStorage.setItem('user-chain-id', mockChainId.toString());
    } catch (err: any) {
      setError(err?.message || 'Connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    localStorage.removeItem('user-address');
    localStorage.removeItem('user-chain-id');
  };

  const switchNetwork = async (targetChainId: number) => {
    setChainId(targetChainId);
    localStorage.setItem('user-chain-id', targetChainId.toString());
  };

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        address,
        chainId,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
