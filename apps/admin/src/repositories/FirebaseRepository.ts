import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  DbUser,
  DbWithdrawalRequest,
  DbPledge,
} from '@bspc/types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "bspc-mock.firebaseapp.com",
  projectId: "bspc-mock",
  storageBucket: "bspc-mock.appspot.com",
  messagingSenderId: "12345678",
  appId: "1:1234:web:1234"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const functions = getFunctions(app);

export class FirebaseUserRepository implements IUserRepository {
  async listUsers(limitCount?: number): Promise<DbUser[]> {
    const listUsersFn = httpsCallable<{ limit?: number }, { success: boolean; users: DbUser[] }>(functions, 'listUsers');
    const res = await listUsersFn({ limit: limitCount });
    return res.data.users;
  }

  async getUser(uid: string): Promise<DbUser | null> {
    const getUserDetailFn = httpsCallable<{ uid: string }, { success: boolean; user: DbUser }>(functions, 'getUserDetail');
    const res = await getUserDetailFn({ uid });
    return res.data.user;
  }

  async updateUserStatus(uid: string, status: DbUser['status']): Promise<void> {
    const updateUserStatusFn = httpsCallable<{ uid: string; status: DbUser['status']; reason: string }, { success: boolean }>(
      functions,
      'updateUserStatus'
    );
    await updateUserStatusFn({ uid, status, reason: 'Status updated via Admin Console' });
  }
}

export class FirebaseWithdrawalRepository implements IWithdrawalRepository {
  async listRequests(): Promise<DbWithdrawalRequest[]> {
    const colRef = collection(db, 'withdrawalRequests');
    const snap = await getDocs(colRef);
    return snap.docs.map((doc: QueryDocumentSnapshot) => ({ requestId: doc.id, ...doc.data() } as DbWithdrawalRequest));
  }

  async reviewRequest(requestId: string, status: DbWithdrawalRequest['status'], reason?: string): Promise<void> {
    const reviewWithdrawalFn = httpsCallable<{ requestId: string; status: string; reason: string }, { success: boolean }>(
      functions,
      'reviewWithdrawal'
    );
    await reviewWithdrawalFn({ requestId, status, reason: reason || 'Reviewed' });
  }
}

export class FirebasePledgeRepository implements IPledgeRepository {
  async listPledges(): Promise<DbPledge[]> {
    const colRef = collection(db, 'pledges');
    const snap = await getDocs(colRef);
    return snap.docs.map((doc: QueryDocumentSnapshot) => ({ pledgeId: doc.id, ...doc.data() } as DbPledge));
  }
}
