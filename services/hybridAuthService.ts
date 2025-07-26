// Hybrid Authentication Service: Firebase Auth + Local Storage (Backend-Free Version)
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

// Remove API_BASE_URL dependency
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    avatarUrl?: string;
    status: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatarUrl?: string;
  status: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: string;
  note?: string;
  classIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Mock user data for development (replace with real data later)
// These UIDs should match the actual Firebase Auth UIDs
const MOCK_USERS = {
  'qkHQ4gopbTgJdv9Pf0QSZkiGs222': { // skillup-admin (actual UID)
    id: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222',
    name: 'SkillUp Admin',
    email: 'skillup-admin@teacher.skillup',
    role: 'admin' as const,
    status: 'active',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'YCqXqLV1JacLMsmkgOoCrJQORtE2': { // teacher-jenny (actual UID)
    id: 'YCqXqLV1JacLMsmkgOoCrJQORtE2',
    name: 'Jenny Teacher',
    email: 'teacher-jenny@teacher.skillup',
    role: 'teacher' as const,
    status: 'active',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  // Note: Student accounts will be created automatically via fallback
};

// Fallback user data generator for any Firebase UID
const createFallbackUser = (firebaseUid: string, email: string) => {
  // Determine role based on email
  let role: 'admin' | 'teacher' | 'student' = 'student';
  let name = 'Unknown User';
  
  if (email.includes('admin')) {
    role = 'admin';
    name = 'SkillUp Admin';
  } else if (email.includes('teacher')) {
    role = 'teacher';
    name = email.split('@')[0].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  } else if (email.includes('student')) {
    role = 'student';
    name = email.split('@')[0].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return {
    id: firebaseUid,
    name,
    email,
    role,
    status: 'active',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

class HybridAuthService {
  private user: User | null = null;

  constructor() {
    // Load user from localStorage on initialization
    this.user = this.getUserFromStorage();
  }

  // Login using Firebase Auth + Mock Data
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Step 1: Authenticate with Firebase
      const firebaseUser = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Firebase login successful for:', email);
      console.log('Firebase UID:', firebaseUser.user.uid);
      
      // Step 2: Get user data from mock data using Firebase UID
      let userData = MOCK_USERS[firebaseUser.user.uid as keyof typeof MOCK_USERS];
      
      // If not found in mock data, create fallback user data
      if (!userData) {
        console.log('User not found in mock data, creating fallback for UID:', firebaseUser.user.uid);
        userData = createFallbackUser(firebaseUser.user.uid, firebaseUser.user.email || '');
        console.log('Created fallback user data for:', firebaseUser.user.email);
      } else {
        console.log('Found user in mock data:', userData.name);
      }
      
      this.user = userData;
      localStorage.setItem('skillup_user', JSON.stringify(userData));
      
      return {
        success: true,
        message: 'Login successful',
        user: userData
      };
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        return {
          success: false,
          message: 'Invalid credentials. Please check your details and try again.'
        };
      } else if (error.code === 'auth/wrong-password') {
        return {
          success: false,
          message: 'Incorrect password. Please try again.'
        };
      } else {
        return {
          success: false,
          message: `Network error: ${error.message}`
        };
      }
    }
  }

  // Logout using Firebase
  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      this.user = null;
      localStorage.removeItem('skillup_user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if Firebase logout fails
      this.user = null;
      localStorage.removeItem('skillup_user');
    }
  }

  // Get user profile (from localStorage)
  async getProfile(): Promise<User | null> {
    if (this.user) {
      return this.user;
    }
    
    // Try to get from localStorage
    const storedUser = this.getUserFromStorage();
    if (storedUser) {
      this.user = storedUser;
      return storedUser;
    }
    
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.user !== null;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get Firebase user
  getFirebaseUser() {
    return auth.currentUser;
  }

  // Clear authentication data
  clearAuth(): void {
    this.user = null;
    localStorage.removeItem('skillup_user');
  }

  // Get user from localStorage
  private getUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem('skillup_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  // Initialize authentication state
  async initializeAuth(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        
        if (firebaseUser) {
          // User is signed in with Firebase
          let userData = MOCK_USERS[firebaseUser.uid as keyof typeof MOCK_USERS];
          
          // If not found in mock data, create fallback user data
          if (!userData) {
            userData = createFallbackUser(firebaseUser.uid, firebaseUser.email || '');
            console.log('Created fallback user data for:', firebaseUser.email);
          }
          
          this.user = userData;
          localStorage.setItem('skillup_user', JSON.stringify(userData));
          resolve(userData);
        } else {
          // No Firebase user
          this.user = null;
          localStorage.removeItem('skillup_user');
          resolve(null);
        }
      });
    });
  }

  // Create user (simplified for frontend-only)
  async createUser(userData: {
    firebaseUid: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    password: string;
    [key: string]: any;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    // For now, just return success (backend will handle actual creation)
    return {
      success: true,
      message: 'User creation initiated. Backend integration pending.',
      user: {
        id: userData.firebaseUid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'active',
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
}

export const hybridAuthService = new HybridAuthService(); 