import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LoanRequest, Investment, Repayment, AuditLog } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firestoreService = {
  // Loans
  async getLoans(): Promise<LoanRequest[]> {
    const path = 'loans';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanRequest));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getMyLoans(userId: string): Promise<LoanRequest[]> {
    const path = 'loans';
    try {
      const q = query(collection(db, path), where('borrowerId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanRequest));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getIssuedLoans(lenderId: string): Promise<LoanRequest[]> {
    const path = 'loans';
    try {
      const q = query(collection(db, path), where('lenderId', '==', lenderId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanRequest));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createLoan(loan: Omit<LoanRequest, 'id' | 'createdAt'>): Promise<string> {
    const path = 'loans';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...loan,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Investments
  async getInvestments(lenderId?: string): Promise<Investment[]> {
    const path = 'investments';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (lenderId) {
        q = query(q, where('lenderId', '==', lenderId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createInvestment(investment: Omit<Investment, 'id' | 'createdAt'>): Promise<string> {
    const path = 'investments';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...investment,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Repayments
  async getRepayments(loanId?: string): Promise<Repayment[]> {
    const path = 'repayments';
    try {
      let q = query(collection(db, path), orderBy('dueDate', 'asc'));
      if (loanId) {
        q = query(q, where('loanId', '==', loanId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Repayment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async updateLoan(loanId: string, data: Partial<LoanRequest>): Promise<void> {
    const path = `loans/${loanId}`;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'loans', loanId);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async createRepayment(repayment: Omit<Repayment, 'id'>): Promise<string> {
    const path = 'repayments';
    try {
      const docRef = await addDoc(collection(db, path), repayment);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const path = 'auditLogs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};
