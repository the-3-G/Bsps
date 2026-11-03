import { NextRequest, NextResponse } from 'next/server';

const RPC_ENDPOINTS: Record<number, string[]> = {
  1: [
    'https://ethereum-rpc.publicnode.com',
    'https://cloudflare-eth.com',
    'https://eth.llamarpc.com',
  ],
  11155111: [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://rpc.sepolia.org',
  ],
};

// ERC-20 Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const TOKENS: Record<number, { symbol: string; address: string; decimals: number }[]> = {
  1: [
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  ],
  11155111: [
    { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
  ],
};

async function rpcCall(endpoints: string[], method: string, params: any[]): Promise<any> {
  let lastError: any = null;
  for (const rpc of endpoints) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
        cache: 'no-store',
      });
      const json = await res.json();
      if (json && json.result !== undefined) {
        return json.result;
      }
      if (json?.error) {
        lastError = new Error(json.error.message || 'RPC error');
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('All RPC endpoints failed');
}

function padTopicAddress(addr: string): string {
  const clean = addr.toLowerCase().replace(/^0x/, '');
  return `0x${clean.padStart(64, '0')}`;
}

function unpadTopicAddress(topic: string): string {
  return `0x${topic.slice(-40)}`.toLowerCase();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipient = searchParams.get('recipient')?.trim() || '0xd1dd9d76c3bf0162580a82b9b219e59d9ab61070';
  const chainId = parseInt(searchParams.get('chainId') || '1', 10);
  const blockSpan = parseInt(searchParams.get('blocks') || '45000', 10); // ~6 days of blocks per RPC query limit

  if (!recipient.startsWith('0x') || recipient.length < 40) {
    return NextResponse.json({ success: false, error: 'Invalid recipient address' }, { status: 400 });
  }

  const endpoints = RPC_ENDPOINTS[chainId] || RPC_ENDPOINTS[1];
  const tokens = TOKENS[chainId] || TOKENS[1];

  try {
    const latestBlockHex = await rpcCall(endpoints, 'eth_blockNumber', []);
    const latestBlock = parseInt(latestBlockHex, 16);
    const fromBlock = Math.max(0, latestBlock - blockSpan);
    const fromBlockHex = `0x${fromBlock.toString(16)}`;
    const recipientTopic = padTopicAddress(recipient);

    const transfers: any[] = [];

    for (const token of tokens) {
      try {
        const logs = await rpcCall(endpoints, 'eth_getLogs', [
          {
            fromBlock: fromBlockHex,
            toBlock: 'latest',
            address: token.address,
            topics: [TRANSFER_TOPIC, null, recipientTopic],
          },
        ]);

        if (Array.isArray(logs)) {
          for (const log of logs) {
            const rawVal = BigInt(log.data || '0x0');
            const amount = Number(rawVal) / 10 ** token.decimals;
            const blockNum = parseInt(log.blockNumber, 16);
            transfers.push({
              id: `onchain-${log.transactionHash}-${log.logIndex}`,
              txHash: log.transactionHash,
              sender: log.topics?.[1] ? unpadTopicAddress(log.topics[1]) : '0x...',
              recipient: log.topics?.[2] ? unpadTopicAddress(log.topics[2]) : recipient.toLowerCase(),
              token: token.symbol,
              amount,
              amountFormatted: amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              blockNumber: blockNum,
              chain: chainId === 1 ? 'Ethereum Mainnet' : 'Sepolia',
              status: 'confirmed',
              source: 'onchain_verified',
            });
          }
        }
      } catch {
        // Ignore single token log error if range is too wide on some public RPCs
      }
    }

    return NextResponse.json({
      success: true,
      recipient,
      chainId,
      latestBlock,
      fromBlock,
      transfers: transfers.sort((a, b) => b.blockNumber - a.blockNumber),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to query on-chain transfers',
        transfers: [],
      },
      { status: 500 }
    );
  }
}

