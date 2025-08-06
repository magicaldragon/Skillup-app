
export interface Student {
  id: string;
  name: string;
  displayName?: string;
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
  id:string;
  name: string; // e.g., "SU-001"
  levelId: string | null; // A class can be unassigned from a level
  studentIds: string[];
}

export type AssignmentCategory = 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Full Practice Tests' | 'Mini Tests';

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
  id:string;
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
  adminId: string;
  adminName: string;
  action: string; // e.g., 'user_created', 'user_deleted', 'role_changed', etc.
  targetType: string; // e.g., 'user', 'assignment', 'class'
  targetId: string;
  details: Record<string, any>; // Additional info (before/after, bulk, etc.)
}

export type View = 'dashboard' | 'management-classes' | 'management-waiting-list' | 'management-levels' | 'management-status' | 'management-scores' | 'assignments' | 'assignment-detail' | 'student-assignments' | 'profile' | 'user-management' | 'management-add' | 'accounts';

export type ExamLevel = 'IELTS' | 'KEY' | 'PET';