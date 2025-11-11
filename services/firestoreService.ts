// firestoreService.ts - Firestore Database Service
import {
  addDoc,
  collection,
  type DocumentData,
  type DocumentReference,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  type QueryConstraint,
  query,
  serverTimestamp,
  type Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// TypeScript interfaces for Firestore documents
export interface FirestoreUser {
  id?: string;
  firebaseUid: string;
  username: string;
  name: string;
  displayName?: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'staff';
  gender?: 'male' | 'female' | 'other';
  englishName?: string;
  dob?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  status: 'active' | 'potential' | 'contacted' | 'studying' | 'postponed' | 'off' | 'alumni';
  studentCode?: string;
  avatarUrl?: string;
  diceBearStyle?: string;
  diceBearSeed?: string;
  classIds?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreClass {
  id?: string;
  name: string;
  classCode: string;
  levelId?: string;
  description?: string;
  teacherId?: string;
  studentIds?: string[];
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreLevel {
  id?: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  monthlyFee?: number; // optional per-level monthly fee stored on level docs
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreAssignment {
  id?: string;
  title: string;
  description?: string;
  classId: string;
  levelId?: string;
  dueDate?: Timestamp;
  maxScore: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreSubmission {
  id?: string;
  assignmentId: string;
  studentId: string;
  classId: string;
  content?: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  submittedAt?: Timestamp;
  gradedAt?: Timestamp;
  status: 'submitted' | 'graded' | 'late';
}

export interface FirestorePotentialStudent {
  id?: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  parentName?: string;
  parentPhone?: string;
  source: 'admin_registration' | 'website' | 'referral' | 'other';
  status: 'pending' | 'contacted' | 'enrolled' | 'not_interested';
  notes?: string;
  currentSchool?: string;
  currentGrade?: string;
  englishLevel?: string;
  parentEmail?: string;
  interestedPrograms?: string[];
  assignedTo?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreStudentRecord {
  id?: string;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreChangeLog {
  id?: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  userId: string;
  userName: string;
  changes?: Record<string, unknown>;
  timestamp?: Timestamp;
}

// Generic Firestore service class
class FirestoreService {
  private collections = {
    users: 'users',
    classes: 'classes',
    levels: 'levels',
    assignments: 'assignments',
    submissions: 'submissions',
    potentialStudents: 'potentialStudents',
    studentRecords: 'studentRecords',
    changeLogs: 'changeLogs',
  };

  // Generic CRUD operations
  async create<T extends DocumentData>(collectionName: string, data: T): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw new Error(`Failed to create ${collectionName} document`);
    }
  }

  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw new Error(`Failed to get ${collectionName} document`);
    }
  }

  async update<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw new Error(`Failed to update ${collectionName} document`);
    }
  }

  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw new Error(`Failed to delete ${collectionName} document`);
    }
  }

  async query<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
  
      return querySnapshot.docs.map(
        (doc: { id: string; data: () => DocumentData }
      ) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw new Error(`Failed to query ${collectionName}`);
    }
  }

  // User-specific operations
  async createUser(
    userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return this.create(this.collections.users, userData);
  }

  async getUserById(id: string): Promise<FirestoreUser | null> {
    return this.getById<FirestoreUser>(this.collections.users, id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<FirestoreUser | null> {
    const users = await this.query<FirestoreUser>(this.collections.users, [
      where('firebaseUid', '==', firebaseUid),
    ]);
    return users[0] || null;
  }

  async getUserByEmail(email: string): Promise<FirestoreUser | null> {
    const users = await this.query<FirestoreUser>(this.collections.users, [
      where('email', '==', email),
    ]);
    return users[0] || null;
  }

  async getUserByUsername(username: string): Promise<FirestoreUser | null> {
    const users = await this.query<FirestoreUser>(this.collections.users, [
      where('username', '==', username),
    ]);
    return users[0] || null;
  }

  async updateUser(
    userId: string,
    _userName: string,
    changes?: Partial<FirestoreUser>
  ): Promise<void> {
    return this.update(this.collections.users, userId, changes || {});
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(this.collections.users, id);
  }

  async getAllUsers(role?: string, status?: string): Promise<FirestoreUser[]> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (role) {
      constraints.unshift(where('role', '==', role));
    }

    if (status) {
      constraints.unshift(where('status', '==', status));
    }

    return this.query<FirestoreUser>(this.collections.users, constraints);
  }

  // Class-specific operations
  async createClass(
    classData: Omit<FirestoreClass, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return this.create(this.collections.classes, classData);
  }

  async getClassById(id: string): Promise<FirestoreClass | null> {
    return this.getById<FirestoreClass>(this.collections.classes, id);
  }

  async getClassByCode(classCode: string): Promise<FirestoreClass | null> {
    const classes = await this.query<FirestoreClass>(this.collections.classes, [
      where('classCode', '==', classCode),
    ]);
    return classes[0] || null;
  }

  async updateClass(id: string, classData: Partial<FirestoreClass>): Promise<void> {
    return this.update(this.collections.classes, id, classData);
  }

  async deleteClass(id: string): Promise<void> {
    return this.delete(this.collections.classes, id);
  }

  async getAllClasses(teacherId?: string, isActive?: boolean): Promise<FirestoreClass[]> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (teacherId) {
      constraints.unshift(where('teacherId', '==', teacherId));
    }

    if (isActive !== undefined) {
      constraints.unshift(where('isActive', '==', isActive));
    }

    return this.query<FirestoreClass>(this.collections.classes, constraints);
  }

  // Level-specific operations
  async createLevel(
    levelData: Omit<FirestoreLevel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return this.create(this.collections.levels, levelData);
  }

  async getLevelById(id: string): Promise<FirestoreLevel | null> {
    return this.getById<FirestoreLevel>(this.collections.levels, id);
  }

  async updateLevel(id: string, levelData: Partial<FirestoreLevel>): Promise<void> {
    return this.update(this.collections.levels, id, levelData);
  }

  async deleteLevel(id: string): Promise<void> {
    return this.delete(this.collections.levels, id);
  }

  async getAllLevels(isActive?: boolean): Promise<FirestoreLevel[]> {
    const constraints: QueryConstraint[] = [orderBy('order', 'asc')];

    if (isActive !== undefined) {
      constraints.unshift(where('isActive', '==', isActive));
    }

    return this.query<FirestoreLevel>(this.collections.levels, constraints);
  }

  // Assignment-specific operations
  async createAssignment(
    assignmentData: Omit<FirestoreAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return this.create(this.collections.assignments, assignmentData);
  }

  async getAssignmentById(id: string): Promise<FirestoreAssignment | null> {
    return this.getById<FirestoreAssignment>(this.collections.assignments, id);
  }

  async updateAssignment(id: string, assignmentData: Partial<FirestoreAssignment>): Promise<void> {
    return this.update(this.collections.assignments, id, assignmentData);
  }

  async deleteAssignment(id: string): Promise<void> {
    return this.delete(this.collections.assignments, id);
  }

  async getAssignmentsByClass(classId: string): Promise<FirestoreAssignment[]> {
    return this.query<FirestoreAssignment>(this.collections.assignments, [
      where('classId', '==', classId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
    ]);
  }

  // Submission-specific operations
  async createSubmission(submissionData: Omit<FirestoreSubmission, 'id'>): Promise<string> {
    return this.create(this.collections.submissions, submissionData);
  }

  async getSubmissionById(id: string): Promise<FirestoreSubmission | null> {
    return this.getById<FirestoreSubmission>(this.collections.submissions, id);
  }

  async updateSubmission(id: string, submissionData: Partial<FirestoreSubmission>): Promise<void> {
    return this.update(this.collections.submissions, id, submissionData);
  }

  async deleteSubmission(id: string): Promise<void> {
    return this.delete(this.collections.submissions, id);
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<FirestoreSubmission[]> {
    return this.query<FirestoreSubmission>(this.collections.submissions, [
      where('assignmentId', '==', assignmentId),
      orderBy('submittedAt', 'desc'),
    ]);
  }

  async getSubmissionsByStudent(studentId: string): Promise<FirestoreSubmission[]> {
    return this.query<FirestoreSubmission>(this.collections.submissions, [
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc'),
    ]);
  }

  // Potential Student operations
  async createPotentialStudent(
    potentialStudentData: Omit<FirestorePotentialStudent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return this.create(this.collections.potentialStudents, potentialStudentData);
  }

  async getPotentialStudentById(id: string): Promise<FirestorePotentialStudent | null> {
    return this.getById<FirestorePotentialStudent>(this.collections.potentialStudents, id);
  }

  async updatePotentialStudent(
    id: string,
    potentialStudentData: Partial<FirestorePotentialStudent>
  ): Promise<void> {
    return this.update(this.collections.potentialStudents, id, potentialStudentData);
  }

  async deletePotentialStudent(id: string): Promise<void> {
    return this.delete(this.collections.potentialStudents, id);
  }

  async getAllPotentialStudents(status?: string): Promise<FirestorePotentialStudent[]> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (status) {
      constraints.unshift(where('status', '==', status));
    }

    return this.query<FirestorePotentialStudent>(this.collections.potentialStudents, constraints);
  }

  // Student Record operations
  async createStudentRecord(
    studentRecordData: Omit<FirestoreStudentRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return this.create(this.collections.studentRecords, studentRecordData);
  }

  async getStudentRecordById(id: string): Promise<FirestoreStudentRecord | null> {
    return this.getById<FirestoreStudentRecord>(this.collections.studentRecords, id);
  }

  async updateStudentRecord(
    id: string,
    studentRecordData: Partial<FirestoreStudentRecord>
  ): Promise<void> {
    return this.update(this.collections.studentRecords, id, studentRecordData);
  }

  async deleteStudentRecord(id: string): Promise<void> {
    return this.delete(this.collections.studentRecords, id);
  }

  async getStudentRecordsByStudent(studentId: string): Promise<FirestoreStudentRecord[]> {
    return this.query<FirestoreStudentRecord>(this.collections.studentRecords, [
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc'),
    ]);
  }

  // Change Log operations
  async createChangeLog(
    changeLogData: Omit<FirestoreChangeLog, 'id' | 'timestamp'>
  ): Promise<string> {
    return this.create(this.collections.changeLogs, changeLogData);
  }

  async getChangeLogs(collection?: string, documentId?: string): Promise<FirestoreChangeLog[]> {
    const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];

    if (collection) {
      constraints.unshift(where('collection', '==', collection));
    }

    if (documentId) {
      constraints.unshift(where('documentId', '==', documentId));
    }

    return this.query<FirestoreChangeLog>(this.collections.changeLogs, constraints);
  }

  // Batch operations for better performance
  async batchCreate<T extends DocumentData>(
    collectionName: string,
    documents: T[]
  ): Promise<string[]> {
    const batch = writeBatch(db);
    const docRefs: DocumentReference[] = [];

    documents.forEach((docData) => {
      const docRef = doc(collection(db, collectionName));
      batch.set(docRef, {
        ...docData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      docRefs.push(docRef);
    });

    await batch.commit();
    return docRefs.map((ref) => ref.id);
  }

  async batchUpdate<T extends DocumentData>(
    collectionName: string,
    updates: { id: string; data: Partial<T> }[]
  ): Promise<void> {
    const batch = writeBatch(db);

    updates.forEach(({ id, data }) => {
      const docRef = doc(db, collectionName, id);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  async batchDelete(collectionName: string, ids: string[]): Promise<void> {
    const batch = writeBatch(db);

    ids.forEach((id) => {
      const docRef = doc(db, collectionName, id);
      batch.delete(docRef);
    });

    await batch.commit();
  }
}

// Create singleton instance
export const firestoreService = new FirestoreService();
