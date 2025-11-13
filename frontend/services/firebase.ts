import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Version timestamp for cache busting
const VERSION = Date.now();

// Firebase configuration with fallback values - Analytics disabled for cost optimization
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDexK-T8wuuZS13DZbO5tgAagqpMgHZzgc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "skillup-3beaf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "skillup-3beaf",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "skillup-3beaf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "715786145271",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:715786145271:web:7115826d1172113c9832f2",
  // measurementId removed to disable Analytics and eliminate costs
};

// Log configuration status (without exposing sensitive data)
console.log(`Firebase configuration loaded (v${VERSION}):`, {
  apiKey: firebaseConfig.apiKey ? "CONFIGURED" : "MISSING",
  authDomain: firebaseConfig.authDomain ? "CONFIGURED" : "MISSING",
  projectId: firebaseConfig.projectId ? "CONFIGURED" : "MISSING",
  storageBucket: firebaseConfig.storageBucket ? "CONFIGURED" : "MISSING",
  messagingSenderId: firebaseConfig.messagingSenderId ? "CONFIGURED" : "MISSING",
  appId: firebaseConfig.appId ? "CONFIGURED" : "MISSING",
});

// Initialize Firebase with error handling
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Create a minimal app for fallback
  app = initializeApp(firebaseConfig, "fallback");
}

export const auth = getAuth(app);
export default app;
