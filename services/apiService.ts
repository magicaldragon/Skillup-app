// apiService.ts - Firebase Functions API Service
import { auth } from './firebase';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return await user.getIdToken();
}

// Helper function to make authenticated API calls
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  // Get current user profile
  async getProfile() {
    return apiCall('/auth/profile');
  },

  // Update user profile
  async updateProfile(profileData: any) {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Verify Firebase token
  async verifyToken(token: string) {
    return apiCall('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Refresh session
  async refreshSession() {
    return apiCall('/auth/refresh', {
      method: 'POST',
    });
  },

  // Logout
  async logout() {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  // Get user permissions
  async getPermissions() {
    return apiCall('/auth/permissions');
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string) {
    return apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Users API
export const usersAPI = {
  // Get all users
  async getUsers(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    const queryString = searchParams.toString();
    return apiCall(`/users${queryString ? `?${queryString}` : ''}`);
  },

  // Get user by ID
  async getUserById(id: string) {
    return apiCall(`/users/${id}`);
  },

  // Create new user
  async createUser(userData: any) {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  async updateUser(id: string, userData: any) {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  async deleteUser(id: string) {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Check if email exists
  async checkEmail(email: string) {
    return apiCall(`/users/check-email/${email}`);
  },

  // Check if username exists
  async checkUsername(username: string) {
    return apiCall(`/users/check-username/${username}`);
  },

  // Update user avatar
  async updateAvatar(id: string, avatarData: any) {
    return apiCall(`/users/${id}/avatar`, {
      method: 'POST',
      body: JSON.stringify(avatarData),
    });
  },

  // Remove user avatar
  async removeAvatar(id: string) {
    return apiCall(`/users/${id}/avatar`, {
      method: 'DELETE',
    });
  },

  // Change user password
  async changePassword(id: string, newPassword: string) {
    return apiCall(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },
};

// Classes API
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
    return apiCall(`/classes${queryString ? `?${queryString}` : ''}`);
  },

  // Get class by ID
  async getClassById(id: string) {
    return apiCall(`/classes/${id}`);
  },

  // Create new class
  async createClass(classData: any) {
    return apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  // Update class
  async updateClass(id: string, classData: any) {
    return apiCall(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  },

  // Delete class
  async deleteClass(id: string) {
    return apiCall(`/classes/${id}`, {
      method: 'DELETE',
    });
  },

  // Add student to class
  async addStudentToClass(classId: string, studentId: string) {
    return apiCall(`/classes/${classId}/students/${studentId}`, {
      method: 'POST',
    });
  },

  // Remove student from class
  async removeStudentFromClass(classId: string, studentId: string) {
    return apiCall(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
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
    return apiCall(`/levels${queryString ? `?${queryString}` : ''}`);
  },

  // Get level by ID
  async getLevelById(id: string) {
    return apiCall(`/levels/${id}`);
  },

  // Create new level
  async createLevel(levelData: any) {
    return apiCall('/levels', {
      method: 'POST',
      body: JSON.stringify(levelData),
    });
  },

  // Update level
  async updateLevel(id: string, levelData: any) {
    return apiCall(`/levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(levelData),
    });
  },

  // Delete level
  async deleteLevel(id: string) {
    return apiCall(`/levels/${id}`, {
      method: 'DELETE',
    });
  },

  // Reorder levels
  async reorderLevels(levelOrders: { id: string; order: number }[]) {
    return apiCall('/levels/reorder', {
      method: 'POST',
      body: JSON.stringify({ levelOrders }),
    });
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
    return apiCall(`/assignments${queryString ? `?${queryString}` : ''}`);
  },

  // Get assignment by ID
  async getAssignmentById(id: string) {
    return apiCall(`/assignments/${id}`);
  },

  // Create new assignment
  async createAssignment(assignmentData: any) {
    return apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  // Update assignment
  async updateAssignment(id: string, assignmentData: any) {
    return apiCall(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  },

  // Delete assignment
  async deleteAssignment(id: string) {
    return apiCall(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  // Get assignments for a specific class
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
    return apiCall(`/submissions${queryString ? `?${queryString}` : ''}`);
  },

  // Get submission by ID
  async getSubmissionById(id: string) {
    return apiCall(`/submissions/${id}`);
  },

  // Create new submission
  async createSubmission(submissionData: any) {
    return apiCall('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },

  // Update submission
  async updateSubmission(id: string, submissionData: any) {
    return apiCall(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    });
  },

  // Delete submission
  async deleteSubmission(id: string) {
    return apiCall(`/submissions/${id}`, {
      method: 'DELETE',
    });
  },

  // Get submissions for a specific assignment
  async getAssignmentSubmissions(assignmentId: string) {
    return apiCall(`/submissions/assignment/${assignmentId}`);
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
    return apiCall(`/potential-students${queryString ? `?${queryString}` : ''}`);
  },

  // Get potential student by ID
  async getPotentialStudentById(id: string) {
    return apiCall(`/potential-students/${id}`);
  },

  // Create new potential student
  async createPotentialStudent(potentialStudentData: any) {
    return apiCall('/potential-students', {
      method: 'POST',
      body: JSON.stringify(potentialStudentData),
    });
  },

  // Update potential student
  async updatePotentialStudent(id: string, potentialStudentData: any) {
    return apiCall(`/potential-students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(potentialStudentData),
    });
  },

  // Delete potential student
  async deletePotentialStudent(id: string) {
    return apiCall(`/potential-students/${id}`, {
      method: 'DELETE',
    });
  },

  // Assign potential student to teacher
  async assignToTeacher(id: string, teacherId: string) {
    return apiCall(`/potential-students/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ teacherId }),
    });
  },

  // Convert potential student to regular student
  async convertToStudent(id: string, conversionData: any) {
    return apiCall(`/potential-students/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(conversionData),
    });
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
    return apiCall(`/student-records${queryString ? `?${queryString}` : ''}`);
  },

  // Get student record by ID
  async getStudentRecordById(id: string) {
    return apiCall(`/student-records/${id}`);
  },

  // Create new student record
  async createStudentRecord(studentRecordData: any) {
    return apiCall('/student-records', {
      method: 'POST',
      body: JSON.stringify(studentRecordData),
    });
  },

  // Update student record
  async updateStudentRecord(id: string, studentRecordData: any) {
    return apiCall(`/student-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentRecordData),
    });
  },

  // Delete student record
  async deleteStudentRecord(id: string) {
    return apiCall(`/student-records/${id}`, {
      method: 'DELETE',
    });
  },

  // Get student records for a specific student
  async getStudentRecordsByStudent(studentId: string) {
    return apiCall(`/student-records/student/${studentId}`);
  },

  // Get student records for a specific class
  async getStudentRecordsByClass(classId: string) {
    return apiCall(`/student-records/class/${classId}`);
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
    return apiCall(`/change-logs${queryString ? `?${queryString}` : ''}`);
  },

  // Get change log by ID
  async getChangeLogById(id: string) {
    return apiCall(`/change-logs/${id}`);
  },

  // Create new change log
  async createChangeLog(changeLogData: any) {
    return apiCall('/change-logs', {
      method: 'POST',
      body: JSON.stringify(changeLogData),
    });
  },

  // Delete change log
  async deleteChangeLog(id: string) {
    return apiCall(`/change-logs/${id}`, {
      method: 'DELETE',
    });
  },

  // Get change logs for a specific entity
  async getEntityChangeLogs(entityType: string, entityId: string) {
    return apiCall(`/change-logs/entity/${entityType}/${entityId}`);
  },

  // Get change logs summary for dashboard
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
