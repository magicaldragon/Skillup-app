// apiService.ts - Simple Firebase Functions API Service
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

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  
  const sessionToken = localStorage.getItem('skillup_token');
  if (sessionToken) {
    return sessionToken;
  }
  
  throw new Error('No authentication token available');
}

// Simple API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  async getProfile() {
    return apiCall('/auth/profile');
  },

  async updateProfile(profileData: ProfileUpdateData) {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async verifyToken(token: string) {
    return apiCall('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async refreshSession() {
    return apiCall('/auth/refresh', {
      method: 'POST',
    });
  },

  async logout() {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  async getPermissions() {
    return apiCall('/auth/permissions');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Users API
export const usersAPI = {
  async getUsers(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    const queryString = searchParams.toString();
    return apiCall(`/users${queryString ? `?${queryString}` : ''}`);
  },

  async getUserById(id: string) {
    return apiCall(`/users/${id}`);
  },

  async createUser(userData: UserCreateData) {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: string, userData: UserUpdateData) {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string) {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  async checkEmail(email: string) {
    return apiCall(`/users/check-email/${email}`);
  },

  async checkUsername(username: string) {
    return apiCall(`/users/check-username/${username}`);
  },

  async updateAvatar(id: string, avatarData: AvatarUpdateData) {
    return apiCall(`/users/${id}/avatar`, {
      method: 'PUT',
      body: JSON.stringify(avatarData),
    });
  },

  async removeAvatar(id: string) {
    return apiCall(`/users/${id}/avatar`, {
      method: 'DELETE',
    });
  },

  async changePassword(id: string, newPassword: string) {
    return apiCall(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },
};

// Classes API
export const classesAPI = {
  async getClasses(params?: { isActive?: boolean; teacherId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    if (params?.teacherId) {
      searchParams.append('teacherId', params.teacherId);
    }
    const queryString = searchParams.toString();
    return apiCall(`/classes${queryString ? `?${queryString}` : ''}`);
  },

  async getClassById(id: string) {
    return apiCall(`/classes/${id}`);
  },

  async createClass(classData: ClassCreateData) {
    return apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  async updateClass(id: string, classData: ClassUpdateData) {
    return apiCall(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  },

  async deleteClass(id: string) {
    return apiCall(`/classes/${id}`, {
      method: 'DELETE',
    });
  },

  async addStudentToClass(classId: string, studentId: string) {
    return apiCall(`/classes/${classId}/students/${studentId}`, {
      method: 'POST',
    });
  },

  async removeStudentFromClass(classId: string, studentId: string) {
    return apiCall(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  async checkClassCodeGaps(levelId: string) {
    return apiCall(`/classes/check-gaps/${levelId}`);
  },
};

// Levels API
export const levelsAPI = {
  async getLevels(params?: { isActive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    const queryString = searchParams.toString();
    return apiCall(`/levels${queryString ? `?${queryString}` : ''}`);
  },

  async getLevelById(id: string) {
    return apiCall(`/levels/${id}`);
  },

  async createLevel(levelData: LevelCreateData) {
    return apiCall('/levels', {
      method: 'POST',
      body: JSON.stringify(levelData),
    });
  },

  async updateLevel(id: string, levelData: LevelUpdateData) {
    return apiCall(`/levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(levelData),
    });
  },

  async deleteLevel(id: string) {
    return apiCall(`/levels/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderLevels(levelOrders: { id: string; order: number }[]) {
    return apiCall('/levels/reorder', {
      method: 'PUT',
      body: JSON.stringify({ levelOrders }),
    });
  },
};

// Assignments API
export const assignmentsAPI = {
  async getAssignments(params?: { classId?: string; isActive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.classId) {
      searchParams.append('classId', params.classId);
    }
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    const queryString = searchParams.toString();
    return apiCall(`/assignments${queryString ? `?${queryString}` : ''}`);
  },

  async getAssignmentById(id: string) {
    return apiCall(`/assignments/${id}`);
  },

  async createAssignment(assignmentData: AssignmentCreateData) {
    return apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  async updateAssignment(id: string, assignmentData: AssignmentUpdateData) {
    return apiCall(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  },

  async deleteAssignment(id: string) {
    return apiCall(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  async getClassAssignments(classId: string, params?: { isActive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString());
    }
    const queryString = searchParams.toString();
    return apiCall(`/assignments/class/${classId}${queryString ? `?${queryString}` : ''}`);
  },
};

// Submissions API
export const submissionsAPI = {
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
    return apiCall(`/submissions${queryString ? `?${queryString}` : ''}`);
  },

  async getSubmissionById(id: string) {
    return apiCall(`/submissions/${id}`);
  },

  async createSubmission(submissionData: SubmissionCreateData) {
    return apiCall('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },

  async updateSubmission(id: string, submissionData: SubmissionUpdateData) {
    return apiCall(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    });
  },

  async deleteSubmission(id: string) {
    return apiCall(`/submissions/${id}`, {
      method: 'DELETE',
    });
  },

  async getAssignmentSubmissions(assignmentId: string) {
    return apiCall(`/submissions/assignment/${assignmentId}`);
  },
};

// Potential Students API
export const potentialStudentsAPI = {
  async getPotentialStudents(params?: { status?: string; assignedTo?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.assignedTo) {
      searchParams.append('assignedTo', params.assignedTo);
    }
    const queryString = searchParams.toString();
    return apiCall(`/potential-students${queryString ? `?${queryString}` : ''}`);
  },

  async getPotentialStudentById(id: string) {
    return apiCall(`/potential-students/${id}`);
  },

  async createPotentialStudent(potentialStudentData: PotentialStudentCreateData) {
    return apiCall('/potential-students', {
      method: 'POST',
      body: JSON.stringify(potentialStudentData),
    });
  },

  async updatePotentialStudent(id: string, potentialStudentData: PotentialStudentUpdateData) {
    return apiCall(`/potential-students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(potentialStudentData),
    });
  },

  async deletePotentialStudent(id: string) {
    return apiCall(`/potential-students/${id}`, {
      method: 'DELETE',
    });
  },

  async assignToTeacher(id: string, teacherId: string) {
    return apiCall(`/potential-students/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ teacherId }),
    });
  },

  async convertToStudent(id: string, conversionData: ConversionData) {
    return apiCall(`/potential-students/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(conversionData),
    });
  },
};

// Student Records API
export const studentRecordsAPI = {
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
    return apiCall(`/student-records${queryString ? `?${queryString}` : ''}`);
  },

  async getStudentRecordById(id: string) {
    return apiCall(`/student-records/${id}`);
  },

  async createStudentRecord(studentRecordData: StudentRecordCreateData) {
    return apiCall('/student-records', {
      method: 'POST',
      body: JSON.stringify(studentRecordData),
    });
  },

  async updateStudentRecord(id: string, studentRecordData: StudentRecordUpdateData) {
    return apiCall(`/student-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentRecordData),
    });
  },

  async deleteStudentRecord(id: string) {
    return apiCall(`/student-records/${id}`, {
      method: 'DELETE',
    });
  },

  async getStudentRecordsByStudent(studentId: string) {
    return apiCall(`/student-records/student/${studentId}`);
  },

  async getStudentRecordsByClass(classId: string) {
    return apiCall(`/student-records/class/${classId}`);
  },
};

// Change Logs API
export const changeLogsAPI = {
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
    return apiCall(`/change-logs${queryString ? `?${queryString}` : ''}`);
  },

  async getChangeLogById(id: string) {
    return apiCall(`/change-logs/${id}`);
  },

  async createChangeLog(changeLogData: ChangeLogCreateData) {
    return apiCall('/change-logs', {
      method: 'POST',
      body: JSON.stringify(changeLogData),
    });
  },

  async deleteChangeLog(id: string) {
    return apiCall(`/change-logs/${id}`, {
      method: 'DELETE',
    });
  },

  async getEntityChangeLogs(entityType: string, entityId: string) {
    return apiCall(`/change-logs/entity/${entityType}/${entityId}`);
  },

  async getDashboardSummary(params?: { days?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.days) {
      searchParams.append('days', params.days.toString());
    }
    const queryString = searchParams.toString();
    return apiCall(`/change-logs/summary/dashboard${queryString ? `?${queryString}` : ''}`);
  },
};

// Health check
export const healthAPI = {
  async checkHealth() {
    return apiCall('/health');
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
