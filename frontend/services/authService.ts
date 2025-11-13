import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Authentication service for Firebase Functions backend
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

import type { UserProfile } from "../../types";

const API_BASE_URL: string = resolveApiBase();

export interface LoginCredentials {
  email: string;
  password: string;
}

// AuthService.login and helpers
function isPasswordComplex(pw: string): boolean {
  if (!pw || pw.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  return hasLetter && (hasNumber || hasSpecial);
}

function getLockoutState() {
  const raw = localStorage.getItem("login_attempts");
  try {
    return raw ? (JSON.parse(raw) as { count: number; lastTs: number }) : { count: 0, lastTs: 0 };
  } catch {
    return { count: 0, lastTs: 0 };
  }
}

function recordFailedAttempt() {
  const { count, lastTs } = getLockoutState();
  const now = Date.now();
  const isWindowValid = now - lastTs < 15 * 60 * 1000; // 15 minutes
  const next = { count: isWindowValid ? count + 1 : 1, lastTs: now };
  localStorage.setItem("login_attempts", JSON.stringify(next));
}

function clearFailedAttempts() {
  localStorage.removeItem("login_attempts");
}

class AuthService {
  // Inject-able sign-in function to simplify testing without Firebase browser internals
  private signInFn = signInWithEmailAndPassword;

  async testBackendConnection(): Promise<boolean> {
    try {
      console.log("Testing backend connection...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isConnected = response.ok;

      console.log("Backend connection test result:", isConnected);
      return isConnected;
    } catch (error) {
      console.error("Backend connection test failed:", error);
      return false;
    }
  }

  // Overloads for compatibility with both app and tests
  // Overloads to support both call styles: (email, password) and { email, password }
  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string; user?: UserProfile }>;
  async login(
    credentials: LoginCredentials,
  ): Promise<{ success: boolean; message: string; user?: UserProfile }>;
  async login(emailOrCreds: string | LoginCredentials, passwordArg?: string) {
    try {
      console.log("🔐 Starting login process...");
      const email =
        typeof emailOrCreds === "string"
          ? (emailOrCreds || "").trim()
          : (emailOrCreds.email || "").trim();
      const password =
        typeof emailOrCreds === "string" ? passwordArg || "" : emailOrCreds.password || "";

      const { count, lastTs } = getLockoutState();
      const now = Date.now();
      if (count >= 5 && now - lastTs < 15 * 60 * 1000) {
        return { success: false, message: "Too many failed attempts. Please try again later." };
      }

      if (!email || !password) {
        return { success: false, message: "Please enter email and password." };
      }

      if (!isPasswordComplex(password)) {
        return {
          success: false,
          message:
            "Password must be at least 8 characters including letters and numbers or special characters.",
        };
      }

      // Backend availability check
      const backendReachable = await this.testBackendConnection();
      if (!backendReachable) {
        return { success: false, message: "Server unavailable. Please try again later." };
      }

      console.log("🔐 Attempting Firebase authentication...");
      const userCredential = await this.signInFn(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log("🔐 Firebase authentication successful, getting ID token...");
      const idToken = await firebaseUser.getIdToken();

      console.log("🔐 ID token obtained, verifying with backend...");
      const verifyUrl = `${API_BASE_URL}/auth/firebase-login`;
      const maxAttempts = 3;
      let response: Response | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firebaseToken: idToken, email }),
            mode: "cors",
            credentials: "omit",
          });
          break;
        } catch (_err) {
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 300 * attempt));
          }
        }
      }

      if (!response) {
        localStorage.removeItem("skillup_token");
        localStorage.removeItem("skillup_user");
        recordFailedAttempt();
        return { success: false, message: "Network error - please check your connection." };
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token && data.user) {
          localStorage.setItem("skillup_token", data.token);
          localStorage.setItem("skillup_user", JSON.stringify(data.user));
          clearFailedAttempts();
          return { success: true, message: "Login successful", user: data.user };
        }
        recordFailedAttempt();
        return {
          success: false,
          message: data.message || "Authentication failed. Please try again.",
        };
      } else {
        let errorMessage = "Authentication failed. Please try again.";
        try {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch {
          // default message
        }
        recordFailedAttempt();
        return { success: false, message: errorMessage };
      }
    } catch (error: any) {
      console.error("Login error details:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
      });
      localStorage.removeItem("skillup_token");
      localStorage.removeItem("skillup_user");

      if (error?.code === "auth/user-not-found") {
        recordFailedAttempt();
        return { success: false, message: "User not found. Please check your email address." };
      } else if (error?.code === "auth/wrong-password") {
        recordFailedAttempt();
        return { success: false, message: "Incorrect password. Please try again." };
      } else if (error?.code === "auth/too-many-requests") {
        return { success: false, message: "Too many failed attempts. Please try again later." };
      }

      recordFailedAttempt();
      return { success: false, message: "Login failed. Please try again." };
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔓 Starting logout process...");

      // Clear local storage first
      localStorage.removeItem("skillup_token");
      localStorage.removeItem("skillup_user");
      console.log("🔓 Local storage cleared");

      // Sign out from Firebase
      await signOut(auth);
      console.log("🔓 Firebase sign out completed");

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error: any) {
      console.error("Logout error:", error);

      // Even if Firebase logout fails, clear local data
      localStorage.removeItem("skillup_token");
      localStorage.removeItem("skillup_user");

      return {
        success: true, // Still return success since local cleanup is done
        message: "Logged out (with warnings)",
      };
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const token = localStorage.getItem("skillup_token");
      console.log("Getting profile - Token exists:", !!token);
      if (!token) {
        console.log("No auth token found");
        return null;
      }

      console.log("Fetching profile with token:", `${token.substring(0, 20)}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("Profile response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Profile response data:", data);
        if (data.success && data.user && typeof data.user === "object") {
          // Ensure all required fields exist with safe defaults
          const safeUser = {
            _id: data.user._id || data.user.id || "",
            fullname: data.user.name || data.user.fullname || "",
            email: data.user.email || "",
            role: data.user.role || "student",
            username: data.user.username || data.user.email || "",
            ...data.user, // Include any additional fields
          };
          console.log("Safe user object:", safeUser);
          console.log("User role from profile:", safeUser.role);
          return safeUser;
        } else {
          console.error("Invalid profile response structure:", data);
          return null;
        }
      } else {
        console.error("Profile request failed:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Get profile error:", error);
      return null;
    }
  }

  async validateAuthState(): Promise<{ isValid: boolean; user?: any; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return { isValid: false, error: "Not authenticated" };
      }

      // Verify token is still valid by making a profile request
      const profile = await this.getProfile();
      if (profile) {
        return { isValid: true, user: profile };
      } else {
        // Token is invalid, clear state
        await this.logout();
        return { isValid: false, error: "Token validation failed" };
      }
    } catch (error) {
      console.error("Auth state validation error:", error);
      // Clear invalid state
      await this.logout();
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("skillup_token");
    const user = localStorage.getItem("skillup_user");
    return !!(token && user);
  }

  async getCurrentUser(): Promise<any> {
    try {
      const token = localStorage.getItem("skillup_token");
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.user || userData;
      } else if (response.status === 401) {
        localStorage.removeItem("skillup_token");
        localStorage.removeItem("skillup_user");
        return null;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
}

export const authService = new AuthService();
export type { AuthService };
