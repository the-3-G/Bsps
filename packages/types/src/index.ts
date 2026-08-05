export type UserRole =
  | 'super_admin'
  | 'operations_admin'
  | 'finance_reviewer'
  | 'support'
  | 'auditor'
  | 'read_only'
  | 'admin'
  | 'manager'
  | 'user';

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  details: Record<string, unknown>;
  timestamp: string; // ISO String
}

export interface OnChainTxInfo {
  chainId: number;
  contractAddress?: string;
  transactionHash: string;
  blockNumber: number;
  status: 'pending' | 'success' | 'failed';
  confirmedAt: string; // ISO String
}

export interface Web3WalletSession {
  address: string;
  chainId: number;
  connectedAt: string; // ISO String
  providerName: string; // 'Bitget' | 'WalletConnect' etc.
}

export interface AdminWalletConfig {
  id: string;
  address: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export * from './repositories.js';
