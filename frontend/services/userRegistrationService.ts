import { authService } from './authService';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';

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
  };
}

export const userRegistrationService = {
  async registerNewUser(data: RegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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