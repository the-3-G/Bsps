import { UserRole } from '@bspc/types';

export interface MockUser {
  id: string;
  walletAddress: string;
  username: string;
  handle: string;
  inviteCode: string;
  email: string;
  role: UserRole;
  balanceUsdt: string;
  balanceEth: string;
  onChainVerifiedUsdc: string;
  withdrawalTotal: string;
  collectionTotal: string;
  status: 'active' | 'suspended';
  collectionStatus: 'active' | 'inactive';
  otherAuth: 'none' | 'two-factor' | 'email-verified';
  createdAt: string;
}

export interface MockPledgeRecord {
  id: string;
  userId: string;
  userAddress: string;
  tier: string;
  amountThreshold: string;
  miningRatio: string;
  miningReward: string;
  collectionAmount: string;
  topUpAmount: string;
  ethReward: string;
  participationTime: string;
  endTime: string;
  status: 'mining' | 'completed' | 'withdrawn';
  txHash: string;
}

export interface MockWithdrawalRequest {
  id: string;
  submissionTime: string;
  userId: string;
  username: string;
  userAddress: string;
  group: string;
  handler: string;
  amount: string;
  handlingFee: string;
  status: 'pending' | 'approved' | 'rejected' | 'clarification' | 'submitted';
  reviewReason?: string;
  reviewer?: string;
  reviewTime?: string;
  txHash?: string;
}

export interface MockMiningRecord {
  id: string;
  userId: string;
  username: string;
  userAddress: string;
  rewardAmount: string;
  ethAmount: string;
  recordType: 'Pledge Yield' | 'Pool Distribution' | 'Node Referral';
  source: string;
  txHash: string;
  createdAt: string;
  verificationState: 'on-chain verified' | 'off-chain record' | 'pending validation';
}

export interface MockCollectionRecord {
  id: string;
  userId: string;
  username: string;
  status: 'confirmed' | 'pending' | 'failed';
  sender: string;
  recipient: string;
  txHash: string;
  token: string;
  amount: string;
  chain: string;
  blockNumber: number;
  confirmations: number;
  createdAt: string;
}

export interface MockNFTOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userAddress: string;
  contractName: string;
  nftName: string;
  picture: string; // URL mock
  tokenId: string;
  contractAddress: string;
  price: string;
  totalPrice: string;
  status: 'success' | 'cancelled' | 'pending';
  createdAt: string;
  txHash: string;
}

export interface MockLoginRecord {
  id: string;
  userAddress: string;
  ipAddress: string;
  approxLocation: string;
  device: string;
  result: 'success' | 'failed';
  timestamp: string;
}

export interface MockUSDCLedgerRecord {
  id: string;
  userId: string;
  userAddress: string;
  previousAmount: string;
  changeAmount: string;
  newAmount: string;
  changeReason: string;
  relatedEntity: string;
  txHash: string;
  actor: string;
  source: string;
  createdAt: string;
}

export interface MockTeamReportRow {
  id: string;
  leaderId: string;
  leaderUsername: string;
  leaderAddress: string;
  directUsersCount: number;
  descendantsCount: number;
  incomeSummary: string;
  expenditureSummary: string;
  cumulativeCollection: string;
  cumulativeWithdrawals: string;
  verifiedUsdc: string;
  recordedDate: string;
}

