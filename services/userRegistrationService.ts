// User Registration Service for Hybrid Auth System
import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

export interface NewUserData {
  fullname: string;
  role: 'admin' | 'teacher' | 'student';
  email?: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  note?: string;
  username?: string; // <-- add username
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
  };
}

class UserRegistrationService {
  // Generate username from full name
  private generateUsername(fullname: string, role: string): string {
    // Remove special characters and convert to lowercase
    const cleanName = fullname
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .trim();
    
    // Generate base username (no role prefix, just clean name)
    let username = cleanName;
    
    // Ensure uniqueness by adding timestamp if needed
    const timestamp = Date.now().toString().slice(-4);
    username = `${username}${timestamp}`;
    
    return username;
  }

  // Generate email based on username and role
  private generateEmail(username: string, role: string): string {
    const domain = role === 'student' ? 'student.skillup' : 'teacher.skillup';
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
    } catch (error: any) {
      console.error('Firebase user creation error:', error);
      throw new Error(`Failed to create Firebase user: ${error.message}`);
    }
  }

  // Create user in MongoDB
  private async createMongoDBUser(userData: {
    firebaseUid: string;
    name: string;
    email: string;
    role: string;
    username: string;
    phone?: string;
    englishName?: string;
    dob?: string;
    gender?: string;
    note?: string;
  }) {
    try {
      console.log('🔍 [DEBUG] Starting MongoDB user creation...');
      console.log('🔍 [DEBUG] User data:', userData);
      
      const token = await this.getAuthToken();
      console.log('🔍 [DEBUG] Auth token obtained:', token ? 'YES' : 'NO');
      
      const url = `${API_BASE_URL}/users`;
      console.log('🔍 [DEBUG] Making request to:', url);
      console.log('🔍 [DEBUG] Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      });
      console.log('🔍 [DEBUG] Request body:', userData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('🔍 [DEBUG] Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🔍 [DEBUG] Parsed JSON response:', data);
      } catch (parseError) {
        console.error('🔍 [DEBUG] Failed to parse JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create MongoDB user');
      }
      
      console.log('🔍 [DEBUG] MongoDB user creation successful:', data.user);
      return data.user;
    } catch (error) {
      console.error('🔍 [DEBUG] MongoDB user creation error:', error);
      throw error;
    }
  }

  // Get auth token from localStorage or create one for hybrid auth users
  private async getAuthToken(): Promise<string | null> {
    console.log('🔍 [DEBUG] Getting auth token...');
    
    // Check if we have a JWT token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🔍 [DEBUG] Found existing auth token');
      return token;
    }

    console.log('🔍 [DEBUG] No existing token, checking Firebase user...');
    
    // If no JWT token, try to get Firebase ID token and exchange it for JWT
    const user = auth.currentUser;
    if (user) {
      console.log('🔍 [DEBUG] Firebase user found:', user.email);
      try {
        const idToken = await user.getIdToken();
        console.log('🔍 [DEBUG] Got Firebase ID token, exchanging for JWT...');
        
        const url = `${API_BASE_URL}/auth/firebase-login`;
        console.log('🔍 [DEBUG] Making request to:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseToken: idToken,
            email: user.email,
          }),
        });

        console.log('🔍 [DEBUG] Firebase login response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 [DEBUG] Firebase login response:', data);
          const jwtToken = data.token;
          localStorage.setItem('authToken', jwtToken);
          console.log('🔍 [DEBUG] Stored JWT token');
          return jwtToken;
        } else {
          console.error('🔍 [DEBUG] Firebase login failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('🔍 [DEBUG] Error exchanging Firebase token for JWT:', error);
      }
    } else {
      console.log('🔍 [DEBUG] No Firebase user found');
    }

    console.log('🔍 [DEBUG] No auth token available');
    return null;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/check-username/${encodeURIComponent(username)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Check username exists error:', error);
      return false;
    }
  }

  // Main registration function
  async registerNewUser(userData: NewUserData): Promise<RegistrationResponse> {
    try {
      // Step 1: Use provided username or generate one
      const username = userData.username || this.generateUsername(userData.fullname, userData.role);
      const email = userData.email || this.generateEmail(username, userData.role);
      const password = this.generatePassword(userData.role);

      console.log('Generated credentials:', { username, email, password });

      // Step 2: Create Firebase Auth user
      const firebaseUid = await this.createFirebaseUser(email, password);

      // Step 3: Create MongoDB user
      const mongoUser = await this.createMongoDBUser({
        firebaseUid,
        name: userData.fullname,
        email,
        role: userData.role,
        username,
        phone: userData.phone,
        englishName: userData.englishName,
        dob: userData.dob,
        gender: userData.gender,
        note: userData.note,
      });

      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: mongoUser.id,
          name: mongoUser.name,
          email: mongoUser.email,
          role: mongoUser.role,
          username,
          password,
        },
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Failed to register user',
      };
    }
  }

  // Check if username/email already exists
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/check-email/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
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
      // Try to create a temporary user to check if email exists
      // This is a workaround since Firebase doesn't have a direct "check if email exists" API
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/check-email/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Check email exists error:', error);
      return false;
    }
  }

  // Check if username or email exists
  async checkUsernameOrEmailExists(username: string, role: string): Promise<boolean> {
    const email = `${username}@${role === 'student' ? 'student.skillup' : 'teacher.skillup'}`;
    
    // Check both username in MongoDB and email in Firebase
    const [usernameExists, emailExists] = await Promise.all([
      this.checkUsernameExists(username),
      this.checkEmailExists(email)
    ]);
    
    return usernameExists || emailExists;
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.users || [];
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const userRegistrationService = new UserRegistrationService(); 