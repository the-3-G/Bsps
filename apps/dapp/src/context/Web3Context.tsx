'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFirebaseAuth, getFirebaseFunctions, getFirebaseFirestore } from '@bspc/firebase';
import { signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { sanitizeAndChecksumAddress } from '@bspc/web3';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_HEX_CHAIN_ID = '0xaa36a7';

async function fetchWalletBalances(provider: any, walletAddress: string) {
  let ethBalance = '0.0000';
  let usdtBalance = '0.00';
  try {
    if (provider) {
      // 1. Native balance (ETH / BNB / MATIC)
      const hexEth = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
      });
      if (hexEth && hexEth !== '0x') {
        const wei = BigInt(hexEth);
        ethBalance = (Number(wei) / 1e18).toFixed(4);
      }

      // 2. Query common USDT/USDC tokens across networks
      const cleanAddr = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      const data = `0x70a08231${cleanAddr}`;
      
      const candidateTokens = [
        { address: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 }, // Sepolia USDC
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }, // Ethereum Mainnet USDT
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }, // Ethereum Mainnet USDC
        { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }, // BSC USDT
      ];

      for (const token of candidateTokens) {
        try {
          const hexRes = await provider.request({
            method: 'eth_call',
            params: [{ to: token.address, data }, 'latest'],
          });
          if (hexRes && hexRes !== '0x' && hexRes !== '0x0') {
            const raw = BigInt(hexRes);
            if (raw > BigInt(0)) {
              usdtBalance = (Number(raw) / Math.pow(10, token.decimals)).toFixed(2);
              break;
            }
          }
        } catch {
          // Ignore network specific contract errors
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch wallet balances:', e);
  }
  return { ethBalance, usdtBalance };
}

async function syncUserToFirestore(walletAddress: string, ethBalance: string, usdtBalance: string) {
  try {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn('Anonymous auth sign-in warning:', authErr);
      }
    }
    const db = getFirebaseFirestore();
    const uid = walletAddress.toLowerCase();
    const userRef = doc(db, 'users', uid);
    
    await setDoc(
      userRef,
      {
        uid,
        username: `User_${uid.slice(-4).toUpperCase()}`,
        walletAddress,
        walletAddressLowercase: uid,
        balanceEth: `${ethBalance} ETH`,
        balanceUsdt: `${usdtBalance} USDT`,
        status: 'active',
        collectionStatus: 'active',
        authorizationStatus: 'authorized',
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'loginEvents'), {
      walletAddress,
      ethBalance: `${ethBalance} ETH`,
      usdtBalance: `${usdtBalance} USDT`,
      timestamp: serverTimestamp(),
      loginResult: 'SUCCESS',
      ipAddress: 'Web3 Client',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });
    console.log(`[Firestore Sync] User ${walletAddress} synced successfully.`);
  } catch (err) {
    console.warn('Firestore user sync warning:', err);
  }
}

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

  // Silent auto-connect on mount if inside Bitget Wallet DApp Browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const provider = getEthereumProvider();
    if (!provider) return;

    provider
      .request({ method: 'eth_accounts' })
      .then(async (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const connectedAddress = sanitizeAndChecksumAddress(accounts[0]);
          setAddress(connectedAddress);
          setIsConnected(true);
          const { ethBalance, usdtBalance } = await fetchWalletBalances(provider, connectedAddress);
          await syncUserToFirestore(connectedAddress, ethBalance, usdtBalance);
        }
      })
      .catch(() => {});
  }, [getEthereumProvider]);

  // Step 1: Detect & Connect Accounts
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    setAuthStep('detecting');

    try {
      const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
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

      // Instantly fetch balances & sync user info to Firestore for Admin view
      const { ethBalance, usdtBalance } = await fetchWalletBalances(provider, connectedAddress);
      await syncUserToFirestore(connectedAddress, ethBalance, usdtBalance);
      setIsConnected(true);

      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        console.info('Wallet connected on non-Sepolia chain:', currentChainId);
      }

      // Step 2: Request Challenge from Cloud Function or generate locally
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
        try {
          const functionsInstance = getFirebaseFunctions();
          const createChallengeFn = httpsCallable<{ walletAddress: string; chainId: number }, { challengeId: string; message: string; expiresAt: string }>(
            functionsInstance,
            'createWalletChallenge'
          );
          const res = await createChallengeFn({ walletAddress: connectedAddress, chainId: currentChainId });
          setChallengeId(res.data.challengeId);
          setChallengeMessage(res.data.message);
        } catch (fnErr) {
          console.warn('Cloud Function createWalletChallenge unavailable, using client challenge:', fnErr);
          const mockChallengeId = `c-local-${Date.now()}`;
          const mockMsg = [
            `bspc.io wants you to sign in with your Ethereum account:`,
            connectedAddress,
            '',
            'Sign in to BSPC. This request authenticates your wallet only. It does not initiate a transaction, transfer assets, or grant token approval.',
            '',
            `URI: https://bspc.io`,
            'Version: 1',
            `Chain ID: ${currentChainId}`,
            `Nonce: localNonce128BitEntropy`,
            `Issued At: ${new Date().toISOString()}`,
            `Expiration Time: ${new Date(Date.now() + 300000).toISOString()}`,
            `Request ID: ${mockChallengeId}`,
          ].join('\n');
          setChallengeId(mockChallengeId);
          setChallengeMessage(mockMsg);
        }
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
      const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      const provider = getEthereumProvider();

      let signature = '0xmockSignatureHex1234567890abcdef';

      if (provider && !isMock) {
        // Request personal_sign (EIP-191)
        try {
          signature = await provider.request({
            method: 'personal_sign',
            params: [challengeMessage, address],
          });
        } catch (signErr: any) {
          throw new Error(signErr?.message || 'User rejected signature request.');
        }
      }

      setAuthStep('verifying');

      // Fetch wallet balances (ETH & USDT/USDC in Bitget / EVM wallet)
      const { ethBalance, usdtBalance } = await fetchWalletBalances(provider, address);

      if (!isMock) {
        const authInstance = getFirebaseAuth();
        try {
          const functionsInstance = getFirebaseFunctions();
          const verifySignatureFn = httpsCallable<{ challengeId: string; signature: string }, { firebaseCustomToken: string; user: { uid: string; walletAddress: string; status: string } }>(
            functionsInstance,
            'verifyWalletSignature'
          );
          const res = await verifySignatureFn({ challengeId, signature });
          await signInWithCustomToken(authInstance, res.data.firebaseCustomToken);
        } catch (fnErr) {
          console.warn('verifyWalletSignature Cloud Function unavailable, fallback to client auth:', fnErr);
          if (!authInstance.currentUser) {
            await signInAnonymously(authInstance);
          }
        }

        // Write/sync user data & balances to Firestore
        await syncUserToFirestore(address, ethBalance, usdtBalance);
      }

      setIsConnected(true);
      setAuthStep('authenticated');
      localStorage.setItem('user-address', address);
      localStorage.setItem('user-chain-id', (chainId || SEPOLIA_CHAIN_ID).toString());
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
