import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { safeTrim } from '../../utils/stringUtils';
import { auth } from './firebase';
// Import clearAPICache for cache management
import { clearAPICache } from '../../services/apiService';

// Authentication service for Firebase Functions backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';
const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL || 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

// Ensure consistent URL format (remove trailing slash if present)
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

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
  private connectionCache: { status: boolean; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    console.log('AuthService instantiated at:', new Date().toISOString());
    console.log('Using API URL:', normalizeUrl(API_BASE_URL));
    console.log('Using Functions URL:', normalizeUrl(FUNCTIONS_BASE));
  }

  // Public utility to clear cached connection status
  clearConnectionCache(): void {
    this.connectionCache = null;
    console.log('Backend connection cache cleared');
  }

  private isConnectionCacheValid(): boolean {
    return (
      this.connectionCache !== null &&
      Date.now() - this.connectionCache.timestamp < this.CACHE_DURATION
    );
  }

  async testBackendConnection(): Promise<boolean> {
    // Return cached result if still valid
    if (this.isConnectionCacheValid()) {
      console.log('Using cached backend connection status:', this.connectionCache?.status);
      return this.connectionCache?.status ?? false;
    }

    try {
      console.log('Testing backend connectivity to:', `${normalizeUrl(API_BASE_URL)}/health`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds

      // Prefer health endpoint if available
      let response: Response | null = null;
      try {
        response = await fetch(`${normalizeUrl(API_BASE_URL)}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          mode: 'cors',
        });
      } catch (_e) {
        // fallback to /test
        console.warn('Health endpoint failed, falling back to /test');
      }

      // If no response or 404/502, try fallback routes
      if (!response || response.status === 404 || response.status === 502) {
        console.warn(
          `Primary health check returned ${response ? response.status : 'no response'}, trying /test`
        );
        try {
          response = await fetch(`${normalizeUrl(API_BASE_URL)}/test`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            mode: 'cors',
          });
        } catch (_e) {
          console.warn('Primary /test failed, trying Cloud Functions fallback');
        }
      }

      // Final fallback to Cloud Functions direct URL
      if (!response || response.status === 404 || response.status === 502) {
        try {
          console.warn('Attempting Cloud Functions fallback health check...');
          response = await fetch(`${normalizeUrl(FUNCTIONS_BASE)}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            mode: 'cors',
          });
        } catch (_e) {
          console.error('Cloud Functions fallback health check failed');
        }
      }

      clearTimeout(timeoutId);
      if (!response) {
        console.error('No response from any health check endpoint');
        this.connectionCache = { status: false, timestamp: Date.now() - 25000 };
        return false;
      }
      console.log('Connectivity response status:', response.status);

      const isConnected = response.ok;
      this.connectionCache = { status: isConnected, timestamp: Date.now() };

      if (isConnected) {
        const data = await response.json().catch(() => ({}));
        console.log('Connectivity response:', data);
      } else if (response.status === 503) {
        console.error('Backend unhealthy (503). Likely DB unavailable');
      } else {
        console.error('Connectivity test failed with status:', response.status);
      }

      return isConnected;
    } catch (error) {
      console.error('Backend connectivity test failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Don't cache failed attempts for too long
      this.connectionCache = { status: false, timestamp: Date.now() - 25000 }; // Cache for only 5 seconds on failure
      return false;
    }
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ success: boolean; message: string; user?: any }> {
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

      // OPTIMIZATION: Skip backend connectivity test during login for speed
      // The login request itself will verify connectivity
      
      // Step 1: Login with Firebase (with timeout)
      console.log('Step 1: Authenticating with Firebase...');
      const firebasePromise = signInWithEmailAndPassword(auth, email, password);
      const firebaseTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase authentication timeout')), 8000) // Reduced from 10s to 8s
      );

      const userCredential = (await Promise.race([firebasePromise, firebaseTimeout])) as any;
      console.log('Firebase authentication successful');

      // Step 2: Get Firebase ID token (with timeout)
      console.log('Step 2: Getting Firebase ID token...');
      const tokenPromise = userCredential.user.getIdToken();
      const tokenTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Token retrieval timeout')), 3000) // Reduced from 5s to 3s
      );

      const idToken = (await Promise.race([tokenPromise, tokenTimeout])) as string;
      console.log('Firebase ID token obtained');

      // Step 3: Exchange Firebase token for JWT (with timeout)
      console.log('Step 3: Exchanging Firebase token for JWT...');
      console.log('Making request to:', `${normalizeUrl(API_BASE_URL)}/auth/firebase-login`);

      const requestBody = {
        firebaseToken: idToken,
        email: email,
      };
      console.log('Request body:', { ...requestBody, firebaseToken: '***' });

      const backendPromise = fetch(`${normalizeUrl(API_BASE_URL)}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const backendTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Backend request timeout')), 6000) // Reduced from 8s to 6s
      );

      const response = (await Promise.race([backendPromise, backendTimeout])) as Response;

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response data:', data);
        console.log('Token received:', data.token ? 'Token exists' : 'No token');
        if (data.token) {
          console.log('Token preview:', `${data.token.substring(0, 20)}...`);
        }

        // Store both the JWT token and user data consistently
        localStorage.setItem('skillup_token', data.token);
        localStorage.setItem('skillup_user', JSON.stringify(data.user));
        console.log('Token and user data stored in localStorage');
        console.log(
          'Token verification - stored token:',
          localStorage.getItem('skillup_token') ? 'Present' : 'Missing'
        );
        console.log(
          'User data verification - stored user:',
          localStorage.getItem('skillup_user') ? 'Present' : 'Missing'
        );

        // Update connection cache on successful login
        this.connectionCache = { status: true, timestamp: Date.now() };

        // Ensure user data is safe before returning
        const safeUser =
          data.user && typeof data.user === 'object'
            ? {
                _id: data.user._id || data.user.id || '',
                fullname: data.user.name || data.user.fullname || '',
                email: data.user.email || '',
                role: data.user.role || 'student',
                username: data.user.username || data.user.email || '',
                ...data.user, // Include any additional fields
              }
            : null;

        return {
          success: true,
          message: 'Login successful',
          user: safeUser,
        };
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to parse error response' }));
        console.error('Backend error response:', errorData);

        // Provide more specific error messages based on backend response
        let errorMessage =
          errorData.message || `Backend request failed with status ${response.status}`;

        if (response.status === 401) {
          if (errorData.message?.includes('not found')) {
            errorMessage = 'User not found. Please contact administrator.';
          } else if (errorData.message?.includes('disabled')) {
            errorMessage = 'Account is disabled. Please contact administrator.';
          } else {
            errorMessage = 'Authentication failed. Please check your credentials.';
          }
        } else if (response.status === 400) {
          errorMessage = 'Invalid request. Please check your input.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
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
      console.log('Starting logout process...');

      // Clear connection cache
      this.connectionCache = null;

      // Clear API cache for performance optimization
      clearAPICache();

      // Clear localStorage
      localStorage.removeItem('skillup_token');
      localStorage.removeItem('skillup_user');

      // Sign out from Firebase
      await signOut(auth);

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);

      // Even if Firebase logout fails, clear local state
      localStorage.removeItem('skillup_token');
      localStorage.removeItem('skillup_user');
      this.connectionCache = null;
      clearAPICache();

      // Re-throw error for caller to handle
      throw error;
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

      const response = await fetch(`${normalizeUrl(API_BASE_URL)}/auth/profile`, {
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
    const hasToken = localStorage.getItem('skillup_token') !== null;
    const hasUser = localStorage.getItem('skillup_user') !== null;
    const hasFirebaseUser = auth.currentUser !== null;

    console.log('Authentication state check:', {
      hasToken,
      hasUser,
      hasFirebaseUser,
      firebaseUser: auth.currentUser?.email,
    });

    // All three must be present for valid authentication
    return hasToken && hasUser && hasFirebaseUser;
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export const authService = new AuthService();
export type { AuthService };
