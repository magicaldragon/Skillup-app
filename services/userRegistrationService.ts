// User Registration Service for Hybrid Auth System
import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { safeTrim } from '../utils/stringUtils';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

export interface NewUserData {
  name: string; // Change from fullname to name
  role: 'admin' | 'teacher' | 'student';
  email?: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  note?: string;
  username?: string; // <-- add username
  parentName?: string; // Add parent name
  parentPhone?: string; // Add parent phone
  status?: string; // Add status
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
    studentCode?: string; // Added for new flow
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
    } catch (error: any) {
      console.error('Firebase user creation error:', error);
      throw new Error(`Failed to create Firebase user: ${error.message}`);
    }
  }

  // Create user in MongoDB
  private async createMongoDBUser(userData: {
    firebaseUid?: string; // Make optional since backend will create Firebase user
    name: string;
    email: string;
    role: string;
    username: string;
    phone?: string;
    englishName?: string;
    dob?: string;
    gender?: string;
    note?: string;
    parentName?: string;
    parentPhone?: string;
    status?: string;
    password?: string; // Added for new flow
  }) {
    try {
      const token = await this.getAuthToken();
      
      const url = `${API_BASE_URL}/users`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          gender: userData.gender,
          englishName: userData.englishName,
          dob: userData.dob,
          phone: userData.phone,
          parentName: userData.parentName || '',
          parentPhone: userData.parentPhone || '',
          notes: userData.note,
          status: userData.status || 'active',
          firebaseUid: userData.firebaseUid, // Pass the firebaseUid to backend
          password: userData.password, // Pass password to backend for Firebase user creation
        }),
      });

      let data;
      try {
        data = JSON.parse(await response.text());
      } catch (parseError) {
        console.error('🔍 [DEBUG] Failed to parse JSON:', parseError);
        throw new Error(`Invalid JSON response: ${response.text()}`);
      }
      
      if (!data.success) {
        // Check if this is the "role is not defined" error from old backend
        if (data.message && data.message.includes('role is not defined')) {
          throw new Error('Backend needs to be updated. Please contact administrator to deploy the latest backend changes.');
        }
        throw new Error(data.message || 'Failed to create MongoDB user');
      }
      
      return data.user;
    } catch (error) {
      console.error('🔍 [DEBUG] MongoDB user creation error:', error);
      throw error;
    }
  }

  // Create potential student entry (for students only)
  private async createPotentialStudent(userData: {
    firebaseUid: string;
    name: string;
    email: string;
    username: string;
    phone?: string;
    englishName?: string;
    dob?: string;
    gender?: string;
    note?: string;
  }) {
    try {
      const token = await this.getAuthToken();
      
      const url = `${API_BASE_URL}/potential-students`;
      
      const potentialStudentData = {
        name: userData.name,
        englishName: userData.englishName,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        dob: userData.dob,
        status: 'pending',
        source: 'admin_registration',
        notes: userData.note,
        // Additional fields for potential student
        currentSchool: '',
        currentGrade: '',
        englishLevel: 'beginner',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        interestedPrograms: [],
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(potentialStudentData),
      });

      let data;
      try {
        data = JSON.parse(await response.text());
      } catch (parseError) {
        console.error('🔍 [DEBUG] Failed to parse potential student JSON:', parseError);
        throw new Error(`Invalid JSON response: ${response.text()}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create potential student entry');
      }
      
      return data.potentialStudent;
    } catch (error) {
      console.error('🔍 [DEBUG] Potential student creation error:', error);
      throw error;
    }
  }

  // Get auth token from localStorage or create one for hybrid auth users
  private async getAuthToken(): Promise<string | null> {
    
    // Check if we have a JWT token in localStorage
    const token = localStorage.getItem('skillup_token');
    if (token) {
      return token;
    }

    
    // If no JWT token, try to get Firebase ID token and exchange it for JWT
    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        
        const url = `${API_BASE_URL}/auth/firebase-login`;
        
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

        if (response.ok) {
          const data = await response.json();
          const jwtToken = data.token;
          localStorage.setItem('authToken', jwtToken);
          return jwtToken;
        } else {
          console.error('🔍 [DEBUG] Firebase login failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('🔍 [DEBUG] Error exchanging Firebase token for JWT:', error);
      }
    }

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
      const username = userData.username || await this.generateUsername(userData.name);
      const email = userData.email || this.generateEmail(username, userData.role);
      const password = this.generatePassword(userData.role);

      // Step 2: Create Firebase Auth user using frontend SDK
      const firebaseUid = await this.createFirebaseUser(email, password);

      // Step 3: Create MongoDB user
      try {
        const mongoUser = await this.createMongoDBUser({
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
          status: userData.status,
        });

        // Step 4: For students only, also create potential student entry
        if (userData.role === 'student') {
          try {
            await this.createPotentialStudent({
              firebaseUid,
              name: userData.name,
              email,
              username,
              phone: userData.phone,
              englishName: userData.englishName,
              dob: userData.dob,
              gender: userData.gender,
              note: userData.note,
            });
            console.log('✅ Student added to accounts and potential students list');
          } catch (potentialStudentError) {
            console.warn('⚠️ Failed to add student to potential students list:', potentialStudentError);
            // Don't fail the entire registration if potential student creation fails
          }
        }

        return {
          success: true,
          message: userData.role === 'student' 
            ? 'Student registered successfully and added to potential students list' 
            : 'User registered successfully',
          user: {
            id: mongoUser.id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,
            username,
            password,
            studentCode: mongoUser.studentCode,
          },
        };
      } catch (mongoError: any) {
        // If MongoDB creation fails, delete the Firebase user to maintain consistency
        try {
          // Note: We can't delete Firebase users from frontend without admin privileges
          // This is a limitation of the frontend SDK
          console.warn('⚠️ MongoDB creation failed, but Firebase user was created');
        } catch (deleteError) {
          console.error('❌ Failed to clean up Firebase user:', deleteError);
        }
        throw mongoError;
      }

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