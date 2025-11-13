// Authentication service for Firebase Functions backend - Optimized for performance
function resolveApiBase(): string {
  try {
    if (typeof window !== "undefined" && window.location.host.endsWith(".web.app")) {
      return "/api";
    }
  } catch {
    // ignore
  }
  return (import.meta.env?.VITE_API_BASE_URL as string) || "/api";
}

const API_BASE_URL = resolveApiBase();

// Cache for backend connection status
let backendConnectionCache: { status: boolean; timestamp: number } | null = null;
const BACKEND_CONNECTION_CACHE_TTL = 30000; // 30 seconds

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "teacher" | "staff" | "student";
    avatarUrl?: string;
    status: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "staff" | "student";
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
  private profileCache: { user: User; timestamp: number } | null = null;
  private readonly PROFILE_CACHE_TTL = 60000; // 1 minute cache for profile

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem("skillup_token");
    this.user = this.getUserFromStorage();
  }

  // Login user with performance optimizations
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success && data.token) {
        this.token = data.token;
        this.user = data.user;

        // Store in localStorage
        localStorage.setItem("skillup_token", data.token);
        localStorage.setItem("skillup_user", JSON.stringify(data.user));

        // Cache the profile
        this.profileCache = {
          user: data.user,
          timestamp: Date.now(),
        };

        return data;
      } else {
        return data;
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          message: "Login timeout. Please try again.",
        };
      }

      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuth();
    }
  }

  // Get current user profile with caching
  async getProfile(): Promise<User | null> {
    if (!this.token) return null;

    // Check cache first
    if (this.profileCache && Date.now() - this.profileCache.timestamp < this.PROFILE_CACHE_TTL) {
      console.log("Using cached profile");
      return this.profileCache.user;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem("skillup_user", JSON.stringify(data.user));

        // Update cache
        this.profileCache = {
          user: data.user,
          timestamp: Date.now(),
        };

        return data.user;
      } else {
        // Token might be invalid, clear auth
        this.clearAuth();
        return null;
      }
    } catch (error) {
      console.error("Get profile error:", error);

      // If we have cached user data, return it as fallback
      if (this.user) {
        console.log("Using fallback cached user due to network error");
        return this.user;
      }

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

  // Test backend connection with caching
  async testBackendConnection(): Promise<boolean> {
    // Check cache first
    if (backendConnectionCache) {
      const age = Date.now() - backendConnectionCache.timestamp;
      if (age < BACKEND_CONNECTION_CACHE_TTL) {
        console.log("Using cached backend connection status:", backendConnectionCache.status);
        return backendConnectionCache.status;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout

      const response = await fetch(`${API_BASE_URL}/test`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isConnected = response.ok;

      // Cache the result
      backendConnectionCache = {
        status: isConnected,
        timestamp: Date.now(),
      };

      return isConnected;
    } catch (error) {
      console.error("Backend connection test failed:", error);

      // Cache negative result for shorter time
      backendConnectionCache = {
        status: false,
        timestamp: Date.now(),
      };

      return false;
    }
  }

  // Clear authentication data and caches
  clearAuth(): void {
    this.token = null;
    this.user = null;
    this.profileCache = null;
    localStorage.removeItem("skillup_token");
    localStorage.removeItem("skillup_user");
  }

  // Get user from localStorage
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem("skillup_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user from storage:", error);
        return null;
      }
    }
    return null;
  }

  // Initialize auth state (call this on app startup) with performance optimization
  async initializeAuth(): Promise<User | null> {
    if (this.token && this.user) {
      // If we have cached profile and it's fresh, use it
      if (this.profileCache && Date.now() - this.profileCache.timestamp < this.PROFILE_CACHE_TTL) {
        console.log("Using cached profile for initialization");
        return this.profileCache.user;
      }

      // Otherwise verify token is still valid by getting profile
      return await this.getProfile();
    }
    return null;
  }

  // Preload critical data for faster dashboard loading
  async preloadCriticalData(): Promise<void> {
    if (!this.token) return;

    try {
      // Preload profile if not cached
      if (!this.profileCache || Date.now() - this.profileCache.timestamp > this.PROFILE_CACHE_TTL) {
        await this.getProfile();
      }
    } catch (error) {
      console.warn("Failed to preload critical data:", error);
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
