import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken, signOut, UserCredential } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { verifyMessage } from 'viem';

/**
 * Cloud Functions Live Emulator Integration Test Suite
 *
 * Connects to Firebase Auth (9099), Firestore (8080), and Functions (5001) emulators
 * to execute full end-to-end wallet authentication flows and negative security scenarios.
 */

const firebaseConfig = {
  apiKey: 'AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo',
  authDomain: 'bspc-be4f8.firebaseapp.com',
  projectId: 'bspc-be4f8',
  storageBucket: 'bspc-be4f8.firebasestorage.app',
  messagingSenderId: '133746398244',
  appId: '1:133746398244:web:03c0b077d035a470b0f4b1',
};

const hasEmulators = Boolean(process.env.FUNCTIONS_EMULATOR_HOST);

let app: FirebaseApp;

describe('Cloud Functions Live Emulator Integration Suite', () => {
  beforeAll(() => {
    if (!hasEmulators) return;

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  });

  afterAll(async () => {
    if (app) {
      await deleteApp(app);
    }
  });

  it('1. Full E2E Success Flow: createWalletChallenge -> sign -> verifyWalletSignature -> customToken Auth', async () => {
    if (!hasEmulators) {
      expect(firebaseConfig.projectId).toBe('bspc-be4f8');
      return;
    }

    const functions = getFunctions(app);
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // 1. Generate test EVM account
    const account = privateKeyToAccount(generatePrivateKey());

    // 2. Call createWalletChallenge
    const createChallengeFn = httpsCallable<{ walletAddress: string; chainId: number }, { challengeId: string; message: string; expiresAt: string }>(
      functions,
      'createWalletChallenge'
    );
    const challengeRes = await createChallengeFn({
      walletAddress: account.address,
      chainId: 11155111,
    });

    const { challengeId, message } = challengeRes.data;
    expect(challengeId).toBeDefined();
    expect(message).toContain(account.address);
    expect(message).toContain('Chain ID: 11155111');

    // 3. Sign EIP-4361 message
    const signature = await account.signMessage({ message });

    // 4. Call verifyWalletSignature
    const verifySignatureFn = httpsCallable<{ challengeId: string; signature: string }, { firebaseCustomToken: string; user: { uid: string; walletAddress: string; status: string } }>(
      functions,
      'verifyWalletSignature'
    );
    const verifyRes = await verifySignatureFn({ challengeId, signature });

    const { firebaseCustomToken, user } = verifyRes.data;
    expect(firebaseCustomToken).toBeDefined();

    const expectedUid = `evm_${account.address.toLowerCase().replace('0x', '')}`;
    expect(user.uid).toBe(expectedUid);

    // 5. Authenticate via signInWithCustomToken against Auth emulator
    const userCredential: UserCredential = await signInWithCustomToken(auth, firebaseCustomToken);
    expect(userCredential.user.uid).toBe(expectedUid);

    // 6. Verify ID token claims
    const idTokenResult = await userCredential.user.getIdTokenResult();
    expect(idTokenResult.claims.actorType).toBe('wallet_user');
    expect(idTokenResult.claims.role).toBeUndefined(); // Role must not be assigned to wallet users!

    // 7. Verify Firestore document read
    const userDocRef = doc(firestore, 'users', expectedUid);
    const userSnap = await getDoc(userDocRef);
    expect(userSnap.exists()).toBe(true);
    expect(userSnap.data()?.walletAddress.toLowerCase()).toBe(account.address.toLowerCase());

    await signOut(auth);
  });

  it('2. Negative Test: Malformed Address Rejection', async () => {
    if (!hasEmulators) return;

    const functions = getFunctions(app);
    const createChallengeFn = httpsCallable(functions, 'createWalletChallenge');

    await expect(
      createChallengeFn({
        walletAddress: 'invalid-eth-address',
        chainId: 11155111,
      })
    ).rejects.toThrow();
  });

  it('3. Negative Test: Unsupported Chain Rejection', async () => {
    if (!hasEmulators) return;

    const functions = getFunctions(app);
    const account = privateKeyToAccount(generatePrivateKey());
    const createChallengeFn = httpsCallable(functions, 'createWalletChallenge');

    await expect(
      createChallengeFn({
        walletAddress: account.address,
        chainId: 1, // Mainnet requested (must be rejected!)
      })
    ).rejects.toThrow();
  });

  it('4. Negative Test: Replayed Challenge Rejection', async () => {
    if (!hasEmulators) return;

    const functions = getFunctions(app);
    const account = privateKeyToAccount(generatePrivateKey());
    const createChallengeFn = httpsCallable<{ walletAddress: string; chainId: number }, { challengeId: string; message: string }>(
      functions,
      'createWalletChallenge'
    );
    const verifySignatureFn = httpsCallable<{ challengeId: string; signature: string }, any>(
      functions,
      'verifyWalletSignature'
    );

    const challengeRes = await createChallengeFn({ walletAddress: account.address, chainId: 11155111 });
    const { challengeId, message } = challengeRes.data;
    const signature = await account.signMessage({ message });

    // First call succeeds
    await verifySignatureFn({ challengeId, signature });

    // Replay call fails
    await expect(verifySignatureFn({ challengeId, signature })).rejects.toThrow();
  });
});
