import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  ILoanRepository,
  ILoginEventRepository,
  IApplicationRepository,
  ICollectionRecordRepository,
  ILedgerRepository,
  ITeamReportRepository,
  IOptionOrderRepository,
  INFTOrderRepository,
  IMiningRecordRepository,
  DbUser,
  DbWithdrawalRequest,
  DbPledge,
  DbLoanRequest,
  DbLoginEvent,
  DbApplicationRequest,
  DbCollectionRecord,
  DbLedgerEntry,
  DbOptionOrder,
  DbNFTOrder,
  DbRewardRecord,
} from '@bspc/types';
import {
  mockUsers,
  mockWithdrawals,
  mockPledges,
  mockLoans,
  mockLoginRecords,
  mockCollectionRecords,
  mockUSDCLedger,
  mockTeamReports,
  mockOptionOrders,
  mockNFTOrders,
  mockMiningRecords,
} from '../mocks/db';

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
      mockUsers[idx].status = status;
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
      status: w.status as 'pending' | 'approved' | 'rejected',
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

export class MockLoanRepository implements ILoanRepository {
  async listLoanRequests(): Promise<DbLoanRequest[]> {
    return mockLoans.map((l) => ({
      loanId: l.id,
      userUid: l.userId,
      walletAddress: l.walletAddress,
      amountUsdt: l.amount,
      interestRate: l.interestRate,
      termDays: l.termDays,
      collateralUsdt: l.collateral,
      status: l.status,
      reviewReason: l.reviewReason,
      reviewedBy: l.reviewer,
      reviewedAt: l.reviewTime,
      createdAt: l.submissionTime,
      updatedAt: l.submissionTime,
    }));
  }

  async createLoanRequest(loan: Omit<DbLoanRequest, 'loanId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newId = `loan-${mockLoans.length + 1}`;
    mockLoans.unshift({
      id: newId,
      userId: loan.userUid,
      walletAddress: loan.walletAddress,
      amount: loan.amountUsdt,
      interestRate: loan.interestRate,
      termDays: loan.termDays,
      collateral: loan.collateralUsdt,
      status: 'pending',
      submissionTime: new Date().toISOString(),
    });
    return newId;
  }

  async reviewLoanRequest(loanId: string, status: DbLoanRequest['status'], reason?: string, reviewer?: string): Promise<void> {
    const idx = mockLoans.findIndex((l) => l.id === loanId);
    if (idx !== -1) {
      mockLoans[idx] = {
        ...mockLoans[idx],
        status,
        reviewReason: reason,
        reviewer,
        reviewTime: new Date().toISOString(),
      };
    }
  }

  async repayLoan(loanId: string): Promise<void> {
    const idx = mockLoans.findIndex((l) => l.id === loanId);
    if (idx !== -1) {
      mockLoans[idx] = {
        ...mockLoans[idx],
        status: 'repaid',
      };
    }
  }
}

export class MockLoginEventRepository implements ILoginEventRepository {
  async listLoginEvents(limitCount?: number): Promise<DbLoginEvent[]> {
    const slice = limitCount ? mockLoginRecords.slice(0, limitCount) : mockLoginRecords;
    return slice.map((rec) => ({
      eventId: rec.id,
      uid: rec.userAddress,
      actorType: 'user',
      ipHash: rec.ipAddress,
      countryCode: rec.approxLocation,
      userAgentSummary: rec.device,
      success: rec.result === 'success',
      createdAt: rec.timestamp,
    }));
  }
}

export class MockApplicationRepository implements IApplicationRepository {
  async listRequests(): Promise<DbApplicationRequest[]> {
    return Array.from({ length: 10 }, (_, i) => ({
      requestId: `req-${i + 1}`,
      userUid: `u-${(i % 5) + 1}`,
      walletAddress: `0x${(100 + i).toString(16).padStart(40, '0')}`,
      amountBaseUnits: `${1000 * (i + 1)} USDC`,
      requestType: i % 2 === 0 ? 'VIP-Group' : 'Normal-Group',
      status: i % 3 === 0 ? 'approved' : i % 4 === 0 ? 'rejected' : 'pending',
      reviewReason: i % 4 === 0 ? 'Verification of deposits failed' : undefined,
      reviewedBy: i % 3 === 0 || i % 4 === 0 ? `admin_${(i % 2) + 1}` : undefined,
      reviewedAt: i % 3 === 0 || i % 4 === 0 ? new Date(2026, 7, 6 + i).toISOString() : undefined,
      submittedAt: new Date(2026, 7, 5 + i).toISOString(),
      updatedAt: new Date(2026, 7, 5 + i).toISOString(),
    }));
  }

