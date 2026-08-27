import { describe, it, expect } from 'vitest';

describe('Referrals & Withdraw Pages Unit Logic Tests', () => {
  describe('Account / Referrals Page logic', () => {
    it('generates consistent invite code format from wallet address', () => {
      const address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const uid = address.toLowerCase();
      const inviteCode = `BSP-${uid.slice(-6).toUpperCase()}`;
      expect(inviteCode).toBe('BSP-06EB48');
    });

    it('formats short address for account header', () => {
      const address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
      expect(shortAddr).toBe('0xa0b8...eb48');
    });
  });

  describe('Withdraw / Transfer Page Validation logic', () => {
    const balances = {
      pool: 150.50,
      funding: 50.00,
      spot: 0,
      futures: 10.00,
    };

    it('rejects transfer when amount is zero or negative', () => {
      const validateTransfer = (amt: number, from: string, to: string, balance: number) => {
        if (!amt || amt <= 0) return 'Please enter a valid amount.';
        if (from === to) return 'From and To must be different accounts.';
        if (amt > balance) return `Insufficient balance. Available: ${balance.toFixed(2)} USDC`;
        return null;
      };

      expect(validateTransfer(0, 'funding', 'pool', balances.funding)).toBe('Please enter a valid amount.');
      expect(validateTransfer(-10, 'funding', 'pool', balances.funding)).toBe('Please enter a valid amount.');
    });

    it('rejects transfer when From and To accounts are identical', () => {
      const validateTransfer = (amt: number, from: string, to: string, balance: number) => {
        if (!amt || amt <= 0) return 'Please enter a valid amount.';
        if (from === to) return 'From and To must be different accounts.';
        if (amt > balance) return `Insufficient balance. Available: ${balance.toFixed(2)} USDC`;
        return null;
      };

      expect(validateTransfer(25, 'pool', 'pool', balances.pool)).toBe('From and To must be different accounts.');
    });

    it('rejects transfer when amount exceeds selected account balance', () => {
      const validateTransfer = (amt: number, from: string, to: string, balance: number) => {
        if (!amt || amt <= 0) return 'Please enter a valid amount.';
        if (from === to) return 'From and To must be different accounts.';
        if (amt > balance) return `Insufficient balance. Available: ${balance.toFixed(2)} USDC`;
        return null;
      };

      expect(validateTransfer(100, 'funding', 'pool', balances.funding)).toBe('Insufficient balance. Available: 50.00 USDC');
    });

    it('allows valid transfer when amount is within account balance', () => {
      const validateTransfer = (amt: number, from: string, to: string, balance: number) => {
        if (!amt || amt <= 0) return 'Please enter a valid amount.';
        if (from === to) return 'From and To must be different accounts.';
        if (amt > balance) return `Insufficient balance. Available: ${balance.toFixed(2)} USDC`;
        return null;
      };

      expect(validateTransfer(25, 'funding', 'pool', balances.funding)).toBeNull();
    });
  });

  describe('Confirm Authorization Modal Formatting', () => {
    it('truncates hex addresses accurately', () => {
      function shortenHex(hex: string, prefixLen = 6, suffixLen = 6): string {
        if (hex.length <= prefixLen + suffixLen + 2) return hex;
        return `${hex.slice(0, prefixLen)}...${hex.slice(-suffixLen)}`;
      }

      const spender = '0xd1dd892f2931b61070891234567890abcdef1234';
      expect(shortenHex(spender)).toBe('0xd1dd...ef1234');
    });
  });
});
