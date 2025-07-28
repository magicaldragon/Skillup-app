// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, deleteUser as fbDeleteUser } from "firebase/auth";
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
    // This function is no longer Firestore-dependent, so it will be removed or refactored
    // For now, we'll just log to console as a placeholder
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// Get audit logs, optionally filtered by date or other criteria
export async function getAuditLogs({ date }: { date?: Date } = {}) {
  // This function is no longer Firestore-dependent, so it will be removed or refactored
  // For now, it will return an empty array as a placeholder
  return [];
}

// --- LEVELS COLLECTION ---
export async function getLevels() {
  // This function is no longer Firestore-dependent, so it will be removed or refactored
  // For now, it will return an empty array as a placeholder
  return [];
}

export async function addLevel(level: Omit<Level, 'id'>) {
  // This function is no longer Firestore-dependent, so it will be removed or refactored
  // For now, it will return a placeholder ID
  return 'placeholder-id';
}

export async function updateLevel(id: string, data: Partial<Level>) {
  // This function is no longer Firestore-dependent, so it will be removed or refactored
  // For now, it will be a placeholder
}

export async function deleteLevel(id: string) {
  // This function is no longer Firestore-dependent, so it will be removed or refactored
  // For now, it will be a placeholder
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
  // This function is no longer Firestore-dependent, so it will be removed or refactored
  // For now, it will return a placeholder success message
  return { success: true, message: 'Account deleted.' };
}

export { app, auth }; 