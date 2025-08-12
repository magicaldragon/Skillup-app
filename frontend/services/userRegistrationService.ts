// frontend/services/userRegistrationService.ts - User Registration Service
// This service handles user registration in the Firebase-only architecture:
// - Firebase Authentication for user accounts  
// - Firestore for user data storage
// - VStorage only for assignment files (not user data)
// - Username format: fullName + @role.skillup (e.g., "john-doe@student.skillup")
import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { generateVietnameseUsername } from '../../utils/stringUtils';

const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

function generateUsername(fullName: string): string {
  // Use enhanced Vietnamese name handling
  return generateVietnameseUsername(fullName);
}

function generateEmail(username: string, role: string): string {
  return `${username}@${role}.skillup`;
}

// Enhanced password generation based on role
function generatePassword(role: string): string {
  return role === 'student' ? 'Skillup123' : 'Skillup@123';
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
      // 1. Generate username and email based on full name and role
      const username = generateUsername(data.name);
      const email = generateEmail(username, data.role);
      const password = data.password || generatePassword(data.role);

      console.log('Generated credentials:', { username, email, role: data.role, hasPassword: !!password });

      // 2. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUid = userCredential.user.uid;

      // 3. Send registration data to backend, including firebaseUid, username, and generated email
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

      const result = await response.json();
      
      // 4. Return enhanced response with generated credentials
      return {
        ...result,
        user: {
          ...result.user,
          username,
          email,
          generatedPassword: password
        }
      };
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