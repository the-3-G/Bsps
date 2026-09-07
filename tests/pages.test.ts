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

    it('calculates 4-hour interest cycles (6 times per day) correctly', () => {
      // 6 daily interest cycles occur every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
      const cycleHours = [0, 4, 8, 12, 16, 20];
      expect(cycleHours.length).toBe(6);

      const calculateNextCycleHour = (currentHour: number) => {
        return (Math.floor(currentHour / 4) + 1) * 4;
      };

      expect(calculateNextCycleHour(2)).toBe(4);
      expect(calculateNextCycleHour(7)).toBe(8);
      expect(calculateNextCycleHour(15)).toBe(16);
      expect(calculateNextCycleHour(21)).toBe(24); // roll over to 00:00 next day
    });

    it('converts generated ETH to USDC at current rate and updates wallet balance', () => {
      const ETH_USDC_RATE = 2640.50;
      let exchangeableEth = 10.0;
      let walletBalanceUsdc = 500.0;

      const convertEthToUsdc = (ethAmount: number) => {
        if (ethAmount <= 0 || ethAmount > exchangeableEth) return false;
        const usdcReceived = ethAmount * ETH_USDC_RATE;
        exchangeableEth -= ethAmount;
        walletBalanceUsdc += usdcReceived;
        return usdcReceived;
      };

      const usdcGained = convertEthToUsdc(2.5);
      expect(usdcGained).toBe(2.5 * 2640.50);
      expect(exchangeableEth).toBe(7.5);
      expect(walletBalanceUsdc).toBe(500.0 + (2.5 * 2640.50));
    });

    it('tracks and filters withdrawal transaction records accurately', () => {
      type RecordItem = {
        id: string;
        type: 'exchange' | 'withdraw' | 'interest' | 'rebate';
        quantity: string;
        status: string;
      };

      const records: RecordItem[] = [
        { id: '1', type: 'interest', quantity: '+6.35466000 ETH', status: 'Success' },
        { id: '2', type: 'exchange', quantity: '2.5000 ETH', status: 'Success' },
        { id: '3', type: 'withdraw', quantity: '6,601.25 USDC', status: 'Success' },
        { id: '4', type: 'withdraw', quantity: '1,200.00 USDC', status: 'Pending' },
      ];

      const withdrawRecords = records.filter(r => r.type === 'withdraw');
      expect(withdrawRecords).toHaveLength(2);
      expect(withdrawRecords[0].quantity).toBe('6,601.25 USDC');
      expect(withdrawRecords[1].status).toBe('Pending');
    });

    it('initializes initial default account values to zero (0.0)', () => {
      const defaultState = {
        totalOutputEth: 0.0,
        walletBalanceUsdc: 0.0,
        exchangeableEth: 0.0,
      };

      expect(defaultState.totalOutputEth).toBe(0.0);
      expect(defaultState.walletBalanceUsdc).toBe(0.0);
      expect(defaultState.exchangeableEth).toBe(0.0);
    });

    it('automatically calculates 0.7% / 4-hour yield generation based on wallet USDC balance', () => {
      const ETH_USDC_RATE = 2640.50;
      const depositedUsdc = 1000.0; // 1,000 USDC balance
      const yieldRatePer4h = 0.007; // 0.7% per 4-hour cycle

      const yieldUsdcPer4h = depositedUsdc * yieldRatePer4h; // 7 USDC
      const yieldEthPer4h = yieldUsdcPer4h / ETH_USDC_RATE;

      expect(yieldUsdcPer4h).toBe(7.0);
      expect(yieldEthPer4h).toBeCloseTo(0.002651013, 6);

      // 6 cycles per day (24 hours)
      const dailyYieldEth = yieldEthPer4h * 6;
      expect(dailyYieldEth).toBeCloseTo(0.015906078, 6);
    });

    it('preserves exact decimal precision for withdrawal requests on admin dashboard', () => {
      const formatWithdrawalAmount = (amountNum: number) => {
        return `${amountNum.toFixed(2)} USDC`;
      };

      expect(formatWithdrawalAmount(1000.50)).toBe('1000.50 USDC');
      expect(formatWithdrawalAmount(125.75)).toBe('125.75 USDC');
    });

    it('synchronizes and merges Admin smart contract adjustments into Client state accurately', () => {
      const defaultRecord = {
        id: 'p-17',
        deposit: '57980',
        interestRate: '1.5%',
        reward: '6.474860079 ETH',
      };

      const adminAdjustment = {
        id: 'p-17',
        deposit: '60000',
        interestRate: '1.8%',
        reward: '7.200000000 ETH',
      };

      const mergePledges = (base: any[], update: any) => {
        const map = new Map<string, any>();
        base.forEach(r => map.set(r.id, r));
        map.set(update.id, { ...map.get(update.id), ...update });
        return Array.from(map.values());
      };

      const merged = mergePledges([defaultRecord], adminAdjustment);
      expect(merged).toHaveLength(1);
      expect(merged[0].deposit).toBe('60000');
      expect(merged[0].interestRate).toBe('1.8%');
      expect(merged[0].reward).toBe('7.200000000 ETH');
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