  async reviewRequest(requestId: string, status: DbApplicationRequest['status'], reason?: string): Promise<void> {
    // Mock review update
  }
}

export class MockCollectionRecordRepository implements ICollectionRecordRepository {
  async listRecords(): Promise<DbCollectionRecord[]> {
    return mockCollectionRecords.map((r) => ({
      recordId: r.id,
      userUid: r.userId,
      senderAddress: r.sender,
      recipientAddress: r.recipient,
      chainId: 1,
      tokenAddress: r.token,
      amountBaseUnits: r.amount,
      transactionHash: r.txHash,
      logIndex: 0,
      blockNumber: r.blockNumber,
      confirmationCount: r.confirmations,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }
}

export class MockLedgerRepository implements ILedgerRepository {
  async listEntries(limitCount?: number): Promise<DbLedgerEntry[]> {
    const slice = limitCount ? mockUSDCLedger.slice(0, limitCount) : mockUSDCLedger;
    return slice.map((l) => ({
      entryId: l.id,
      userUid: l.userId,
      walletAddress: l.userAddress,
      assetId: 'USDC',
      previousBaseUnits: l.previousAmount,
      changeBaseUnits: l.changeAmount,
      resultingBaseUnits: l.newAmount,
      reasonCode: l.changeReason,
      relatedEntityType: 'system',
      relatedEntityId: l.relatedEntity,
      transactionHash: l.txHash,
      source: l.source,
      actorUid: l.actor,
      createdAt: l.createdAt,
    }));
  }
}

export class MockTeamReportRepository implements ITeamReportRepository {
  async listReports(): Promise<any[]> {
    return mockTeamReports;
  }
}

export class MockOptionOrderRepository implements IOptionOrderRepository {
  async listOrders(): Promise<DbOptionOrder[]> {
    return mockOptionOrders.map((o) => ({
      orderId: o.id,
      userUid: o.userId,
      walletAddress: o.userAddress,
      orderNumber: o.orderNumber,
      pair: o.pair,
      direction: o.direction,
      principalBaseUnits: o.principal,
      feeBaseUnits: o.fee,
      entryPrice: o.entryPrice,
      settlementPrice: o.settlementPrice,
      startAt: o.startTime,
      endAt: o.endTime,
      status: o.status,
      environment: (o.env === 'test' ? 'demo' : o.env) as 'production' | 'demo',

      createdAt: o.startTime,
      updatedAt: o.endTime,
    }));
  }
}

export class MockNFTOrderRepository implements INFTOrderRepository {
  async listOrders(): Promise<DbNFTOrder[]> {
    return mockNFTOrders.map((n) => ({
      orderId: n.id,
      userUid: n.userId,
      walletAddress: n.userAddress,
      chainId: 1,
      contractAddress: n.contractAddress,
      tokenId: n.tokenId,
      orderNumber: n.orderNumber,
      nftName: n.nftName,
      imageUrl: n.picture,
      paymentTokenAddress: '0x0000000000000000000000000000000000000000',
      priceBaseUnits: n.price,
      totalBaseUnits: n.totalPrice,
      transactionHash: n.txHash,
      status: n.status,
      createdAt: n.createdAt,
      updatedAt: n.createdAt,
    }));
  }
}

export class MockMiningRecordRepository implements IMiningRecordRepository {
  async listRecords(): Promise<DbRewardRecord[]> {
    return mockMiningRecords.map((m) => ({
      recordId: m.id,
      userUid: m.userId,
      walletAddress: m.userAddress,
      chainId: 1,
      tokenAddress: '0x0000000000000000000000000000000000000000',
      amountBaseUnits: m.rewardAmount,
      transactionHash: m.txHash,
      logIndex: 0,
      blockNumber: 18000000,
      recordType: m.recordType,
      verificationStatus: m.verificationState === 'on-chain verified' ? 'verified' : 'pending',
      createdAt: m.createdAt,
    }));
  }
}
