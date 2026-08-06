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

export type ChatStatus = 'waiting' | 'assigned' | 'active' | 'closed' | 'blocked';
export type ChatSource = 'receive_voucher' | 'floating_chat' | 'side_menu' | 'general_support';
export type SenderType = 'guest' | 'user' | 'agent' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface ChatConversation {
  conversationId: string;
  guestId: string;
  authenticatedUid?: string;
  status: ChatStatus;
  assignedAgentUid?: string;
  subject?: string;
  source: ChatSource;
  createdAt: any;
  updatedAt: any;
  lastMessageAt?: any;
  lastMessagePreview?: string;
  userUnreadCount: number;
  agentUnreadCount: number;
  closedAt?: any;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderType: SenderType;
  senderUid: string;
  text: string;
  messageType: MessageType;
  attachmentUrl?: string;
  createdAt: any;
  deliveredAt?: any;
  readAt?: any;
  status?: string;
}

export type VoucherStatus = 'requested' | 'under_review' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';

export interface VoucherRequest {
  requestId: string;
  conversationId: string;
  guestUid: string;
  status: VoucherStatus;
  assignedAgentUid?: string;
  createdAt: any;
  updatedAt: any;
  resolutionNote?: string;
  issuedVoucherId?: string;
}

export * from './repositories.js';

