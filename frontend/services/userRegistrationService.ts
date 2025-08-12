// userRegistrationService.ts
// Handles user registration with Firebase Authentication and MongoDB synchronization

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

function generateUsername(fullName: string): string {
  // Lowercase, remove spaces and special characters
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

export interface RegistrationData {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'staff';
  gender?: 'male' | 'female' | 'other';
  englishName?: string;
  dob?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  status?: string;
  password?: string; // Add password field for registration
}

export interface RegistrationResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    studentCode?: string;
    firebaseUid: string;
    username?: string;
  };
}

export const userRegistrationService = {
  async registerNewUser(data: RegistrationData): Promise<RegistrationResponse> {
    try {
      // 1. Use provided email directly - no more automatic generation
      const username = generateUsername(data.name);
      const email = data.email; // Use the email provided by the user
      const password = data.password || (data.role === 'student' ? 'Skillup123' : 'Skillup@123');

      if (!email) {
        throw new Error('Email address is required');
      }

      // 2. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUid = userCredential.user.uid;

      // 3. Send registration data to backend, including firebaseUid, username, and email
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...data, 
          email, 
          username, 
          firebaseUid,
          status: data.status || 'potential' // Pass status from form
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async createPotentialStudent(data: RegistrationData): Promise<RegistrationResponse> {
    // For potential students, we still create a full user account
    // but with status 'potential'
    return this.registerNewUser(data);
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/users/check-email/${encodeURIComponent(email)}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  }
}; 