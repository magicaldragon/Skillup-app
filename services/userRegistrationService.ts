// services/userRegistrationService.ts - User Registration Service
// This service handles user registration in the Firebase-only architecture:
// - Firebase Authentication for user accounts
// - Firestore for user data storage
// - VStorage only for assignment files (not user data)

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../frontend/services/firebase';
import type { Student } from '../types';
import { safeTrim } from '../utils/stringUtils';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

// Ensure consistent URL format (remove trailing slash if present)
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

export interface NewUserData {
  name: string;
  role: 'admin' | 'teacher' | 'student';
  email?: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  note?: string;
  username?: string;
  parentName?: string;
  parentPhone?: string;
  status?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    username: string;
    password: string;
    studentCode?: string;
  };
}

class UserRegistrationService {
  // Generate username from full name
  private async generateUsername(fullname: string): Promise<string> {
    // Remove special characters and convert to lowercase
    const cleanName = safeTrim(fullname)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '');

    // Generate base username (no role prefix, just clean name)
    let username = cleanName;
    let counter = 0;

    // Check if username exists and add number if needed
    while (await this.checkUsernameExists(username)) {
      counter++;
      username = `${cleanName}${counter}`;
    }

    return username;
  }

  // Generate email based on username and role
  private generateEmail(username: string, role: string): string {
    let domain = 'teacher.skillup'; // default

    switch (role) {
      case 'student':
        domain = 'student.skillup';
        break;
      case 'teacher':
        domain = 'teacher.skillup';
        break;
      case 'staff':
        domain = 'staff.skillup';
        break;
      case 'admin':
        domain = 'admin.skillup';
        break;
      default:
        domain = 'teacher.skillup';
    }

    return `${username}@${domain}`;
  }

  // Generate default password based on role
  private generatePassword(role: string): string {
    return role === 'student' ? 'Skillup123' : 'Skillup@123';
  }

  // Create user in Firebase Auth
  private async createFirebaseUser(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user.uid;
    } catch (error: unknown) {
      console.error('Firebase user creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create Firebase user: ${errorMessage}`);
    }
  }

  // Check if username exists in Firestore
  private async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${normalizeUrl(API_BASE_URL)}/users/check-username/${encodeURIComponent(username)}`,
        {
          credentials: 'include',
        }
      );
      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Check username exists error:', error);
      return false;
    }
  }

  // Get Firebase auth token
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return await user.getIdToken();
  }

  // Register new user (Firebase-only)
  async registerUser(userData: NewUserData): Promise<RegistrationResponse> {
    try {
      // Step 1: Generate username and email
      const username = userData.username || (await this.generateUsername(userData.name));
      const email = userData.email || this.generateEmail(username, userData.role);
      const password = this.generatePassword(userData.role);

      // Step 2: Create Firebase Auth user
      const firebaseUid = await this.createFirebaseUser(email, password);

      // Step 3: Create user in Firestore via API
      const token = await this.getAuthToken();
      const response = await fetch(`${normalizeUrl(API_BASE_URL)}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firebaseUid,
          name: userData.name,
          email,
          role: userData.role,
          username,
          phone: userData.phone,
          englishName: userData.englishName,
          dob: userData.dob,
          gender: userData.gender,
          note: userData.note,
          parentName: userData.parentName,
          parentPhone: userData.parentPhone,
          status: userData.status || 'active',
        }),
      });

      let data: unknown;
      try {
        data = JSON.parse(await response.text());
      } catch (_parseError) {
        throw new Error('Invalid response from backend');
      }

      if (!data || typeof data !== 'object' || !('success' in data)) {
        throw new Error('Invalid response from backend for user creation');
      }

      const responseData = data as { success: boolean; message?: string; user?: Student };

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to create user in backend');
      }

      if (!responseData.user) {
        throw new Error('Failed to create user in backend');
      }

      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: responseData.user.id,
          name: responseData.user.name,
          email: responseData.user.email,
          role: responseData.user.role,
          username,
          password,
          studentCode: responseData.user.studentCode,
        },
      };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Failed to register user',
      };
    }
  }

  // Check if username/email already exists
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(
        `${normalizeUrl(API_BASE_URL)}/users/check-email/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Check user exists error:', error);
      return false;
    }
  }

  // Check if email exists in Firebase
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(
        `${normalizeUrl(API_BASE_URL)}/users/check-email/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Check email exists error:', error);
      return false;
    }
  }

  // Check if username or email exists
  async checkUsernameOrEmailExists(username: string, role: string): Promise<boolean> {
    // Generate email from username and role for checking
    const email = username.includes('@') ? username : this.generateEmail(username, role);

    // Check both username and email
    const [usernameExists, emailExists] = await Promise.all([
      this.checkUsernameExists(username),
      this.checkEmailExists(email),
    ]);

    return usernameExists || emailExists;
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<Student[]> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${normalizeUrl(API_BASE_URL)}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }
}

export default new UserRegistrationService();
