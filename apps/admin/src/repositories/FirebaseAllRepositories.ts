import {
  IApplicationRepository,
  ICollectionRecordRepository,
  ILedgerRepository,
  ITeamReportRepository,
  IOptionOrderRepository,
  INFTOrderRepository,
  IMiningRecordRepository,
  DbApplicationRequest,
  DbCollectionRecord,
  DbLedgerEntry,
  DbOptionOrder,
  DbNFTOrder,
  DbRewardRecord,
} from '@bspc/types';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, doc, getDocs, updateDoc, serverTimestamp, QueryDocumentSnapshot, query, limit } from 'firebase/firestore';

export class FirebaseApplicationRepository implements IApplicationRepository {
  async listRequests(): Promise<DbApplicationRequest[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'applicationRequests');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        requestId: d.id,
        userUid: data.userUid || '',
        walletAddress: data.walletAddress || '',
        amountBaseUnits: data.amountBaseUnits || '0 USDC',
        requestType: data.requestType || 'Standard',
        status: data.status || 'pending',
        reviewReason: data.reviewReason,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt,
        submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : data.submittedAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
      } as DbApplicationRequest;
    });
  }

  async reviewRequest(requestId: string, status: DbApplicationRequest['status'], reason?: string, reviewer?: string): Promise<void> {
    const db = getFirebaseFirestore();
    const docRef = doc(db, 'applicationRequests', requestId);
    await updateDoc(docRef, {
      status,
      reviewReason: reason || '',
      reviewedBy: reviewer || 'super_admin',
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export class FirebaseCollectionRecordRepository implements ICollectionRecordRepository {
  async listRecords(): Promise<DbCollectionRecord[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'collectionRecords');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        recordId: d.id,
        userUid: data.userUid || '',
        senderAddress: data.senderAddress || '',
        recipientAddress: data.recipientAddress || '',
        chainId: data.chainId || 11155111,
        tokenAddress: data.tokenAddress || '',
        amountBaseUnits: data.amountBaseUnits || '0 USDC',
        transactionHash: data.transactionHash || '',
        logIndex: data.logIndex || 0,
        blockNumber: data.blockNumber || 0,
        confirmationCount: data.confirmationCount || 12,
        status: data.status || 'confirmed',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      } as DbCollectionRecord;
    });
  }
}

export class FirebaseLedgerRepository implements ILedgerRepository {
  async listEntries(limitCount?: number): Promise<DbLedgerEntry[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'ledgerEntries');
    const q = limitCount ? query(colRef, limit(limitCount)) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        entryId: d.id,
        userUid: data.userUid || '',
        walletAddress: data.walletAddress || '',
        assetId: data.assetId || 'USDC',
        previousBaseUnits: data.previousBaseUnits || '0 USDC',
        changeBaseUnits: data.changeBaseUnits || '0 USDC',
        resultingBaseUnits: data.resultingBaseUnits || '0 USDC',
        reasonCode: data.reasonCode || 'ADJUSTMENT',
        relatedEntityType: data.relatedEntityType || 'system',
        relatedEntityId: data.relatedEntityId || '',
        transactionHash: data.transactionHash,
        source: data.source || 'system',
        actorUid: data.actorUid || 'system',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      } as DbLedgerEntry;
    });
  }
}

export class FirebaseTeamReportRepository implements ITeamReportRepository {
  async listReports(): Promise<any[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'teamReports');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));
  }
}

export class FirebaseOptionOrderRepository implements IOptionOrderRepository {
  async listOrders(): Promise<DbOptionOrder[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'optionOrders');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        orderId: d.id,
        userUid: data.userUid || '',
        walletAddress: data.walletAddress || '',
        orderNumber: data.orderNumber || d.id,
        pair: data.pair || 'BTC/USDT',
        direction: data.direction || 'UP',
        principalBaseUnits: data.principalBaseUnits || '100 USDT',
        feeBaseUnits: data.feeBaseUnits || '2 USDT',
        entryPrice: data.entryPrice || '65000.00',
        settlementPrice: data.settlementPrice || '65200.00',
        startAt: data.startAt?.toDate ? data.startAt.toDate().toISOString() : data.startAt || new Date().toISOString(),
        endAt: data.endAt?.toDate ? data.endAt.toDate().toISOString() : data.endAt || new Date().toISOString(),
        status: data.status || 'win',
        environment: data.environment || 'production',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
      } as DbOptionOrder;
    });
  }
}

export class FirebaseNFTOrderRepository implements INFTOrderRepository {
  async listOrders(): Promise<DbNFTOrder[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'nftOrders');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        orderId: d.id,
        userUid: data.userUid || '',
        walletAddress: data.walletAddress || '',
        chainId: data.chainId || 1,
        contractAddress: data.contractAddress || '',
        tokenId: data.tokenId || '1',
        orderNumber: data.orderNumber || d.id,
        nftName: data.nftName || 'NFT Asset',
        imageUrl: data.imageUrl || '',
        paymentTokenAddress: data.paymentTokenAddress || '',
        priceBaseUnits: data.priceBaseUnits || '1.0 ETH',
        totalBaseUnits: data.totalBaseUnits || '1.0 ETH',
        transactionHash: data.transactionHash || '',
        status: data.status || 'success',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
      } as DbNFTOrder;
    });
  }
}

export class FirebaseMiningRecordRepository implements IMiningRecordRepository {
  async listRecords(): Promise<DbRewardRecord[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'rewardRecords');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        recordId: d.id,
        userUid: data.userUid || '',
        walletAddress: data.walletAddress || '',
        chainId: data.chainId || 11155111,
        tokenAddress: data.tokenAddress || '',
        amountBaseUnits: data.amountBaseUnits || '0 USDT',
        transactionHash: data.transactionHash || '',
        logIndex: data.logIndex || 0,
        blockNumber: data.blockNumber || 0,
        recordType: data.recordType || 'Pledge Yield',
        verificationStatus: data.verificationStatus || 'verified',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      } as DbRewardRecord;
    });
  }
}
