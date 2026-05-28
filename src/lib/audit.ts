import { AuditLog, AuditEventType, UserProfile } from '../types';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

export const auditService = {
  log: async (
    user: UserProfile, 
    eventType: AuditEventType, 
    description: string, 
    severity: AuditLog['severity'] = 'INFO',
    metadata?: Record<string, unknown>
  ) => {
    const newLog: Omit<AuditLog, 'id'> = {
      timestamp: new Date().toISOString(),
      userId: user.uid,
      userEmail: user.email,
      eventType,
      description,
      severity,
      metadata: metadata as Record<string, string | number | boolean | null>,
      ipAddress: 'detected-by-server' 
    };

    try {
      const docRef = await addDoc(collection(db, 'auditLogs'), newLog);
      console.log(`[AUDIT] ${eventType}: ${description}`);
      return { id: docRef.id, ...newLog } as AuditLog;
    } catch (error) {
      console.error("Audit log failed:", error);
      return null;
    }
  },

  getLogs: async (): Promise<AuditLog[]> => {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error("Fetch audit logs failed:", error);
      return [];
    }
  },

  clearLogs: async () => {
    // Audit logs should generally be immutable, but if needed for demo:
    console.warn("Clear logs not implemented for Firestore security reasons.");
  }
};
