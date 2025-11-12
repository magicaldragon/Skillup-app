// frontend/services/userRegistrationService.ts - User Registration Service
// This service handles user registration in the Firebase-only architecture:
// - Firebase Authentication for user accounts
// - Firestore for user data storage
// - VStorage only for assignment files (not user data)
// - Username format: fullName + @role.skillup (e.g., "john-doe@student.skillup")

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { generateVietnameseUsername } from '../../utils/stringUtils';
import { auth } from './firebase';

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
  email?: string; // Personal email (optional) - separate from Firebase email
  role: 'student' | 'teacher' | 'admin' | 'staff';
  gender?: 'male' | 'female' | 'other';
  englishName?: string;
  dob?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  status?: string;
}

export interface RegistrationResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string; // This will be the Firebase email
    personalEmail?: string; // This will be the personal email if provided
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
      console.log('userRegistrationService.registerNewUser called with:', data);

      // 1. Generate username and Firebase email based on full name and role
      const username = generateUsername(data.name);
      const firebaseEmail = generateEmail(username, data.role);
      const password = generatePassword(data.role);

      console.log('Generated credentials:', {
        username,
        firebaseEmail,
        personalEmail: data.email,
        role: data.role,
        hasPassword: !!password,
      });

      // 2. Create user in Firebase Auth with the generated email
      console.log('Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
      const firebaseUid = userCredential.user.uid;
      console.log('Firebase Auth user created with UID:', firebaseUid);

      // 3. Send registration data to backend, including firebaseUid, username, and both emails
      const backendData = {
        ...data,
        email: firebaseEmail, // Firebase email for authentication
        personalEmail: data.email, // Personal email for contact
        username,
        firebaseUid,
        status: data.status || 'potential', // Pass status from form
      };

      console.log('Sending data to backend:', backendData);
      console.log('Backend URL:', `${apiUrl}/users`);

      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('Backend success response:', result);

      // 4. Return enhanced response with generated credentials
      const finalResult = {
        ...result,
        user: {
          ...result.user,
          username,
          email: firebaseEmail, // Firebase email for display
          personalEmail: data.email, // Personal email for reference
          generatedPassword: password,
        },
      };

      console.log('Final result to return:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('Registration error in userRegistrationService:', error);
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
  },
};
