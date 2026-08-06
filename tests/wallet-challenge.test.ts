import { describe, it, expect } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { verifyMessage } from 'viem';
import { buildEip4361Message } from '../packages/web3/src/index';

/**
 * Wallet Challenge & Signature Verification Unit Tests
 *
 * Uses deterministic viem accounts for live EIP-191 personal signature testing.
 */

describe('EIP-4361 Message & EIP-191 Signature Verification', () => {
  it('builds a standard EIP-4361 sign-in message with required fields', () => {
    const testAccount = privateKeyToAccount(generatePrivateKey());

    const message = buildEip4361Message({
      domain: 'bspc.io',
      address: testAccount.address,
      statement: 'Sign in to BSPC. This request authenticates your wallet only. It does not initiate a transaction, transfer assets, or grant token approval.',
      uri: 'https://bspc.io',
      chainId: 11155111,
      nonce: '1234567890abcdef1234567890abcdef',
      issuedAt: '2026-08-06T12:00:00.000Z',
      expiresAt: '2026-08-06T12:05:00.000Z',
      requestId: 'c-test-001',
    });

    expect(message).toContain('bspc.io wants you to sign in with your Ethereum account:');
    expect(message).toContain(testAccount.address);
    expect(message).toContain('Chain ID: 11155111');
    expect(message).toContain('Nonce: 1234567890abcdef1234567890abcdef');
    expect(message).toContain('Request ID: c-test-001');
    expect(message).toContain('Sign in to BSPC. This request authenticates your wallet only.');
  });

  it('successfully recovers address from a valid EIP-191 signature', async () => {
    const privateKey = generatePrivateKey();
    const testAccount = privateKeyToAccount(privateKey);

    const message = buildEip4361Message({
      domain: 'bspc.io',
      address: testAccount.address,
      statement: 'Sign in to BSPC. This request authenticates your wallet only.',
      uri: 'https://bspc.io',
      chainId: 11155111,
      nonce: 'nonce123',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      requestId: 'c-002',
    });

    const signature = await testAccount.signMessage({ message });

    const isValid = await verifyMessage({
      address: testAccount.address,
      message,
      signature,
    });

    expect(isValid).toBe(true);
  });

  it('rejects a signature created by a different private key (wrong signer)', async () => {
    const account1 = privateKeyToAccount(generatePrivateKey());
    const account2 = privateKeyToAccount(generatePrivateKey());

    const message = 'Sign in to BSPC';
    const signature = await account1.signMessage({ message });

    const isValid = await verifyMessage({
      address: account2.address, // Attempting to verify against wrong address
      message,
      signature,
    });

    expect(isValid).toBe(false);
  });

  it('rejects a signature if the stored message was tampered with', async () => {
    const account = privateKeyToAccount(generatePrivateKey());

    const originalMessage = 'Sign in to BSPC (Chain ID: 11155111)';
    const tamperedMessage = 'Sign in to BSPC (Chain ID: 1)'; // Changed chain ID

    const signature = await account.signMessage({ message: originalMessage });

    const isValid = await verifyMessage({
      address: account.address,
      message: tamperedMessage,
      signature,
    });

    expect(isValid).toBe(false);
  });
});

describe('Admin Authentication Boundary Isolation', () => {
  // Pure logic mock of verifyRole helper
  function verifyAdminRole(context: { auth?: { uid: string; token: { role?: string; actorType?: string } } }, allowedRoles: string[]) {
    if (!context.auth) {
      throw new Error('User must be authenticated.');
    }
    const role = context.auth.token.role;
    if (!role || !allowedRoles.includes(role)) {
      throw new Error('Unauthorized role.');
    }
    return context.auth.uid;
  }

  it('wallet_user actorType CANNOT access super_admin Cloud Functions', () => {
    const walletUserContext = {
      auth: {
        uid: 'evm_95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
        token: { actorType: 'wallet_user' }, // No admin role!
      },
    };

    expect(() => verifyAdminRole(walletUserContext, ['super_admin'])).toThrow('Unauthorized role.');
  });

  it('wallet_user actorType CANNOT access operations_admin Cloud Functions', () => {
    const walletUserContext = {
      auth: {
        uid: 'evm_95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
        token: { actorType: 'wallet_user' },
      },
    };

    expect(() => verifyAdminRole(walletUserContext, ['super_admin', 'operations_admin'])).toThrow('Unauthorized role.');
  });
});
