import { UserRole } from './index.js';

export interface DbUser {
  uid: string;
  walletAddress: string;
  walletAddressLowercase: string;
  username: string;
  handle?: string;
  invitationCode?: string;
  referredByUid?: string;
  status: 'active' | 'suspended';
  authorizationStatus: string;
  collectionStatus: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
  lastLoginAt: string;
  balanceUsdt?: string;
  balanceEth?: string;
}

export interface DbWalletChallenge {
  challengeId: string;
  walletAddress: string;
  nonceHash: string;
  message: string;
  chainId: number;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface DbAdminProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  mfaRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbLoginEvent {
  eventId: string;
  uid: string;
  actorType: 'user' | 'admin';
  ipHash: string;
  countryCode: string;
  userAgentSummary: string;
  success: boolean;
  createdAt: string;
}

export interface DbReferralEdge {
  edgeId: string;
  parentUid: string;
  childUid: string;
  depth: number;
  createdAt: string;
}

export interface DbPledge {
  pledgeId: string;
  userUid: string;
  walletAddress: string;
  chainId: number;
  contractAddress: string;
  tokenAddress: string;
  transactionHash: string;
  principalBaseUnits: string; // token amounts stored as base-unit strings
  rewardRateReference: string;
  tier: string;
  startAt: string;
  endAt: string;
  status: 'mining' | 'completed' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface DbRewardRecord {
  recordId: string;
  userUid: string;
  walletAddress: string;
  chainId: number;
  tokenAddress: string;
  amountBaseUnits: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: number;
  recordType: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  createdAt: string;
}

export interface DbWithdrawalRequest {
  requestId: string;
  userUid: string;
  walletAddress: string;
  destinationAddress: string;
  chainId: number;
  tokenAddress: string;
  amountBaseUnits: string;
  feeBaseUnits: string;
  status: 'pending' | 'approved' | 'rejected' | 'clarification' | 'submitted';
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  transactionHash?: string;
  blockNumber?: number;
  submittedAt: string;
  updatedAt: string;
}

export interface DbApplicationRequest {
  requestId: string;
  userUid: string;
  walletAddress: string;
  amountBaseUnits: string;
  requestType: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface DbCollectionRecord {
  recordId: string;
  userUid: string;
  senderAddress: string;
  recipientAddress: string;
  chainId: number;
  tokenAddress: string;
  amountBaseUnits: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: number;
  confirmationCount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface DbNFTOrder {
  orderId: string;
  userUid: string;
  walletAddress: string;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  orderNumber: string;
  nftName: string;
  imageUrl: string;
  paymentTokenAddress: string;
  priceBaseUnits: string;
  totalBaseUnits: string;
  transactionHash: string;
  status: 'success' | 'cancelled' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface DbOptionOrder {
  orderId: string;
  userUid: string;
  walletAddress: string;
  orderNumber: string;
  pair: string;
  direction: 'UP' | 'DOWN';
  principalBaseUnits: string;
  feeBaseUnits: string;
  entryPrice: string;
  settlementPrice: string;
  startAt: string;
  endAt: string;
  status: 'win' | 'lose' | 'pending';
  environment: 'production' | 'demo';
  createdAt: string;
  updatedAt: string;
}

export interface DbLedgerEntry {
  entryId: string;
  userUid: string;
  walletAddress: string;
  assetId: string;
  previousBaseUnits: string;
  changeBaseUnits: string;
  resultingBaseUnits: string;
  reasonCode: string;
  relatedEntityType: string;
  relatedEntityId: string;
  transactionHash?: string;
  source: string;
  actorUid: string;
  createdAt: string;
}

export interface DbLoanRequest {
  loanId: string;
  userUid: string;
  walletAddress: string;
  amountUsdt: string;
  interestRate: string;
  termDays: number;
  collateralUsdt: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid' | 'overdue';
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  repaidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbAdminAuditLog {
  logId: string;
  actorUid: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  requestId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ipHash: string;
  createdAt: string;
}

// Unified Repository Abstraction Interfaces
export interface IUserRepository {
  listUsers(limit?: number): Promise<DbUser[]>;
  getUser(uid: string): Promise<DbUser | null>;
  updateUserStatus(uid: string, status: DbUser['status']): Promise<void>;
}

export interface IWithdrawalRepository {
  listRequests(): Promise<DbWithdrawalRequest[]>;
  reviewRequest(requestId: string, status: DbWithdrawalRequest['status'], reason?: string, reviewer?: string): Promise<void>;
}

export interface IPledgeRepository {
  listPledges(): Promise<DbPledge[]>;
}

export interface ILoanRepository {
  listLoanRequests(): Promise<DbLoanRequest[]>;
  createLoanRequest(loan: Omit<DbLoanRequest, 'loanId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string>;
  reviewLoanRequest(loanId: string, status: DbLoanRequest['status'], reason?: string, reviewer?: string): Promise<void>;
  repayLoan(loanId: string): Promise<void>;
}

export interface ILoginEventRepository {
  listLoginEvents(limit?: number): Promise<DbLoginEvent[]>;
}

