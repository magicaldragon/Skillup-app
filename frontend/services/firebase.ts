import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "skillup-3beaf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "skillup-3beaf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "skillup-3beaf.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "715786145271",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:715786145271:web:7115826d1172113c9832f2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-03QYTPLVQG"
};

// Log configuration status (without exposing sensitive data)
console.log('Firebase configuration status:', {
  apiKey: firebaseConfig.apiKey ? 'CONFIGURED' : 'MISSING',
  authDomain: firebaseConfig.authDomain ? 'CONFIGURED' : 'MISSING',
  projectId: firebaseConfig.projectId ? 'CONFIGURED' : 'MISSING',
  storageBucket: firebaseConfig.storageBucket ? 'CONFIGURED' : 'MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'CONFIGURED' : 'MISSING',
  appId: firebaseConfig.appId ? 'CONFIGURED' : 'MISSING'
});

// Only initialize if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app; 