// firebase.ts - Firebase Configuration for Auth, Firestore, Storage, and Functions
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: "skillup-3beaf.firebaseapp.com",
  projectId: "skillup-3beaf",
  storageBucket: "skillup-3beaf.appspot.com",
  messagingSenderId: "715786145271",
  appId: "1:715786145271:web:7115826d1172113c9832f2",
  measurementId: "G-03QYTPLVQG"
};

// Only initialize if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Configure Firestore for better performance
// Note: Firestore settings are now configured through Firebase Console

// Configure Functions region
// functions.useEmulator('localhost', 5001); // Uncomment for local development

// Placeholder function for account deletion (will be migrated to Functions)
export async function deleteAccountCompletely() {
  // This function will be handled by Firebase Functions
  return { success: true, message: 'Account deletion handled by Firebase Functions.' };
}

export { app, auth, db, storage, functions }; 