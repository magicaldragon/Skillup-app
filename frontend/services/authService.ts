import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
      const email = credentials.email.trim();
      const password = credentials.password;

      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      console.log('Attempting login with email:', email);
      
      // Login with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Exchange Firebase token for JWT
      const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken: idToken,
          email: email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        
        return {
          success: true,
          message: 'Login successful',
          user: data.user,
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to authenticate with backend');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
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