// Helper to generate deterministic data
function makeDeterministicRandom(seed: number) {
  return function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

const random = makeDeterministicRandom(42);

function generateAddress(index: number): string {
  const hex = index.toString(16).padStart(40, '0');
  return `0x${hex}`;
}

function generateTxHash(index: number): string {
  const hex = index.toString(16).padStart(64, 'a');
  return `0x${hex}`;
}

export const mockUsers: MockUser[] = Array.from({ length: 25 }, (_, i) => ({
  id: `u-${i + 1}`,
  walletAddress: generateAddress(100 + i),
  username: `user_${i + 1}`,
  handle: `@user_${i + 1}`,
  inviteCode: `INV-${1000 + i}`,
  email: `user${i + 1}@mock-crypto.io`,
  role: i === 0 ? 'admin' : i === 1 ? 'manager' : 'user',
  balanceUsdt: Math.floor(random() * 50000 + 1000).toString(),
  balanceEth: (random() * 5 + 0.1).toFixed(4),
  onChainVerifiedUsdc: Math.floor(random() * 40000 + 500).toString(),
  withdrawalTotal: Math.floor(random() * 5000).toString(),
  collectionTotal: Math.floor(random() * 12000).toString(),
  status: i % 8 === 0 ? 'suspended' : 'active',
  collectionStatus: i % 5 === 0 ? 'inactive' : 'active',
  otherAuth: i % 3 === 0 ? 'two-factor' : i % 3 === 1 ? 'email-verified' : 'none',
  createdAt: new Date(2026, 7, 1 + (i % 5)).toISOString(),
}));

export const mockPledges: MockPledgeRecord[] = Array.from({ length: 15 }, (_, i) => ({
  id: `p-${i + 1}`,
  userId: `u-${(i % 25) + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  tier: `Tier ${['A', 'B', 'C', 'D'][i % 4]}`,
  amountThreshold: (1000 * (i + 1)).toString(),
  miningRatio: `${(1.5 + (i % 3) * 0.5).toFixed(1)}%`,
  miningReward: Math.floor(random() * 200 + 10).toString(),
  collectionAmount: Math.floor(random() * 800 + 50).toString(),
  topUpAmount: Math.floor(random() * 1500 + 100).toString(),
  ethReward: (random() * 0.5).toFixed(4),
  participationTime: new Date(2026, 7, 2 + (i % 4)).toISOString(),
  endTime: new Date(2026, 8, 2 + (i % 4)).toISOString(),
  status: i % 5 === 0 ? 'completed' : 'mining',
  txHash: generateTxHash(200 + i),
}));

export const mockWithdrawals: MockWithdrawalRequest[] = Array.from({ length: 10 }, (_, i) => ({
  id: `w-${i + 1}`,
  submissionTime: new Date(2026, 7, 5 + i).toISOString(),
  userId: `u-${(i % 25) + 1}`,
  username: `user_${(i % 25) + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  group: i % 2 === 0 ? 'VIP-Group' : 'Normal-Group',
  handler: `operator_${(i % 3) + 1}`,
  amount: Math.floor(random() * 2000 + 100).toString() + (i % 2 === 0 ? ' USDC' : ' ETH'),
  handlingFee: (random() * 5 + 1).toFixed(2) + (i % 2 === 0 ? ' USDC' : ' ETH'),
  status: i % 3 === 0 ? 'approved' : i % 4 === 0 ? 'rejected' : 'pending',
  reviewReason: i % 4 === 0 ? 'Inconsistent transaction signatures detected' : undefined,
  reviewer: i % 3 === 0 || i % 4 === 0 ? `admin_${(i % 2) + 1}` : undefined,
  reviewTime: i % 3 === 0 || i % 4 === 0 ? new Date(2026, 7, 6 + i).toISOString() : undefined,
  txHash: i % 3 === 0 ? generateTxHash(300 + i) : undefined,
}));

export const mockMiningRecords: MockMiningRecord[] = Array.from({ length: 25 }, (_, i) => ({
  id: `m-${i + 1}`,
  userId: `u-${(i % 25) + 1}`,
  username: `user_${(i % 25) + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  rewardAmount: Math.floor(random() * 500 + 10).toString() + ' USDC',
  ethAmount: (random() * 0.1 + 0.005).toFixed(4) + ' ETH',
  recordType: ['Pledge Yield', 'Pool Distribution', 'Node Referral'][i % 3] as 'Pledge Yield' | 'Pool Distribution' | 'Node Referral',
  source: `Node-${['Alpha', 'Beta', 'Gamma'][i % 3]}`,
  txHash: generateTxHash(600 + i),
  createdAt: new Date(2026, 7, 10 + (i % 3)).toISOString(),
  verificationState: ['on-chain verified', 'off-chain record', 'pending validation'][i % 3] as 'on-chain verified' | 'off-chain record' | 'pending validation',
}));

export const mockCollections: MockCollectionRecord[] = Array.from({ length: 20 }, (_, i) => ({
  id: `c-${i + 1}`,
  userId: `u-${(i % 25) + 1}`,
  username: `user_${(i % 25) + 1}`,
  status: i % 10 === 9 ? 'failed' : i % 5 === 0 ? 'pending' : 'confirmed',
  sender: generateAddress(100 + (i % 25)),
  recipient: '0x000000000000000000000000000000000000dEaD',
  txHash: generateTxHash(400 + i),
  token: i % 2 === 0 ? 'USDT' : 'USDC',
  amount: Math.floor(random() * 3000 + 200).toString(),
  chain: 'Ethereum Mainnet',
  blockNumber: 18000000 + i,
  confirmations: i % 5 === 0 ? 3 : 12,
  createdAt: new Date(2026, 7, 12 + (i % 3)).toISOString(),
}));

export const mockCollectionRecords = mockCollections;

export interface MockOptionOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userAddress: string;
  pair: string;
  direction: 'UP' | 'DOWN';
  principal: string;
  fee: string;
  entryPrice: string;
  settlementPrice: string;
  startTime: string;
  endTime: string;
  status: 'win' | 'lose' | 'pending';
  env: 'production' | 'test';
}

export const mockOptionOrders: MockOptionOrder[] = Array.from({ length: 15 }, (_, i) => ({
  id: `opt-${i + 1}`,
  orderNumber: `OPT-ORD-${2000 + i}`,
  userId: `u-${(i % 5) + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  pair: 'BTC/USDT',
  direction: i % 2 === 0 ? 'UP' : 'DOWN',
  principal: `${100 * (i + 1)} USDT`,
  fee: `${(1.5 * (i + 1)).toFixed(2)} USDT`,
  entryPrice: (60000 + i * 150).toFixed(2),
  settlementPrice: (i % 3 === 0 ? 60500 + i * 150 : 59500 + i * 150).toFixed(2),
  startTime: new Date(2026, 7, 10 + i).toISOString(),
  endTime: new Date(2026, 7, 10 + i, 12, 5).toISOString(),
  status: i % 3 === 0 ? 'win' : i % 3 === 1 ? 'lose' : 'pending',
  env: 'production',
}));


export const mockNFTOrders: MockNFTOrder[] = Array.from({ length: 8 }, (_, i) => ({
  id: `n-${i + 1}`,
  orderNumber: `NFT-ORD-${3000 + i}`,
  userId: `u-${(i % 5) + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  contractName: 'CryptoPunks Core',
  nftName: `CryptoPunk #${1000 + i}`,
  picture: '/placeholder-nft.png',
  tokenId: (5000 + i).toString(),
  contractAddress: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
  price: (random() * 1.5 + 0.1).toFixed(2),
  totalPrice: (random() * 1.5 + 0.1).toFixed(2),
  status: i === 7 ? 'cancelled' : 'success',
  createdAt: new Date(2026, 7, 15 + i).toISOString(),
  txHash: generateTxHash(700 + i),
}));

export const mockLoginRecords: MockLoginRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: `l-${i + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  ipAddress: `192.168.1.${50 + i}`,
  approxLocation: ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Singapore'][i % 4],
  device: i % 2 === 0 ? 'Chrome / Windows' : 'Safari / iPhone',
  result: i % 6 === 0 ? 'failed' : 'success',
  timestamp: new Date(2026, 7, 20 + i).toISOString(),
}));

export const mockUSDCLedger: MockUSDCLedgerRecord[] = Array.from({ length: 20 }, (_, i) => ({
  id: `led-${i + 1}`,
  userId: `u-${(i % 25) + 1}`,
  userAddress: generateAddress(100 + (i % 25)),
  previousAmount: Math.floor(random() * 20000 + 4000).toString() + ' USDC',
  changeAmount: Math.floor(random() * 1000 + 50).toString() + ' USDC',
  newAmount: Math.floor(random() * 25000 + 5000).toString() + ' USDC',
  changeReason: ['Pledge Deposit Swept', 'Option Order Win', 'Yield Distribution', 'Adjustment Rollback', 'Platform Fee Charge'][i % 5],
  relatedEntity: `ent-${1000 + i}`,
  txHash: generateTxHash(500 + i),
  actor: `node_operator_${(i % 3) + 1}`,
  source: i % 2 === 0 ? 'smart contract Sweeper' : 'manual admin correction',
  createdAt: new Date(2026, 7, 22 + (i % 3)).toISOString(),
}));

export const mockTeamReports: MockTeamReportRow[] = Array.from({ length: 10 }, (_, i) => ({
  id: `tr-${i + 1}`,
  leaderId: `u-${i + 1}`,
  leaderUsername: `leader_${i + 1}`,
  leaderAddress: generateAddress(100 + i),
  directUsersCount: Math.floor(random() * 8 + 2),
  descendantsCount: Math.floor(random() * 30 + 10),
  incomeSummary: `+${Math.floor(random() * 25000 + 5000)} USDC`,
  expenditureSummary: `-${Math.floor(random() * 12000 + 1000)} USDC`,
  cumulativeCollection: `${Math.floor(random() * 50000 + 10000)} USDC`,
  cumulativeWithdrawals: `${Math.floor(random() * 20000 + 2000)} USDC`,
  verifiedUsdc: `${Math.floor(random() * 40000 + 5000)} USDC`,
  recordedDate: new Date(2026, 7, 25 + (i % 2)).toISOString(),
}));

export interface MockLoanRecord {
  id: string;
  userId: string;
  walletAddress: string;
  amount: string;
  interestRate: string;
  termDays: number;
  collateral: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid' | 'overdue';
  reviewReason?: string;
  reviewer?: string;
  submissionTime: string;
  reviewTime?: string;
}

export const mockLoans: MockLoanRecord[] = Array.from({ length: 8 }, (_, i) => ({
  id: `loan-${i + 1}`,
  userId: `u-${(i % 5) + 1}`,
  walletAddress: generateAddress(100 + i),
  amount: `${1000 * (i + 1)} USDT`,
  interestRate: `${(0.05 + (i % 3) * 0.02).toFixed(2)}%/day`,
  termDays: [7, 14, 30][i % 3],
  collateral: `${1500 * (i + 1)} USDT`,
  status: i % 4 === 0 ? 'pending' : i % 4 === 1 ? 'approved' : i % 4 === 2 ? 'repaid' : 'rejected',
  reviewReason: i % 4 === 3 ? 'Insufficient active pledge collateral' : undefined,
  reviewer: i % 4 !== 0 ? `admin_${(i % 2) + 1}` : undefined,
  submissionTime: new Date(2026, 7, 10 + i).toISOString(),
  reviewTime: i % 4 !== 0 ? new Date(2026, 7, 11 + i).toISOString() : undefined,
}));

