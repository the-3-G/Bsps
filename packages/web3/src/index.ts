import { getAddress, isAddress } from 'viem';

export function sanitizeAndChecksumAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return getAddress(address);
}

export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return '';
  try {
    const checksummed = sanitizeAndChecksumAddress(address);
    return `${checksummed.slice(0, startLength)}...${checksummed.slice(-endLength)}`;
  } catch {
    return address;
  }
}

// Chain Configuration Layer loaded from Environment
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  usdcAddress: string;
  decimals: number;
  requiredConfirmations: number;
  startIndexBlock: number;
}

export function loadChainConfig(): ChainConfig {
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
  if (isMock) {
    // Return deterministic mock settings for local development
    return {
      chainId: 1,
      name: 'Ethereum Mainnet (Mock)',
      rpcUrl: 'https://cloudflare-eth.com',
      explorerUrl: 'https://etherscan.io',
      usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
      requiredConfirmations: 6,
      startIndexBlock: 18000000,
    };
  }

  const chainIdStr = process.env.NEXT_PUBLIC_CHAIN_ID;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL;
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  const decimalsStr = process.env.NEXT_PUBLIC_USDC_DECIMALS;
  const requiredConfirmationsStr = process.env.NEXT_PUBLIC_REQUIRED_CONFIRMATIONS;
  const startIndexBlockStr = process.env.NEXT_PUBLIC_START_INDEX_BLOCK;

  // Fail safely and throw explicit configuration errors
  if (!chainIdStr || !rpcUrl || !explorerUrl || !usdcAddress || !decimalsStr) {
    throw new Error(
      'CRITICAL BLOCKCHAIN CONFIGURATION ERROR: Missing required environment variables. ' +
      'Please check NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_RPC_URL, NEXT_PUBLIC_EXPLORER_URL, and NEXT_PUBLIC_USDC_ADDRESS.'
    );
  }

  return {
    chainId: parseInt(chainIdStr, 10),
    name: `EVM Chain ID ${chainIdStr}`,
    rpcUrl,
    explorerUrl,
    usdcAddress: sanitizeAndChecksumAddress(usdcAddress),
    decimals: parseInt(decimalsStr, 10),
    requiredConfirmations: requiredConfirmationsStr ? parseInt(requiredConfirmationsStr, 10) : 12,
    startIndexBlock: startIndexBlockStr ? parseInt(startIndexBlockStr, 10) : 0,
  };
}

export const SUPPORTED_CHAINS = {
  mainnet: {
    id: 1,
    name: 'Ethereum Mainnet',
    explorer: 'https://etherscan.io',
    rpc: 'https://cloudflare-eth.com',
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia Testnet',
    explorer: 'https://sepolia.etherscan.io',
    rpc: 'https://rpc.sepolia.org',
  },
} as const;

export function getExplorerTxLink(chainId: number, txHash: string): string {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  const baseExplorer = chain ? chain.explorer : 'https://etherscan.io';
  return `${baseExplorer}/tx/${txHash}`;
}

export function getExplorerAddressLink(chainId: number, address: string): string {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  const baseExplorer = chain ? chain.explorer : 'https://etherscan.io';
  return `${baseExplorer}/address/${address}`;
}
