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

export interface Eip4361Params {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version?: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  requestId: string;
}

export function buildEip4361Message(params: Eip4361Params): string {
  const checksummedAddress = sanitizeAndChecksumAddress(params.address);
  const version = params.version || '1';
  return [
    `${params.domain} wants you to sign in with your Ethereum account:`,
    checksummedAddress,
    '',
    params.statement,
    '',
    `URI: ${params.uri}`,
    `Version: ${version}`,
    `Chain ID: ${params.chainId}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
    `Expiration Time: ${params.expiresAt}`,
    `Request ID: ${params.requestId}`,
  ].join('\n');
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
      chainId: 11155111,
      name: 'Sepolia Testnet (Mock)',
      rpcUrl: 'https://rpc.sepolia.org',
      explorerUrl: 'https://sepolia.etherscan.io',
      usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      requiredConfirmations: 6,
      startIndexBlock: 5000000,
    };
  }

  const chainIdStr = process.env.NEXT_PUBLIC_CHAIN_ID;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL;
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  const decimalsStr = process.env.NEXT_PUBLIC_USDC_DECIMALS;
  const requiredConfirmationsStr = process.env.NEXT_PUBLIC_REQUIRED_CONFIRMATIONS || process.env.REQUIRED_CONFIRMATIONS;
  const startIndexBlockStr = process.env.NEXT_PUBLIC_START_INDEX_BLOCK || process.env.INDEXER_START_BLOCK;

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
    requiredConfirmations: requiredConfirmationsStr ? parseInt(requiredConfirmationsStr, 10) : 6,
    startIndexBlock: startIndexBlockStr ? parseInt(startIndexBlockStr, 10) : 5000000,
  };
}

export const SUPPORTED_CHAINS = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia Testnet',
    explorer: 'https://sepolia.etherscan.io',
    rpc: 'https://rpc.sepolia.org',
  },
} as const;

export function getExplorerTxLink(chainId: number, txHash: string): string {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  const baseExplorer = chain ? chain.explorer : 'https://sepolia.etherscan.io';
  return `${baseExplorer}/tx/${txHash}`;
}

export function getExplorerAddressLink(chainId: number, address: string): string {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  const baseExplorer = chain ? chain.explorer : 'https://sepolia.etherscan.io';
  return `${baseExplorer}/address/${address}`;
}
