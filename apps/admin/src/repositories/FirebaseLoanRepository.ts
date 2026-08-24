import { ILoanRepository, DbLoanRequest } from '@bspc/types';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseLoanRepository implements ILoanRepository {
  async listLoanRequests(): Promise<DbLoanRequest[]> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'loanRequests');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        loanId: d.id,
        userUid: data.userUid || '',
        walletAddress: data.walletAddress || '',
        amountUsdt: data.amountUsdt || '0 USDT',
        interestRate: data.interestRate || '0.05%/day',
        termDays: data.termDays || 14,
        collateralUsdt: data.collateralUsdt || '0 USDT',
        status: data.status || 'pending',
        reviewReason: data.reviewReason,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt,
        repaidAt: data.repaidAt?.toDate ? data.repaidAt.toDate().toISOString() : data.repaidAt,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
      } as DbLoanRequest;
    });
  }

  async createLoanRequest(loan: Omit<DbLoanRequest, 'loanId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getFirebaseFirestore();
    const colRef = collection(db, 'loanRequests');
    const docRef = await addDoc(colRef, {
      ...loan,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async reviewLoanRequest(loanId: string, status: DbLoanRequest['status'], reason?: string, reviewer?: string): Promise<void> {
    const db = getFirebaseFirestore();
    const docRef = doc(db, 'loanRequests', loanId);
    await updateDoc(docRef, {
      status,
      reviewReason: reason || '',
      reviewedBy: reviewer || 'super_admin',
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async repayLoan(loanId: string): Promise<void> {
    const db = getFirebaseFirestore();
    const docRef = doc(db, 'loanRequests', loanId);
    await updateDoc(docRef, {
      status: 'repaid',
      repaidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
