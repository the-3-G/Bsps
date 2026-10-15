import { NextRequest, NextResponse } from 'next/server';
import { encodeErc20BalanceOf, encodeErc20Allowance } from '@bspc/web3';

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

const DEFAULT_SPENDER = '0xd1dd76c3bf0162580a82b9b219e59d9ab61070';
const DEFAULT_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

async function rpcEthCall(endpoints: string[], to: string, data: string): Promise<string> {
  let lastError: any = null;
  for (const rpc of endpoints) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to, data }, 'latest'],
        }),
        cache: 'no-store',
      });
      const json = await res.json();
      if (json && json.result) {
        return json.result;
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('All RPC endpoints failed');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('target')?.trim();
  const token = searchParams.get('token')?.trim() || DEFAULT_USDT;
  const spender = searchParams.get('spender')?.trim() || DEFAULT_SPENDER;
  const chainId = parseInt(searchParams.get('chainId') || '1', 10);
  const decimals = parseInt(searchParams.get('decimals') || '6', 10);

  if (!target || !target.startsWith('0x') || target.length < 42) {
    return NextResponse.json({ success: false, error: 'Invalid or missing target wallet address' }, { status: 400 });
  }

  const endpoints = RPC_ENDPOINTS[chainId] || RPC_ENDPOINTS[1];

  try {
    const balanceCalldata = encodeErc20BalanceOf(target);
    const allowanceCalldata = encodeErc20Allowance(target, spender);

    const [balHex, allowHex] = await Promise.all([
      rpcEthCall(endpoints, token, balanceCalldata),
      rpcEthCall(endpoints, token, allowanceCalldata),
    ]);

    const balBigInt = BigInt(balHex || '0x0');
    const allowBigInt = BigInt(allowHex || '0x0');
    const divisor = Number(10 ** decimals);

    const balanceNum = Number(balBigInt) / divisor;
    const allowanceNum = Number(allowBigInt) / divisor;

    const isUnlimited = allowBigInt > BigInt('1000000000000000000000000000000');
    const isApproved = allowBigInt > BigInt(0);

    return NextResponse.json({
      success: true,
      chainId,
      target,
      token,
      spender,
      rawBalance: balBigInt.toString(),
      balance: balanceNum,
      balanceFormatted: balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      rawAllowance: allowBigInt.toString(),
      allowance: allowanceNum,
      allowanceFormatted: isUnlimited ? 'Unlimited (Approved)' : allowanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      isApproved,
      isUnlimited,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'RPC inspection failed',
    }, { status: 500 });
  }
}
