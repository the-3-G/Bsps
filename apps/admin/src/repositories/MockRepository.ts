import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  DbUser,
  DbWithdrawalRequest,
  DbPledge,
} from '@bspc/types';
import { mockUsers, mockWithdrawals, mockPledges } from '../mocks/db';

function isHiddenUser(user: any): boolean {
  if (!user) return false;
  const username = String(user.username || '').toLowerCase();
  const email = String(user.email || '').toLowerCase();
  const uid = String(user.uid || user.id || '').toLowerCase();
  const handle = String(user.handle || '').toLowerCase();

  return (
    username === 'blen' ||
    email === 'blenzeru27@gmail.com' ||
    email.includes('blenzeru27') ||
    uid === 'blen' ||
    handle === '@blen'
  );
}

export class MockUserRepository implements IUserRepository {
  async listUsers(): Promise<DbUser[]> {
    return mockUsers
      .filter((u) => !isHiddenUser(u))
      .map((u) => ({
        uid: u.id,
        walletAddress: u.walletAddress,
        walletAddressLowercase: u.walletAddress.toLowerCase(),
        username: u.username,
        handle: u.handle,
        invitationCode: u.inviteCode,
        referredByUid: undefined,
        status: u.status,
        authorizationStatus: 'verified',
        collectionStatus: u.collectionStatus,
        createdAt: u.createdAt,
        updatedAt: u.createdAt,
        lastLoginAt: u.createdAt,
      }));
  }

  async getUser(uid: string): Promise<DbUser | null> {
    const u = mockUsers.find((user) => user.id === uid);
    if (!u) return null;
    return {
      uid: u.id,
      walletAddress: u.walletAddress,
      walletAddressLowercase: u.walletAddress.toLowerCase(),
      username: u.username,
      handle: u.handle,
      invitationCode: u.inviteCode,
      referredByUid: undefined,
      status: u.status,
      authorizationStatus: 'verified',
      collectionStatus: u.collectionStatus,
      createdAt: u.createdAt,
      updatedAt: u.createdAt,
      lastLoginAt: u.createdAt,
    };
  }

  async updateUserStatus(uid: string, status: DbUser['status']): Promise<void> {
    const idx = mockUsers.findIndex((u) => u.id === uid);
    if (idx !== -1) {
      mockUsers[idx] = {
        ...mockUsers[idx],
        status,
      };
    }
  }
}

export class MockWithdrawalRepository implements IWithdrawalRepository {
  async listRequests(): Promise<DbWithdrawalRequest[]> {
    return mockWithdrawals.map((w) => ({
      requestId: w.id,
      userUid: w.userId,
      walletAddress: w.userAddress,
      destinationAddress: w.userAddress,
      chainId: 1,
      tokenAddress: '0x0000000000000000000000000000000000000000',
      amountBaseUnits: w.amount,
      feeBaseUnits: w.handlingFee,
      status: w.status,
      reviewReason: w.reviewReason,
      reviewedBy: w.reviewer,
      reviewedAt: w.reviewTime,
      transactionHash: w.txHash,
      submittedAt: w.submissionTime,
      updatedAt: w.submissionTime,
    }));
  }

  async reviewRequest(
    requestId: string,
    status: DbWithdrawalRequest['status'],
    reason?: string,
    reviewer?: string
  ): Promise<void> {
    const idx = mockWithdrawals.findIndex((w) => w.id === requestId);
    if (idx !== -1) {
      mockWithdrawals[idx] = {
        ...mockWithdrawals[idx],
        status: status as 'pending' | 'approved' | 'rejected',
        reviewReason: reason,
        reviewer,
        reviewTime: new Date().toISOString(),
      };
    }
  }
}

export class MockPledgeRepository implements IPledgeRepository {
  async listPledges(): Promise<DbPledge[]> {
    return mockPledges.map((p) => ({
      pledgeId: p.id,
      userUid: p.userId,
      walletAddress: p.userAddress,
      chainId: 1,
      contractAddress: '0x0000000000000000000000000000000000000000',
      tokenAddress: '0x0000000000000000000000000000000000000000',
      transactionHash: p.txHash,
      principalBaseUnits: p.amountThreshold,
      rewardRateReference: p.miningRatio,
      tier: p.tier,
      startAt: p.participationTime,
      endAt: p.endTime,
      status: p.status,
      createdAt: p.participationTime,
      updatedAt: p.participationTime,
    }));
  }
}
