import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
export const auth = getAuth(app);
export default app; 