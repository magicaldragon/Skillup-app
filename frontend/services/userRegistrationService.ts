import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

export interface NewUserData {
  fullname: string;
  email: string;
  password: string;
  role: 'student' | 'staff' | 'teacher' | 'admin';
  username?: string;
}

export interface GeneratedCredentials {
  username: string;
  email: string;
  password: string;
}

async function checkBackendHealth() {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/cors-test`, { method: 'GET' });
    if (!response.ok) throw new Error('Backend health check failed');
    return true;
  } catch (err) {
    return false;
  }
}

class UserRegistrationService {
  private async getAuthToken(): Promise<string | null> {
    // Check if we have a JWT token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      return token;
    }

    // If no JWT token, try to get Firebase ID token and exchange it for JWT
    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
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
        }
      } catch (error) {
        console.error('Error exchanging Firebase token for JWT:', error);
      }
    }

    return null;
  }

  async createMongoDBUser(userData: NewUserData): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullname: userData.fullname,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        username: userData.username,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user in MongoDB');
    }

    return await response.json();
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/check-username/${username}`);
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      return false;
    } catch (error) {
      console.error('Check username exists error:', error);
      return false;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/check-email/${email}`);
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      return false;
    } catch (error) {
      console.error('Check email exists error:', error);
      return false;
    }
  }

  async checkUsernameOrEmailExists(username: string, role: string): Promise<{ usernameExists: boolean; emailExists: boolean }> {
    const email = `${username}@${role}.skillup`;
    
    try {
      const [usernameResult, emailResult] = await Promise.all([
        this.checkUsernameExists(username),
        this.checkEmailExists(email)
      ]);

      return {
        usernameExists: usernameResult,
        emailExists: emailResult
      };
    } catch (error) {
      console.error('Error checking username/email existence:', error);
      return { usernameExists: false, emailExists: false };
    }
  }

  async registerNewUser(userData: NewUserData): Promise<{ success: boolean; message: string; user?: any }> {
    if (!(await checkBackendHealth())) {
      throw new Error('Backend server is unavailable. Please try again in a few seconds.');
    }
    try {
      // Use provided username or generate one
      const username = userData.username || await this.generateUsername(userData.fullname, userData.role);
      const email = `${username}@${userData.role}.skillup`;

      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      console.log('✅ Firebase user created:', userCredential.user.uid);

      // Create user in MongoDB
      const mongoUser = await this.createMongoDBUser({
        ...userData,
        email,
        username,
      });
      console.log('✅ MongoDB user created:', mongoUser);

      return {
        success: true,
        message: 'User registered successfully in both Firebase and MongoDB',
        user: mongoUser,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  async generateUsername(fullname: string, role: string): Promise<string> {
    // Clean the fullname: remove accents, non-alphanumeric chars, convert to lowercase
    const cleanName = fullname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric
      .toLowerCase();

    let username = cleanName;
    let counter = 1;

    // Check if username exists and append number if needed
    while (true) {
      const { usernameExists, emailExists } = await this.checkUsernameOrEmailExists(username, role);
      
      if (!usernameExists && !emailExists) {
        break;
      }
      
      username = `${cleanName}${counter}`;
      counter++;
    }

    return username;
  }

  async generateCredentialsPreview(fullname: string, role: string): Promise<GeneratedCredentials> {
    const username = await this.generateUsername(fullname, role);
    const email = `${username}@${role}.skillup`;
    const password = this.generatePassword();

    return {
      username,
      email,
      password,
    };
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const userRegistrationService = new UserRegistrationService(); 