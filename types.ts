export interface Student {
  id: string;
  _id?: string; // For Firestore compatibility
  firebaseUid?: string; // For Firebase Auth compatibility
  name: string;
  username?: string; // For authentication
  displayName?: string; // Keep for backward compatibility
  email: string;
  role: string;
  gender?: string;
  englishName?: string;
  dob?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  status?: string;
  studentCode?: string;
  avatarUrl?: string;
  diceBearStyle?: string;
  diceBearSeed?: string;
  classIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Level {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  code: string;
  description: string;
}

export interface StudentClass {
  _id?: string;
  id?: string;
  name: string;
  classCode?: string;
  levelId: string | null | { _id: string; name: string; code: string };
  studentIds: string[];
  teacherId?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentCategory =
  | 'Reading'
  | 'Listening'
  | 'Writing'
  | 'Speaking'
  | 'Full Practice Tests'
  | 'Mini Tests';

export type IELTS_Skill = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

export type QuestionType = 'mcq' | 'fill' | 'match' | 'essay';

export interface AssignmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For MCQ
  answer?: string | string[]; // For MCQ, fill, match (not used for essay)
  audioUrl?: string; // For Listening
  imageUrl?: string;
  matchPairs?: { left: string; right: string }[]; // For match type
  // For essay, only 'question' is required
}

export interface Assignment {
  id: string;
  title: string;
  level: ExamLevel;
  skill: IELTS_Skill;
  description: string;
  questions: AssignmentQuestion[];
  answerKey: Record<string, string | string[]>; // questionId -> answer
  audioUrl?: string;
  pdfUrl?: string;
  publishDate: string;
  dueDate: string;
  classIds: string[];
  createdBy: string;
  createdAt: string;
  templateId?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  submittedAt: string;
  content: string;
  score: number | null;
  feedback: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: string;
  action: string; // e.g., 'user_created', 'user_deleted', 'role_changed', etc.
  targetType: string; // e.g., 'user', 'assignment', 'class'
  targetId: string;
  details: Record<string, unknown>; // Additional info (before/after, bulk, etc.)
}

export type View =
  | 'dashboard'
  | 'management-classes'
  | 'management-waiting-list'
  | 'management-levels'
  | 'management-status'
  | 'management-scores'
  | 'assignments'
  | 'assignment-detail'
  | 'student-assignments'
  | 'profile'
  | 'user-management'
  | 'management-add'
  | 'accounts';

export type ExamLevel = 'IELTS' | 'KEY' | 'PET';

// Login and authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}

export interface UserProfile {
  _id: string;
  id?: string;
  fullname: string;
  name?: string;
  email: string;
  role: string;
  username: string;
  avatarUrl?: string;
  status?: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: string;
  note?: string;
  classIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// API service types
export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: string;
  note?: string;
  avatarUrl?: string;
}

export interface UserCreateData {
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'staff' | 'student';
  password?: string;
  phone?: string;
  englishName?: string;
  dob?: string;
  gender?: string;
  note?: string;
  classIds?: string[];
}

export interface UserUpdateData extends Partial<UserCreateData> {
  id: string;
}

export interface AvatarUpdateData {
  avatarUrl: string;
  diceBearStyle?: string;
  diceBearSeed?: string;
}

export interface ClassCreateData {
  name: string;
  classCode: string;
  levelId?: string;
  description?: string;
  teacherId?: string;
  studentIds?: string[];
  isActive?: boolean;
}

export interface ClassUpdateData extends Partial<ClassCreateData> {
  id: string;
}

export interface LevelCreateData {
  name: string;
  code: string;
  description: string;
  order?: number;
  isActive?: boolean;
}

export interface LevelUpdateData extends Partial<LevelCreateData> {
  id: string;
}

export interface AssignmentCreateData {
  title: string;
  level: ExamLevel;
  skill: IELTS_Skill;
  description: string;
  questions: AssignmentQuestion[];
  answerKey: Record<string, string | string[]>;
  audioUrl?: string;
  pdfUrl?: string;
  publishDate: string;
  dueDate: string;
  classIds: string[];
  createdBy: string;
  templateId?: string;
}

export interface AssignmentUpdateData extends Partial<AssignmentCreateData> {
  id: string;
}

export interface SubmissionCreateData {
  studentId: string;
  assignmentId: string;
  content: string;
  fileUrl?: string;
  classId: string;
}

export interface SubmissionUpdateData extends Partial<SubmissionCreateData> {
  id: string;
  score?: number;
  feedback?: string;
  status?: 'submitted' | 'graded' | 'late';
}

export interface PotentialStudentCreateData {
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  parentName?: string;
  parentPhone?: string;
  source: 'admin_registration' | 'website' | 'referral' | 'other';
  status?: 'pending' | 'contacted' | 'enrolled' | 'not_interested';
  notes?: string;
  currentSchool?: string;
  currentGrade?: string;
  englishLevel?: string;
  parentEmail?: string;
  interestedPrograms?: string[];
  assignedTo?: string;
}

export interface PotentialStudentUpdateData extends Partial<PotentialStudentCreateData> {
  id: string;
}

export interface ConversionData {
  classId: string;
  levelId?: string;
  status: 'active' | 'studying';
  notes?: string;
}

// Error handling types
export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// Student record types
export interface StudentRecordCreateData {
  studentId: string;
  classId: string;
  levelId?: string;
  attendance: number;
  participation: number;
  homework: number;
  exam: number;
  finalGrade: number;
  notes?: string;
  semester: string;
  year: number;
}

export interface StudentRecordUpdateData extends Partial<StudentRecordCreateData> {
  id: string;
}

// Change log types
export interface ChangeLogCreateData {
  action: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  userId: string;
  userName: string;
  changes?: Record<string, unknown>;
}
