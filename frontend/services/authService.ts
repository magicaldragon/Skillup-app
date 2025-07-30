import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { safeTrim } from '../../utils/stringUtils';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  username: string;
}

class AuthService {
  constructor() {
    console.log('AuthService instantiated at:', new Date().toISOString());
  }

  async testBackendConnection(): Promise<boolean> {
    try {
      console.log('Testing backend connectivity...');
      const response = await fetch(`${API_BASE_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Backend test response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Backend test response:', data);
        return true;
      } else {
        console.error('Backend test failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Backend connectivity test failed:', error);
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Validate input
      if (!credentials || !credentials.email || !credentials.password) {
        console.error('Invalid credentials provided:', credentials);
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      // Ensure email is trimmed and valid
      const email = safeTrim(credentials.email);
      const password = credentials.password;

      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      console.log('Attempting login with email:', email);
      
      // Step 1: Login with Firebase
      console.log('Step 1: Authenticating with Firebase...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase authentication successful');

      // Step 2: Get Firebase ID token
      console.log('Step 2: Getting Firebase ID token...');
      const idToken = await userCredential.user.getIdToken();
      console.log('Firebase ID token obtained');

      // Step 3: Exchange Firebase token for JWT
      console.log('Step 3: Exchanging Firebase token for JWT...');
      console.log('Making request to:', `${API_BASE_URL}/auth/firebase-login`);
      
      const requestBody = {
        firebaseToken: idToken,
        email: email,
      };
      console.log('Request body:', { ...requestBody, firebaseToken: '***' });

      const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response data:', data);
        localStorage.setItem('authToken', data.token);
        
        return {
          success: true,
          message: 'Login successful',
          user: data.user,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.message || `Backend request failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      
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
      } else if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection and try again.',
        };
      } else if (error.message.includes('Backend request failed')) {
        return {
          success: false,
          message: error.message,
        };
      }
      
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      console.log('Fetching profile with token:', token.substring(0, 20) + '...');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Profile response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Profile response data:', data);
        if (data.success && data.user) {
          return data.user;
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

  isAuthenticated(): boolean {
    return auth.currentUser !== null && localStorage.getItem('authToken') !== null;
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export const authService = new AuthService(); 