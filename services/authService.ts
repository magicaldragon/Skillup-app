// Authentication service for Firebase Functions backend
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'staff' | 'student';
    avatarUrl?: string;
    status: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'staff' | 'student';
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

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('skillup_token');
    this.user = this.getUserFromStorage();
  }

  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.token = data.token;
        this.user = data.user;

        // Store in localStorage
        localStorage.setItem('skillup_token', data.token);
        localStorage.setItem('skillup_user', JSON.stringify(data.user));

        return data;
      } else {
        return data;
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Get current user profile
  async getProfile(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem('skillup_user', JSON.stringify(data.user));
        return data.user;
      } else {
        // Token might be invalid, clear auth
        this.clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Get profile error:', error);
      this.clearAuth();
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get token
  getToken(): string | null {
    return this.token;
  }

  // Test backend connection
  async testBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  // Clear authentication data
  clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('skillup_token');
    localStorage.removeItem('skillup_user');
  }

  // Get user from localStorage
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('skillup_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        return null;
      }
    }
    return null;
  }

  // Initialize auth state (call this on app startup)
  async initializeAuth(): Promise<User | null> {
    if (this.token && this.user) {
      // Verify token is still valid by getting profile
      return await this.getProfile();
    }
    return null;
  }
}

// Create singleton instance
export const authService = new AuthService();
