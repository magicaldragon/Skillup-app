import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

// Authentication service for Firebase Functions backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  _id: string;
  id?: string;
  fullname?: string;
  name?: string;
  email: string;
  role: string;
  username: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  status?: string;
  studentCode?: string;
  avatarUrl?: string;
  diceBearStyle?: string;
  diceBearSeed?: string;
  classIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

class AuthService {
  async testBackendConnection(): Promise<boolean> {
    try {
      console.log('Testing backend connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isConnected = response.ok;
      
      console.log('Backend connection test result:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  async login(credentials: LoginCredentials) {
    try {
      console.log('🔐 Starting login process...');
      
      const { email, password } = credentials;
      
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required.',
        };
      }
      
      console.log('🔐 Attempting Firebase authentication...');
      
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('🔐 Firebase authentication successful, getting ID token...');
      
      // Step 2: Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      console.log('🔐 ID token obtained, verifying with backend...');
      
      // Step 3: Verify token with backend and get user profile
      const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebaseToken: idToken, email }),
      });
      
      console.log('🔐 Backend verification response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Backend verification successful:', data);
        
        if (data.success && data.token && data.user) {
          // Store session token and user data
          localStorage.setItem('skillup_token', data.token);
          localStorage.setItem('skillup_user', JSON.stringify(data.user));
          
          console.log('🔐 Login completed successfully');
          
          return {
            success: true,
            message: 'Login successful',
            user: data.user,
          };
        } else {
          console.error('🔐 Backend verification failed - invalid response structure:', data);
          return {
            success: false,
            message: data.message || 'Authentication failed. Please try again.',
          };
        }
      } else {
        console.error('🔐 Backend verification failed with status:', response.status);
        
        let errorMessage = 'Authentication failed. Please try again.';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('🔐 Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error details:', error);

      // Clean up any partial state on error
      localStorage.removeItem('skillup_token');
      localStorage.removeItem('skillup_user');

      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        return {
          success: false,
          message: 'User not found. Please check your email address.',
        };
      } else if (error.code === 'auth/wrong-password') {
        return {
          success: false,
          message: 'Incorrect password. Please try again.',
        };
      } else if (error.code === 'auth/too-many-requests') {
        return {
          success: false,
          message: 'Too many failed attempts. Please try again later.',
        };
      }

      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔓 Starting logout process...');
      
      // Clear local storage first
      localStorage.removeItem('skillup_token');
      localStorage.removeItem('skillup_user');
      console.log('🔓 Local storage cleared');
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('🔓 Firebase sign out completed');
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if Firebase logout fails, clear local data
      localStorage.removeItem('skillup_token');
      localStorage.removeItem('skillup_user');
      
      return {
        success: true, // Still return success since local cleanup is done
        message: 'Logged out (with warnings)',
      };
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const token = localStorage.getItem('skillup_token');
      console.log('Getting profile - Token exists:', !!token);
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      console.log('Fetching profile with token:', `${token.substring(0, 20)}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Profile response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile response data:', data);
        if (data.success && data.user && typeof data.user === 'object') {
          // Ensure all required fields exist with safe defaults
          const safeUser = {
            _id: data.user._id || data.user.id || '',
            fullname: data.user.name || data.user.fullname || '',
            email: data.user.email || '',
            role: data.user.role || 'student',
            username: data.user.username || data.user.email || '',
            ...data.user, // Include any additional fields
          };
          console.log('Safe user object:', safeUser);
          console.log('User role from profile:', safeUser.role);
          return safeUser;
        } else {
          console.error('Invalid profile response structure:', data);
          return null;
        }
      } else {
        console.error('Profile request failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  async validateAuthState(): Promise<{ isValid: boolean; user?: any; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return { isValid: false, error: 'Not authenticated' };
      }

      // Verify token is still valid by making a profile request
      const profile = await this.getProfile();
      if (profile) {
        return { isValid: true, user: profile };
      } else {
        // Token is invalid, clear state
        await this.logout();
        return { isValid: false, error: 'Token validation failed' };
      }
    } catch (error) {
      console.error('Auth state validation error:', error);
      // Clear invalid state
      await this.logout();
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('skillup_token');
    const user = localStorage.getItem('skillup_user');
    return !!(token && user);
  }

  async getCurrentUser(): Promise<any> {
    try {
      const token = localStorage.getItem('skillup_token');
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.user || userData;
      } else if (response.status === 401) {
        localStorage.removeItem('skillup_token');
        localStorage.removeItem('skillup_user');
        return null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
export type { AuthService };
