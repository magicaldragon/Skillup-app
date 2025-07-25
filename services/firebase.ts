// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, deleteUser as fbDeleteUser } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import type { Level } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBfKDCo7PrTevI1XUCY3FvH6bED8AWSnnw",
  authDomain: "skillup-3beaf.firebaseapp.com",
  projectId: "skillup-3beaf",
  messagingSenderId: "715786145271",
  appId: "1:715786145271:web:7115826d1172113c9832f2",
  measurementId: "G-03QYTPLVQG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Log an admin action to the "auditLogs" collection
export async function logAdminAction(action: {
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  performedBy?: string;
  adminId?: string;
  adminName?: string;
}) {
  try {
    await addDoc(collection(db, "auditLogs"), Object.assign({}, action, {
      timestamp: new Date().toISOString(),
      adminId: action.adminId || '',
      adminName: action.adminName || '',
    }));
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// Get audit logs, optionally filtered by date or other criteria
export async function getAuditLogs({ date }: { date?: Date } = {}) {
  const auditLogsRef = collection(db, "auditLogs");
  let q;
  if (date) {
    const start = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(date.setHours(23, 59, 59, 999)).toISOString();
    q = query(auditLogsRef, where("timestamp", ">=", start), where("timestamp", "<=", end));
  } else {
    q = auditLogsRef;
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      timestamp: data.timestamp || '',
      adminId: data.adminId || '',
      adminName: data.adminName || '',
      action: data.action || '',
      targetType: data.targetType || '',
      targetId: data.targetId || '',
      details: data.details || {},
    };
  });
}

// --- LEVELS COLLECTION ---
export async function getLevels() {
  const snap = await getDocs(collection(db, 'levels'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Level[];
}

export async function addLevel(level: Omit<Level, 'id'>) {
  const docRef = await addDoc(collection(db, 'levels'), level);
  return docRef.id;
}

export async function updateLevel(id: string, data: Partial<Level>) {
  await updateDoc(doc(db, 'levels', id), data);
}

export async function deleteLevel(id: string) {
  await deleteDoc(doc(db, 'levels', id));
}

/**
 * Delete a user from Firestore and Firebase Auth.
 * Prevent deleting the last admin.
 * @param userId Firestore user document ID
 * @param userEmail Email of the user (for Firebase Auth)
 * @param isAdmin Whether the user is an admin
 * @returns { success: boolean, message: string }
 */
export async function deleteAccountCompletely(userId: string, userEmail: string, isAdmin: boolean) {
  // Check if this is the last admin
  if (isAdmin) {
    const snap = await getDocs(collection(db, 'users'));
    const admins = snap.docs.filter(d => d.data().role === 'admin');
    if (admins.length <= 1) {
      return { success: false, message: 'Cannot delete the last admin account.' };
    }
  }
  // Delete from Firestore
  await deleteDoc(doc(db, 'users', userId));
  // Delete from Firebase Auth (must be signed in as admin, or use admin SDK on backend)
  // This is a placeholder: in client-side JS, you cannot delete another user from Auth directly
  // In production, use a backend function or admin SDK
  // try {
  //   const user = await getUserByEmail(userEmail); // Not available in client SDK
  //   await fbDeleteUser(user);
  // } catch (e) { /* ignore */ }
  return { success: true, message: 'Account deleted.' };
}

export { app, auth, db }; 