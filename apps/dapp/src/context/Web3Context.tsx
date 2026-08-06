'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFirebaseAuth, getFirebaseFunctions } from '@bspc/firebase';
import { signInWithCustomToken, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { sanitizeAndChecksumAddress } from '@bspc/web3';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_HEX_CHAIN_ID = '0xaa36a7';

export interface Web3ContextType {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  providerName: string;
  isBitgetWalletAvailable: boolean;
  isUnsupportedNetwork: boolean;
  authStep: 'idle' | 'detecting' | 'challenge_ready' | 'signing' | 'verifying' | 'authenticated';
  challengeMessage: string | null;
  challengeId: string | null;
  firebaseUser: FirebaseUser | null;
  connectWallet: () => Promise<void>;
  requestChallengeAndSign: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (targetChainId?: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('Injected EVM Wallet');
  const [isBitgetWalletAvailable, setIsBitgetWalletAvailable] = useState(false);
  const [authStep, setAuthStep] = useState<Web3ContextType['authStep']>('idle');
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Helper to get raw EIP-1193 ethereum provider
  const getEthereumProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const windowEth = (window as any).ethereum;
    const bitkeepEth = (window as any).bitkeep?.ethereum;

    if (bitkeepEth || windowEth?.isBitKeep) {
      return bitkeepEth || windowEth;
    }
    return windowEth || null;
  }, []);

  // Sync Firebase Auth state
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
      });
      return () => unsubscribe();
    } catch {
      // Graceful fallback when Firebase config is in mock mode
      return () => {};
    }
  }, []);

  // Detect provider on mount & handle event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const provider = getEthereumProvider();
    const windowEth = (window as any).ethereum;
    const bitkeepEth = (window as any).bitkeep?.ethereum;

    if (bitkeepEth || windowEth?.isBitKeep) {
      setIsBitgetWalletAvailable(true);
      setProviderName('Bitget Wallet');
    } else if (provider) {
      setProviderName('Injected EVM Wallet');
    }

    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddress = accounts[0];
        if (address && newAddress.toLowerCase() !== address.toLowerCase()) {
          // Account changed -> force re-authentication
          disconnectWallet();
        }
      }
    };

    const handleChainChanged = (newHexChainId: string) => {
      const parsedChainId = parseInt(newHexChainId, 16);
      setChainId(parsedChainId);
      if (parsedChainId !== SEPOLIA_CHAIN_ID) {
        setError('Unsupported network. Please switch to Sepolia Testnet.');
      } else {
        setError(null);
      }
    };

    if (provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [getEthereumProvider, address]);

  // Step 1: Detect & Connect Accounts
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    setAuthStep('detecting');

    try {
      const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
      const provider = getEthereumProvider();

      if (!provider && !isMock) {
        throw new Error('No EVM wallet detected. Please open inside Bitget Wallet or install an injected provider.');
      }

      let connectedAddress = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5';
      let currentChainId = SEPOLIA_CHAIN_ID;

      if (provider && !isMock) {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No account selected by user.');
        }
        connectedAddress = sanitizeAndChecksumAddress(accounts[0]);
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        currentChainId = parseInt(chainIdHex, 16);
      }

      setAddress(connectedAddress);
      setChainId(currentChainId);

      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        setError('Unsupported network. Please switch to Sepolia Testnet.');
        setIsConnecting(false);
        return;
      }

      // Step 2: Request Challenge from Cloud Function or Mock
      if (isMock) {
        const mockChallengeId = `c-mock-${Date.now()}`;
        const mockMsg = [
          `bspc.io wants you to sign in with your Ethereum account:`,
          connectedAddress,
          '',
          'Sign in to BSPC. This request authenticates your wallet only. It does not initiate a transaction, transfer assets, or grant token approval.',
          '',
          `URI: https://bspc.io`,
          'Version: 1',
          `Chain ID: ${currentChainId}`,
          `Nonce: mockNonce128BitEntropy`,
          `Issued At: ${new Date().toISOString()}`,
          `Expiration Time: ${new Date(Date.now() + 300000).toISOString()}`,
          `Request ID: ${mockChallengeId}`,
        ].join('\n');

        setChallengeId(mockChallengeId);
        setChallengeMessage(mockMsg);
        setAuthStep('challenge_ready');
      } else {
        const functionsInstance = getFirebaseFunctions();
        const createChallengeFn = httpsCallable<{ walletAddress: string; chainId: number }, { challengeId: string; message: string; expiresAt: string }>(
          functionsInstance,
          'createWalletChallenge'
        );
        const res = await createChallengeFn({ walletAddress: connectedAddress, chainId: currentChainId });
        setChallengeId(res.data.challengeId);
        setChallengeMessage(res.data.message);
        setAuthStep('challenge_ready');
      }
    } catch (err: any) {
      setError(err?.message || 'Wallet connection failed.');
      setAuthStep('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  // Step 2: Request EIP-191 Personal Signature & Submit Verification
  const requestChallengeAndSign = async () => {
    if (!address || !challengeMessage || !challengeId) {
      setError('Challenge details missing. Please reconnect.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setAuthStep('signing');

    try {
      const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
      const provider = getEthereumProvider();

      let signature = '0xmockSignatureHex1234567890abcdef';

      if (provider && !isMock) {
        // Request personal_sign (EIP-191)
        signature = await provider.request({
          method: 'personal_sign',
          params: [challengeMessage, address],
        });
      }

      setAuthStep('verifying');

      if (isMock) {
        setIsConnected(true);
        setAuthStep('authenticated');
        localStorage.setItem('user-address', address);
        localStorage.setItem('user-chain-id', (chainId || SEPOLIA_CHAIN_ID).toString());
      } else {
        const functionsInstance = getFirebaseFunctions();
        const verifySignatureFn = httpsCallable<{ challengeId: string; signature: string }, { firebaseCustomToken: string; user: { uid: string; walletAddress: string; status: string } }>(
          functionsInstance,
          'verifyWalletSignature'
        );
        const res = await verifySignatureFn({ challengeId, signature });
        const { firebaseCustomToken } = res.data;

        // Authenticate with Firebase Auth Engine
        const authInstance = getFirebaseAuth();
        await signInWithCustomToken(authInstance, firebaseCustomToken);

        setIsConnected(true);
        setAuthStep('authenticated');
        localStorage.setItem('user-address', address);
        localStorage.setItem('user-chain-id', (chainId || SEPOLIA_CHAIN_ID).toString());
      }
    } catch (err: any) {
      setError(err?.message || 'Signature verification failed.');
      setAuthStep('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {
      // Ignore if mock mode
    }
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    setChallengeMessage(null);
    setChallengeId(null);
    setAuthStep('idle');
    localStorage.removeItem('user-address');
    localStorage.removeItem('user-chain-id');
  };

  const switchNetwork = async (targetChainId = SEPOLIA_CHAIN_ID) => {
    const provider = getEthereumProvider();
    if (!provider) {
      setError('No wallet provider available to switch networks.');
      return;
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
      });
      setChainId(targetChainId);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to switch network.');
    }
  };

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        address,
        chainId,
        isConnecting,
        error,
        providerName,
        isBitgetWalletAvailable,
        isUnsupportedNetwork: chainId !== null && chainId !== SEPOLIA_CHAIN_ID,
        authStep,
        challengeMessage,
        challengeId,
        firebaseUser,
        connectWallet,
        requestChallengeAndSign,
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
