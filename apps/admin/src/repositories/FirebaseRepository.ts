import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  DbUser,
  DbWithdrawalRequest,
  DbPledge,
} from '@bspc/types';
import { getFirebaseFirestore, getFirebaseFunctions } from '@bspc/firebase';
import { collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export class FirebaseUserRepository implements IUserRepository {
  async listUsers(limitCount?: number): Promise<DbUser[]> {
    const functions = getFirebaseFunctions();
    const listUsersFn = httpsCallable<{ limit?: number }, { success: boolean; users: DbUser[] }>(functions, 'listUsers');
    const res = await listUsersFn({ limit: limitCount });
    return res.data.users;
  }

  async getUser(uid: string): Promise<DbUser | null> {
    const functions = getFirebaseFunctions();
    const getUserDetailFn = httpsCallable<{ uid: string }, { success: boolean; user: DbUser }>(functions, 'getUserDetail');
    const res = await getUserDetailFn({ uid });
    return res.data.user;
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
