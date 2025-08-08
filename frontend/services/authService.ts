import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { safeTrim } from '../../utils/stringUtils';
import { performanceMonitor } from '../../utils/performanceMonitor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  _id: string;
  id?: string;
  fullname: string;
  name?: string;
  email: string;
  role: string;
  username: string;
}

class AuthService {
  private connectionCache: { status: boolean; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    console.log('AuthService instantiated at:', new Date().toISOString());
    console.log('Using API URL:', API_BASE_URL);
  }

  private isConnectionCacheValid(): boolean {
    return this.connectionCache !== null && 
           (Date.now() - this.connectionCache.timestamp) < this.CACHE_DURATION;
  }

  async testBackendConnection(): Promise<boolean> {
    // Return cached result if still valid
    if (this.isConnectionCacheValid()) {
      console.log('Using cached backend connection status:', this.connectionCache!.status);
      return this.connectionCache!.status;
    }

    try {
      console.log('Testing backend connectivity to:', `${API_BASE_URL}/test`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds
      
      const response = await fetch(`${API_BASE_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
      });
      
      clearTimeout(timeoutId);
      console.log('Backend test response status:', response.status);
      
      const isConnected = response.ok;
      this.connectionCache = { status: isConnected, timestamp: Date.now() };
      
      if (isConnected) {
        const data = await response.json();
        console.log('Backend test response:', data);
      } else {
        console.error('Backend test failed with status:', response.status);
      }
      
      return isConnected;
    } catch (error) {
      console.error('Backend connectivity test failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Don't cache failed attempts for too long
      this.connectionCache = { status: false, timestamp: Date.now() - 25000 }; // Cache for only 5 seconds on failure
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: any }> {
    performanceMonitor.startTimer('login');
    try {
      // Validate input with safe handling
      if (!credentials || !credentials.email || !credentials.password) {
        console.error('Invalid credentials provided:', credentials);
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      // Ensure email is trimmed and valid with safe handling
      const email = safeTrim(credentials.email || '');
      const password = credentials.password || '';

      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      console.log('Attempting login with email:', email);
      
      // Step 1: Login with Firebase (with timeout)
      console.log('Step 1: Authenticating with Firebase...');
      const firebasePromise = signInWithEmailAndPassword(auth, email, password);
      const firebaseTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Firebase authentication timeout')), 10000)
      );
      
      const userCredential = await Promise.race([firebasePromise, firebaseTimeout]) as any;
      console.log('Firebase authentication successful');

      // Step 2: Get Firebase ID token (with timeout)
      console.log('Step 2: Getting Firebase ID token...');
      const tokenPromise = userCredential.user.getIdToken();
      const tokenTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Token retrieval timeout')), 5000)
      );
      
      const idToken = await Promise.race([tokenPromise, tokenTimeout]) as string;
      console.log('Firebase ID token obtained');

      // Step 3: Exchange Firebase token for JWT (with timeout)
      console.log('Step 3: Exchanging Firebase token for JWT...');
      console.log('Making request to:', `${API_BASE_URL}/auth/firebase-login`);
      
      const requestBody = {
        firebaseToken: idToken,
        email: email,
      };
      console.log('Request body:', { ...requestBody, firebaseToken: '***' });

      const backendPromise = fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const backendTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Backend request timeout')), 8000)
      );
      
      const response = await Promise.race([backendPromise, backendTimeout]) as Response;

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response data:', data);
        localStorage.setItem('skillup_token', data.token);
        
        // Update connection cache on successful login
        this.connectionCache = { status: true, timestamp: Date.now() };
        
        // Ensure user data is safe before returning
        const safeUser = data.user && typeof data.user === 'object' ? {
          _id: data.user._id || data.user.id || '',
          fullname: data.user.name || data.user.fullname || '',
          email: data.user.email || '',
          role: data.user.role || 'student',
          username: data.user.username || data.user.email || '',
          ...data.user // Include any additional fields
        } : null;

        return {
          success: true,
          message: 'Login successful',
          user: safeUser,
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
      } else if (error.message.includes('Failed to fetch') || error.message.includes('timeout')) {
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
    } finally {
      performanceMonitor.endTimer('login');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem('skillup_token');
      localStorage.removeItem('skillup_user');
      // Clear connection cache on logout
      this.connectionCache = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const token = localStorage.getItem('skillup_token');
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      console.log('Fetching profile with token:', token.substring(0, 20) + '...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
            ...data.user // Include any additional fields
          };
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

  isAuthenticated(): boolean {
    return auth.currentUser !== null && localStorage.getItem('skillup_token') !== null;
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  // Clear connection cache (useful for testing or manual refresh)
  clearConnectionCache(): void {
    this.connectionCache = null;
  }
}

export const authService = new AuthService(); 