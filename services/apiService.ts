// apiService.ts - Enhanced Firebase Functions API Service with robust error handling
import type {
  AssignmentCreateData,
  AssignmentUpdateData,
  AvatarUpdateData,
  ChangeLogCreateData,
  ClassCreateData,
  ClassUpdateData,
  ConversionData,
  LevelCreateData,
  LevelUpdateData,
  PotentialStudentCreateData,
  PotentialStudentUpdateData,
  ProfileUpdateData,
  StudentRecordCreateData,
  StudentRecordUpdateData,
  SubmissionCreateData,
  SubmissionUpdateData,
  UserCreateData,
  UserUpdateData
} from '../types';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

// Ensure consistent URL format (remove trailing slash if present)
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

// Enhanced error handling and retry configuration
const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000, // Reduced from 30s to 15s for faster failures
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Request cache for reducing redundant API calls
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const REQUEST_CACHE = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 30000; // 30 seconds

// Cache management functions
function getCacheKey(endpoint: string, options: RequestInit): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
}

function getCachedResponse<T>(cacheKey: string): T | null {
  const entry = REQUEST_CACHE.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    console.log('Returning cached response for:', cacheKey);
    return entry.data;
  }
  if (entry) {
    REQUEST_CACHE.delete(cacheKey); // Remove expired entry
  }
  return null;
}

function setCachedResponse<T>(cacheKey: string, data: T, ttl = DEFAULT_CACHE_TTL): void {
  REQUEST_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Clear cache function for login/logout scenarios
export function clearAPICache(): void {
  REQUEST_CACHE.clear();
  console.log('API cache cleared');
}

// Enhanced error class for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function to get auth token with retry
async function getAuthToken(retryCount = 0): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return await user.getIdToken();
  } catch (error) {
    if (retryCount < API_CONFIG.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return getAuthToken(retryCount + 1);
    }
    throw new APIError('Failed to get authentication token', 401, 'AUTH_TOKEN_ERROR');
  }
}

