import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Wallet authentication nonce & signature security tests.
 *
 * These tests validate the pure logic of:
 *  - nonce expiry enforcement
 *  - single-use (replay prevention)
 *  - domain binding
 *  - chain ID binding
 */

interface WalletChallenge {
  challengeId: string;
  walletAddress: string;
  nonceHash: string;
  message: string;
  chainId: number;
  expiresAt: string;
  usedAt: string | null;
}

function isExpired(challenge: WalletChallenge): boolean {
  return new Date(challenge.expiresAt) < new Date();
}

function isUsed(challenge: WalletChallenge): boolean {
  return challenge.usedAt !== null;
}

function verifyChallengeDomain(message: string, expectedDomain: string): boolean {
  return message.includes(`domain: ${expectedDomain}`);
}

function verifyChallengeChainId(message: string, chainId: number): boolean {
  return message.includes(`chainId: ${chainId}`);
}

// ─── Nonce Expiry ─────────────────────────────────────────────────────────────

describe('Nonce expiry enforcement', () => {
  it('accepts a valid non-expired challenge', () => {
    const future = new Date(Date.now() + 600_000).toISOString();
    const challenge: WalletChallenge = {
      challengeId: 'c-001',
      walletAddress: '0xabc',
      nonceHash: 'hash',
      message: 'Sign this',
      chainId: 1,
      expiresAt: future,
      usedAt: null,
    };
    expect(isExpired(challenge)).toBe(false);
  });

  it('rejects an expired challenge', () => {
    const past = new Date(Date.now() - 1).toISOString();
    const challenge: WalletChallenge = {
      challengeId: 'c-002',
      walletAddress: '0xabc',
      nonceHash: 'hash',
      message: 'Sign this',
      chainId: 1,
      expiresAt: past,
      usedAt: null,
    };
    expect(isExpired(challenge)).toBe(true);
  });
});

// ─── Nonce Replay Prevention ──────────────────────────────────────────────────

describe('Nonce replay prevention', () => {
  it('accepts a challenge that has not been used', () => {
    const challenge: WalletChallenge = {
      challengeId: 'c-003',
      walletAddress: '0xabc',
      nonceHash: 'hash',
      message: 'Sign this',
      chainId: 1,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      usedAt: null,
    };
    expect(isUsed(challenge)).toBe(false);
  });

  it('blocks a challenge that has already been used (reused nonce)', () => {
    const challenge: WalletChallenge = {
      challengeId: 'c-004',
      walletAddress: '0xabc',
      nonceHash: 'hash',
      message: 'Sign this',
      chainId: 1,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      usedAt: new Date().toISOString(),
    };
    expect(isUsed(challenge)).toBe(true);
  });
});

// ─── Domain Binding ───────────────────────────────────────────────────────────

describe('Signature domain binding', () => {
  it('verifies challenge message contains the correct domain', () => {
    const message = 'domain: bspc.io\nnonce: abc123\nchainId: 1';
    expect(verifyChallengeDomain(message, 'bspc.io')).toBe(true);
  });

  it('rejects a message from a wrong domain (phishing prevention)', () => {
    const message = 'domain: evil.site\nnonce: abc123\nchainId: 1';
    expect(verifyChallengeDomain(message, 'bspc.io')).toBe(false);
  });
});

// ─── Chain ID Binding ─────────────────────────────────────────────────────────

describe('Signature chain ID binding', () => {
  it('verifies challenge message contains the correct chain ID', () => {
    const message = 'domain: bspc.io\nnonce: abc123\nchainId: 1';
    expect(verifyChallengeChainId(message, 1)).toBe(true);
  });

  it('rejects a message with wrong chain ID (cross-chain replay prevention)', () => {
    const message = 'domain: bspc.io\nnonce: abc123\nchainId: 56';
    expect(verifyChallengeChainId(message, 1)).toBe(false);
  });
});
