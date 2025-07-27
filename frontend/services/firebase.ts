import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBfKDCo7PrTevI1XUCY3FvH6bED8AWSnnw",
  authDomain: "skillup-3beaf.firebaseapp.com",
  projectId: "skillup-3beaf",
  storageBucket: "skillup-3beaf.firebasestorage.app",
  messagingSenderId: "715786145271",
  appId: "1:715786145271:web:7115826d1172113c9832f2",
  measurementId: "G-03QYTPLVQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 