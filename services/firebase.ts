import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query as fsQuery, where, orderBy, getDocs } from 'firebase/firestore';
import type { AuditLogEntry } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBfKDCo7PrTevI1XUCY3FvH6bED8AWSnnw",
  authDomain: "skillup-3beaf.firebaseapp.com",
  projectId: "skillup-3beaf",
  storageBucket: "skillup-3beaf.appspot.com",
  messagingSenderId: "715786145271",
  appId: "1:715786145271:web:7115826d1172113c9832f2",
  measurementId: "G-03QYTPLVQG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const AUDIT_LOG_COLLECTION = 'auditLogs';

export async function logAdminAction(entry: Partial<AuditLogEntry>) {
  const now = new Date();
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), {
    ...entry,
    timestamp: now.toISOString(),
  });
}

export async function getAuditLogs({ date, adminId }: { date?: string, adminId?: string } = {}): Promise<AuditLogEntry[]> {
  const colRef = collection(db, AUDIT_LOG_COLLECTION);
  const filters = [];
  if (date) {
    filters.push(where('timestamp', '>=', `${date}T00:00:00.000Z`));
    filters.push(where('timestamp', '<=', `${date}T23:59:59.999Z`));
  }
  if (adminId) {
    filters.push(where('adminId', '==', adminId));
  }
  const q = filters.length > 0
    ? fsQuery(colRef, ...filters, orderBy('timestamp', 'desc'))
    : fsQuery(colRef, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
} 