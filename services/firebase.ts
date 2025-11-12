// firebase.ts - Firebase Configuration for Auth, Firestore, Storage, and Functions
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Firebase configuration - using only free tier services
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDexK-T8wuuZS13DZbO5tgAagqpMgHZzgc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'skillup-3beaf.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'skillup-3beaf',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'skillup-3beaf.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '715786145271',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:715786145271:web:7115826d1172113c9832f2',
  // Removed measurementId to disable Analytics completely
};

// Log configuration status (without exposing sensitive data)
console.log('Firebase configuration loaded:', {
  apiKey: firebaseConfig.apiKey ? 'CONFIGURED' : 'MISSING',
  authDomain: firebaseConfig.authDomain ? 'CONFIGURED' : 'MISSING',
  projectId: firebaseConfig.projectId ? 'CONFIGURED' : 'MISSING',
  storageBucket: firebaseConfig.storageBucket ? 'CONFIGURED' : 'MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'CONFIGURED' : 'MISSING',
  appId: firebaseConfig.appId ? 'CONFIGURED' : 'MISSING',
});

// Only initialize if not already initialized
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a minimal app for fallback
  app = initializeApp(firebaseConfig, 'fallback');
}

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
