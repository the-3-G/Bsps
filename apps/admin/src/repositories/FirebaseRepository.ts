import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  DbUser,
  DbWithdrawalRequest,
  DbPledge,
} from '@bspc/types';
import { getFirebaseFirestore, getFirebaseFunctions } from '@bspc/firebase';
import { collection, doc, getDocs, getDoc, query, limit, QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export class FirebaseUserRepository implements IUserRepository {
  async listUsers(limitCount?: number): Promise<DbUser[]> {
    try {
      // Primary path: server-side Cloud Function (requires Blaze plan + deployed functions)
      const functions = getFirebaseFunctions();
      const listUsersFn = httpsCallable<{ limit?: number }, { success: boolean; users: DbUser[] }>(functions, 'listUsers');
      const res = await listUsersFn({ limit: limitCount });
      return res.data.users;
    } catch {
      // Fallback: direct Firestore read (Spark UAT / staging without deployed Cloud Functions)
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'users');
      const q = limitCount ? query(colRef, limit(limitCount)) : colRef;
      const snap = await getDocs(q);
      return snap.docs.map((d: QueryDocumentSnapshot) => {
        const data = d.data();
        const lastLoginAt = data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : (typeof data.lastLoginAt === 'string' ? data.lastLoginAt : new Date().toISOString());
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());
        return {
          uid: d.id,
          username: data.username || `User_${d.id.slice(-4).toUpperCase()}`,
          walletAddress: data.walletAddress || d.id,
          balanceUsdt: data.balanceUsdt || '0.00 USDT',
          balanceEth: data.balanceEth || '0.0000 ETH',
          status: data.status || 'active',
          collectionStatus: data.collectionStatus || 'active',
          authorizationStatus: data.authorizationStatus || 'authorized',
          ...data,
          lastLoginAt,
          createdAt,
        } as unknown as DbUser;
      });
    }
  }

  async getUser(uid: string): Promise<DbUser | null> {
    try {
      // Primary path: server-side Cloud Function
      const functions = getFirebaseFunctions();
      const getUserDetailFn = httpsCallable<{ uid: string }, { success: boolean; user: DbUser }>(functions, 'getUserDetail');
      const res = await getUserDetailFn({ uid });
      return res.data.user;
    } catch {
      // Fallback: direct Firestore document read
      const db = getFirebaseFirestore();
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { uid: snap.id, ...snap.data() } as DbUser;
    }
  }

  async updateUserStatus(uid: string, status: DbUser['status']): Promise<void> {
    const functions = getFirebaseFunctions();
    const updateUserStatusFn = httpsCallable<{ uid: string; status: DbUser['status']; reason: string }, { success: boolean }>(
      functions,
      'updateUserStatus'
    );
    await updateUserStatusFn({ uid, status, reason: 'Status updated via Admin Console' });
  }
}

export class FirebaseWithdrawalRepository implements IWithdrawalRepository {
  async listRequests(): Promise<DbWithdrawalRequest[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'withdrawalRequests');
    const snap = await getDocs(colRef);
    return snap.docs.map((doc: QueryDocumentSnapshot) => ({ requestId: doc.id, ...doc.data() } as DbWithdrawalRequest));
  }

  async reviewRequest(requestId: string, status: DbWithdrawalRequest['status'], reason?: string): Promise<void> {
    const functions = getFirebaseFunctions();
    const reviewWithdrawalFn = httpsCallable<{ requestId: string; status: string; reason: string }, { success: boolean }>(
      functions,
      'reviewWithdrawal'
    );
    await reviewWithdrawalFn({ requestId, status, reason: reason || 'Reviewed' });
  }
}

export class FirebasePledgeRepository implements IPledgeRepository {
  async listPledges(): Promise<DbPledge[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'pledges');
    const snap = await getDocs(colRef);
    return snap.docs.map((doc: QueryDocumentSnapshot) => ({ pledgeId: doc.id, ...doc.data() } as DbPledge));
  }
}
