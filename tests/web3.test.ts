import { describe, it, expect } from 'vitest';
import { sanitizeAndChecksumAddress, truncateAddress, loadChainConfig } from '../packages/web3/src/index';

// ─── sanitizeAndChecksumAddress ──────────────────────────────────────────────

describe('sanitizeAndChecksumAddress', () => {
  it('returns a checksummed EIP-55 address for a valid lowercase address', () => {
    const lower = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = sanitizeAndChecksumAddress(lower);
    expect(result).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
  });

  it('accepts a fully lowercase address and returns its EIP-55 checksummed form', () => {
    // viem accepts lowercase addresses and checksums them
    const lower = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = sanitizeAndChecksumAddress(lower);
    expect(result).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
  });

  it('rejects a mixed-case address that is not valid EIP-55 checksum (viem strict mode)', () => {
    // viem treats partially-wrong checksum mixed-case as invalid
    const badMixed = '0xa0B86991c6218b36c1d19d4a2e9EB0CE3606eB48';
    expect(() => sanitizeAndChecksumAddress(badMixed)).toThrow('Invalid Ethereum address');
  });

  it('throws for a completely invalid address string', () => {
    expect(() => sanitizeAndChecksumAddress('not-an-address')).toThrow('Invalid Ethereum address');
  });

  it('throws for an address that is too short', () => {
    expect(() => sanitizeAndChecksumAddress('0x1234')).toThrow('Invalid Ethereum address');
  });

  it('throws for an empty string', () => {
    expect(() => sanitizeAndChecksumAddress('')).toThrow('Invalid Ethereum address');
  });
});

// ─── truncateAddress ─────────────────────────────────────────────────────────

describe('truncateAddress', () => {
  it('returns a formatted abbreviated string for a valid address', () => {
    const address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = truncateAddress(address);
    expect(result).toMatch(/^0xA0b8.*eB48$/);
    expect(result).toContain('...');
  });

  it('returns an empty string for an empty input', () => {
    expect(truncateAddress('')).toBe('');
  });

  it('returns the original string for an invalid address (graceful fallback)', () => {
    const bad = 'invalid-string';
    expect(truncateAddress(bad)).toBe(bad);
  });

  it('respects custom start and end length parameters', () => {
    const address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = truncateAddress(address, 4, 4);
    expect(result.length).toBeLessThan(20);
  });
});

// ─── loadChainConfig ─────────────────────────────────────────────────────────

describe('loadChainConfig (mock mode)', () => {
  it('returns a well-formed config when mock mode is active', () => {
    // NEXT_PUBLIC_USE_MOCK_DATA defaults to truthy/not-'false' in test environment
    const config = loadChainConfig();
    expect(config.chainId).toBeTypeOf('number');
    expect(config.rpcUrl).toMatch(/^https?:\/\//);
    expect(config.explorerUrl).toMatch(/^https?:\/\//);
    expect(config.usdcAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(config.decimals).toBe(6);
    expect(config.requiredConfirmations).toBeGreaterThanOrEqual(1);
  });
});