// Enhanced API call function with retry, timeout, caching, and better error handling
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retryCount = 0,
  cacheTtl?: number
): Promise<T> {
  const cacheKey = getCacheKey(endpoint, options);
  const method = options.method || 'GET';
  
  // Check cache for GET requests
  if (method === 'GET') {
    const cachedData = getCachedResponse<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
  }

  try {
    const token = await getAuthToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(`${normalizeUrl(API_BASE_URL)}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache', // Prevent browser caching conflicts
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, use status text
        errorData = { message: response.statusText };
      }

      // Check if error is retryable
      if (
        API_CONFIG.retryableStatuses.includes(response.status) && 
        retryCount < API_CONFIG.maxRetries
      ) {
        console.warn(`API call failed with status ${response.status}, retrying... (${retryCount + 1}/${API_CONFIG.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)));
        return apiCall<T>(endpoint, options, retryCount + 1, cacheTtl);
      }

      throw new APIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData
      );
    }

    const data = await response.json();
    
    // Validate response structure
    if (data === null || data === undefined) {
      throw new APIError('Empty response received', response.status, 'EMPTY_RESPONSE');
    }

    // Cache successful GET responses
    if (method === 'GET') {
      setCachedResponse(cacheKey, data, cacheTtl);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, 'TIMEOUT');
    }

    // Network or other errors
    if (retryCount < API_CONFIG.maxRetries) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`API call failed with error: ${errorMessage}, retrying... (${retryCount + 1}/${API_CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)));
      return apiCall<T>(endpoint, options, retryCount + 1, cacheTtl);
    }

    const errorMessage = error instanceof Error ? error.message : 'Network error';
    throw new APIError(
      errorMessage,
      0,
      'NETWORK_ERROR',
      error instanceof Error ? error : undefined
    );
  }
}

// Enhanced data normalization function
function normalizeResponse<T>(data: any, expectedStructure: 'array' | 'object' | 'any' = 'any'): T {
  if (expectedStructure === 'array') {
    if (Array.isArray(data)) {
      return data as T;
    }
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data.items as T;
    }
    if (data && typeof data === 'object' && Array.isArray(data.users)) {
      return data.users as T;
    }
    if (data && typeof data === 'object' && Array.isArray(data.classes)) {
      return data.classes as T;
    }
    if (data && typeof data === 'object' && Array.isArray(data.assignments)) {
      return data.assignments as T;
    }
    return [] as unknown as T;
  }
  
  if (expectedStructure === 'object') {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as T;
    }
    return {} as unknown as T;
  }
  
  return data as T;
}

// Auth API with enhanced error handling
export const authAPI = {
  // Get current user profile
  async getProfile() {
    const data = await apiCall('/auth/profile');
    return normalizeResponse(data, 'object');
  },

  // Update user profile
  async updateProfile(profileData: ProfileUpdateData) {
    const data = await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return normalizeResponse(data, 'object');
  },

  // Verify Firebase token
  async verifyToken(token: string) {
    const data = await apiCall('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return normalizeResponse(data, 'object');
  },

  // Refresh session
  async refreshSession() {
    const data = await apiCall('/auth/refresh', {
      method: 'POST',
    });
    return normalizeResponse(data, 'object');
  },

  // Logout
  async logout() {
    const data = await apiCall('/auth/logout', {
      method: 'POST',
    });
    return normalizeResponse(data, 'object');
  },

  // Get user permissions
  async getPermissions() {
    const data = await apiCall('/auth/permissions');
    return normalizeResponse(data, 'object');
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string) {
    const data = await apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return normalizeResponse(data, 'object');
  },
};

// Users API with enhanced error handling and data normalization
export const usersAPI = {
  // Get all users
  async getUsers(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/users${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get user by ID
  async getUserById(id: string) {
    const data = await apiCall(`/users/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new user
  async createUser(userData: UserCreateData) {
    const data = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update user
  async updateUser(id: string, userData: UserUpdateData) {
    const data = await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete user
  async deleteUser(id: string) {
    const data = await apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },



  // Check if email exists
  async checkEmail(email: string) {
    const data = await apiCall(`/users/check-email/${email}`);
    return normalizeResponse(data, 'object');
  },

  // Check if username exists
  async checkUsername(username: string) {
    const data = await apiCall(`/users/check-username/${username}`);
    return normalizeResponse(data, 'object');
  },

  // Update user avatar
  async updateAvatar(id: string, avatarData: AvatarUpdateData) {
    const data = await apiCall(`/users/${id}/avatar`, {
      method: 'POST',
      body: JSON.stringify(avatarData),
    });
    return normalizeResponse(data, 'object');
  },

  // Remove user avatar
  async removeAvatar(id: string) {
    const data = await apiCall(`/users/${id}/avatar`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Change user password
  async changePassword(id: string, newPassword: string) {
    const data = await apiCall(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
    return normalizeResponse(data, 'object');
  },
};

// Classes API with enhanced error handling
export const classesAPI = {
  // Get all classes
  async getClasses(params?: { isActive?: boolean; teacherId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    if (params?.teacherId) {
      searchParams.append('teacherId', params.teacherId);
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/classes${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get class by ID
  async getClassById(id: string) {
    const data = await apiCall(`/classes/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new class
  async createClass(classData: ClassCreateData) {
    const data = await apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update class
  async updateClass(id: string, classData: ClassUpdateData) {
    const data = await apiCall(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete class
  async deleteClass(id: string) {
    const data = await apiCall(`/classes/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Add student to class
  async addStudentToClass(classId: string, studentId: string) {
    const data = await apiCall(`/classes/${classId}/students/${studentId}`, {
      method: 'POST',
    });
    return normalizeResponse(data, 'object');
  },

  // Remove student from class
  async removeStudentFromClass(classId: string, studentId: string) {
    const data = await apiCall(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Check for gaps in class code sequence
  async checkClassCodeGaps(levelId: string) {
    const data = await apiCall(`/classes/check-gaps/${levelId}`);
    return normalizeResponse(data, 'object');
  },
};

// Levels API
export const levelsAPI = {
  // Get all levels
  async getLevels(params?: { isActive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/levels${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get level by ID
  async getLevelById(id: string) {
    const data = await apiCall(`/levels/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new level
  async createLevel(levelData: LevelCreateData) {
    const data = await apiCall('/levels', {
      method: 'POST',
      body: JSON.stringify(levelData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update level
  async updateLevel(id: string, levelData: LevelUpdateData) {
    const data = await apiCall(`/levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(levelData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete level
  async deleteLevel(id: string) {
    const data = await apiCall(`/levels/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Reorder levels
  async reorderLevels(levelOrders: { id: string; order: number }[]) {
    const data = await apiCall('/levels/reorder', {
      method: 'POST',
      body: JSON.stringify({ levelOrders }),
    });
    return normalizeResponse(data, 'object');
  },
};

// Assignments API
export const assignmentsAPI = {
  // Get all assignments
  async getAssignments(params?: { classId?: string; isActive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.classId) {
      searchParams.append('classId', params.classId);
    }
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/assignments${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get assignment by ID
  async getAssignmentById(id: string) {
    const data = await apiCall(`/assignments/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new assignment
  async createAssignment(assignmentData: AssignmentCreateData) {
    const data = await apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update assignment
  async updateAssignment(id: string, assignmentData: AssignmentUpdateData) {
    const data = await apiCall(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete assignment
  async deleteAssignment(id: string) {
    const data = await apiCall(`/assignments/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Get assignments for a specific class
  async getClassAssignments(classId: string, params?: { isActive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/assignments/class/${classId}${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },
};

// Submissions API
export const submissionsAPI = {
  // Get all submissions
  async getSubmissions(params?: {
    assignmentId?: string;
    classId?: string;
    studentId?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.assignmentId) {
      searchParams.append('assignmentId', params.assignmentId);
    }
    if (params?.classId) {
      searchParams.append('classId', params.classId);
    }
    if (params?.studentId) {
      searchParams.append('studentId', params.studentId);
    }
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/submissions${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get submission by ID
  async getSubmissionById(id: string) {
    const data = await apiCall(`/submissions/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new submission
  async createSubmission(submissionData: SubmissionCreateData) {
    const data = await apiCall('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update submission
  async updateSubmission(id: string, submissionData: SubmissionUpdateData) {
    const data = await apiCall(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete submission
  async deleteSubmission(id: string) {
    const data = await apiCall(`/submissions/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Get submissions for a specific assignment
  async getAssignmentSubmissions(assignmentId: string) {
    const data = await apiCall(`/submissions/assignment/${assignmentId}`);
    return normalizeResponse(data, 'array');
  },
};

// Potential Students API
export const potentialStudentsAPI = {
  // Get all potential students
  async getPotentialStudents(params?: { status?: string; assignedTo?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.assignedTo) {
      searchParams.append('assignedTo', params.assignedTo);
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/potential-students${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get potential student by ID
  async getPotentialStudentById(id: string) {
    const data = await apiCall(`/potential-students/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new potential student
  async createPotentialStudent(potentialStudentData: PotentialStudentCreateData) {
    const data = await apiCall('/potential-students', {
      method: 'POST',
      body: JSON.stringify(potentialStudentData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update potential student
  async updatePotentialStudent(id: string, potentialStudentData: PotentialStudentUpdateData) {
    const data = await apiCall(`/potential-students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(potentialStudentData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete potential student
  async deletePotentialStudent(id: string) {
    const data = await apiCall(`/potential-students/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Assign potential student to teacher
  async assignToTeacher(id: string, teacherId: string) {
    const data = await apiCall(`/potential-students/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ teacherId }),
    });
    return normalizeResponse(data, 'object');
  },

  // Convert potential student to regular student
  async convertToStudent(id: string, conversionData: ConversionData) {
    const data = await apiCall(`/potential-students/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(conversionData),
    });
    return normalizeResponse(data, 'object');
  },
};

// Student Records API
export const studentRecordsAPI = {
  // Get all student records
  async getStudentRecords(params?: { studentId?: string; classId?: string; levelId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.studentId) {
      searchParams.append('studentId', params.studentId);
    }
    if (params?.classId) {
      searchParams.append('classId', params.classId);
    }
    if (params?.levelId) {
      searchParams.append('levelId', params.levelId);
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/student-records${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get student record by ID
  async getStudentRecordById(id: string) {
    const data = await apiCall(`/student-records/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new student record
  async createStudentRecord(studentRecordData: StudentRecordCreateData) {
    const data = await apiCall('/student-records', {
      method: 'POST',
      body: JSON.stringify(studentRecordData),
    });
    return normalizeResponse(data, 'object');
  },

  // Update student record
  async updateStudentRecord(id: string, studentRecordData: StudentRecordUpdateData) {
    const data = await apiCall(`/student-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentRecordData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete student record
  async deleteStudentRecord(id: string) {
    const data = await apiCall(`/student-records/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Get student records for a specific student
  async getStudentRecordsByStudent(studentId: string) {
    const data = await apiCall(`/student-records/student/${studentId}`);
    return normalizeResponse(data, 'array');
  },

  // Get student records for a specific class
  async getStudentRecordsByClass(classId: string) {
    const data = await apiCall(`/student-records/class/${classId}`);
    return normalizeResponse(data, 'array');
  },
};

// Change Logs API
export const changeLogsAPI = {
  // Get all change logs
  async getChangeLogs(params?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.entityType) {
      searchParams.append('entityType', params.entityType);
    }
    if (params?.entityId) {
      searchParams.append('entityId', params.entityId);
    }
    if (params?.action) {
      searchParams.append('action', params.action);
    }
    if (params?.userId) {
      searchParams.append('userId', params.userId);
    }
    if (params?.startDate) {
      searchParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      searchParams.append('endDate', params.endDate);
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/change-logs${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'array');
  },

  // Get change log by ID
  async getChangeLogById(id: string) {
    const data = await apiCall(`/change-logs/${id}`);
    return normalizeResponse(data, 'object');
  },

  // Create new change log
  async createChangeLog(changeLogData: ChangeLogCreateData) {
    const data = await apiCall('/change-logs', {
      method: 'POST',
      body: JSON.stringify(changeLogData),
    });
    return normalizeResponse(data, 'object');
  },

  // Delete change log
  async deleteChangeLog(id: string) {
    const data = await apiCall(`/change-logs/${id}`, {
      method: 'DELETE',
    });
    return normalizeResponse(data, 'object');
  },

  // Get change logs for a specific entity
  async getEntityChangeLogs(entityType: string, entityId: string) {
    const data = await apiCall(`/change-logs/entity/${entityType}/${entityId}`);
    return normalizeResponse(data, 'array');
  },

  // Get change logs summary for dashboard
  async getDashboardSummary(params?: { days?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.days) {
      searchParams.append('days', params.days.toString());
    }
    const queryString = searchParams.toString();
    const data = await apiCall(`/change-logs/summary/dashboard${queryString ? `?${queryString}` : ''}`);
    return normalizeResponse(data, 'object');
  },
};

// Health check
export const healthAPI = {
  async checkHealth() {
    const data = await apiCall('/health');
    return normalizeResponse(data, 'object');
  },
};

// Export all APIs
export const apiService = {
  auth: authAPI,
  users: usersAPI,
  classes: classesAPI,
  levels: levelsAPI,
  assignments: assignmentsAPI,
  submissions: submissionsAPI,
  potentialStudents: potentialStudentsAPI,
  studentRecords: studentRecordsAPI,
  changeLogs: changeLogsAPI,
  health: healthAPI,
};
