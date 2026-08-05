import { describe, it, expect } from 'vitest';

/**
 * Blockchain indexer deduplication and validation logic tests.
 *
 * These test the pure logic of:
 *  - deduplication key generation (chainId + txHash + logIndex)
 *  - token address verification
 *  - recipient address verification
 *  - confirmation count threshold
 *  - malformed address rejection
 */

interface TransferLog {
  transactionHash: string;
  logIndex: number;
  blockNumber: number;
  from: string;
  to: string;
  amount: string;
  token: string;
  confirmationCount: number;
}

function buildDedupeId(chainId: number, txHash: string, logIndex: number): string {
  return `${chainId}-${txHash}-${logIndex}`;
}

function isValidRecipient(log: TransferLog, expectedRecipient: string): boolean {
  return log.to.toLowerCase() === expectedRecipient.toLowerCase();
}

function isValidToken(log: TransferLog, expectedToken: string): boolean {
  return log.token.toLowerCase() === expectedToken.toLowerCase();
}

function hasEnoughConfirmations(log: TransferLog, required: number): boolean {
  return log.confirmationCount >= required;
}

function isValidTxHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}

// ─── Deduplication Key ────────────────────────────────────────────────────────

describe('Deduplication key generation', () => {
  const txHash = '0x8d5c412ae2c78b27357492baee41378d38e21a4f0b2f5c7e7b6d19a2c3a5e8c1';

  it('generates a consistent key from chainId + txHash + logIndex', () => {
    const key = buildDedupeId(1, txHash, 0);
    expect(key).toBe(`1-${txHash}-0`);
  });

  it('generates different keys for the same tx but different log indices', () => {
    const key0 = buildDedupeId(1, txHash, 0);
    const key1 = buildDedupeId(1, txHash, 1);
    expect(key0).not.toBe(key1);
  });

  it('generates different keys for the same tx on different chains', () => {
    const mainnet = buildDedupeId(1, txHash, 0);
    const polygon = buildDedupeId(137, txHash, 0);
    expect(mainnet).not.toBe(polygon);
  });
});

// ─── Token & Recipient Verification ─────────────────────────────────────────

describe('Transfer log validation', () => {
  const validLog: TransferLog = {
    transactionHash: '0x8d5c412ae2c78b27357492baee41378d38e21a4f0b2f5c7e7b6d19a2c3a5e8c1',
    logIndex: 0,
    blockNumber: 18000005,
    from: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
    to: '0x000000000000000000000000000000000000dead',
    amount: '1000000000',
    token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    confirmationCount: 12,
  };

  const EXPECTED_RECIPIENT = '0x000000000000000000000000000000000000dead';
  const EXPECTED_TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const REQUIRED_CONFIRMATIONS = 6;

  it('accepts a log with the correct recipient address', () => {
    expect(isValidRecipient(validLog, EXPECTED_RECIPIENT)).toBe(true);
  });

  it('rejects a log with an unexpected recipient address', () => {
    const wrongLog = { ...validLog, to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' };
    expect(isValidRecipient(wrongLog, EXPECTED_RECIPIENT)).toBe(false);
  });

  it('accepts a log with the correct token contract', () => {
    expect(isValidToken(validLog, EXPECTED_TOKEN)).toBe(true);
  });

  it('rejects a log with a different token contract (USDT instead of USDC)', () => {
    const wrongLog = { ...validLog, token: '0xdac17f958d2ee523a2206206994597c13d831ec7' };
    expect(isValidToken(wrongLog, EXPECTED_TOKEN)).toBe(false);
  });
});

// ─── Confirmation Threshold ───────────────────────────────────────────────────

describe('Confirmation count threshold', () => {
  it('marks a log as confirmed when count meets threshold', () => {
    const log = { confirmationCount: 12 } as TransferLog;
    expect(hasEnoughConfirmations(log, 6)).toBe(true);
  });

  it('marks a log as unconfirmed when count is below threshold', () => {
    const log = { confirmationCount: 2 } as TransferLog;
    expect(hasEnoughConfirmations(log, 6)).toBe(false);
  });

  it('marks a log as confirmed exactly at the threshold (boundary)', () => {
    const log = { confirmationCount: 6 } as TransferLog;
    expect(hasEnoughConfirmations(log, 6)).toBe(true);
  });
});

// ─── Transaction Hash Validation ─────────────────────────────────────────────

describe('Transaction hash validation', () => {
  it('accepts a well-formed 32-byte hex hash with 0x prefix', () => {
    const hash = '0x8d5c412ae2c78b27357492baee41378d38e21a4f0b2f5c7e7b6d19a2c3a5e8c1';
    expect(isValidTxHash(hash)).toBe(true);
  });

  it('rejects a hash that is too short', () => {
    expect(isValidTxHash('0x1234')).toBe(false);
  });

  it('rejects a hash without 0x prefix', () => {
    const hash = '8d5c412ae2c78b27357492baee41378d38e21a4f0b2f5c7e7b6d19a2c3a5e8c1';
    expect(isValidTxHash(hash)).toBe(false);
  });

  it('rejects a hash with invalid hex characters', () => {
    const hash = '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ';
    expect(isValidTxHash(hash)).toBe(false);
  });
});
