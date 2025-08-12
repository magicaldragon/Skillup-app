// functions/src/routes/potentialStudents.ts - Potential Students API Routes
import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all potential students
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { status, assignedTo } = req.query;
    
    let query: any = admin.firestore().collection('potentialStudents');

    // Role-based filtering
    if (role === 'teacher') {
      // Teachers see potential students assigned to them
      query = query.where('assignedTo', '==', req.user!.userId);
    }
    // Admin and staff see all potential students

    // Add filters if provided
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      query = query.where('status', 'in', statusArray);
    }
    
    if (assignedTo && role !== 'teacher') {
      query = query.where('assignedTo', '==', assignedTo);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const potentialStudents = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Fetched ${potentialStudents.length} potential students for role: ${role}`);
    return res.json(potentialStudents);
  } catch (error) {
    console.error('Error fetching potential students:', error);
    return res.status(500).json({ message: 'Failed to fetch potential students' });
  }
});

// Create new potential student
router.post('/', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      name, 
      englishName, 
      email, 
      phone, 
      gender, 
      dob, 
      parentName, 
      parentPhone, 
      source = 'manual', 
      status = 'pending', 
      notes, 
      assignedTo 
    } = req.body;

    // Check if potential student with this email already exists
    if (email) {
      const existingStudent = await admin.firestore()
        .collection('potentialStudents')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingStudent.empty) {
        return res.status(400).json({ 
          success: false,
          message: 'Potential student with this email already exists' 
        });
      }
    }

    // Create potential student in Firestore
    const potentialStudentData = {
      name,
      englishName,
      email,
      phone,
      gender,
      dob,
      parentName,
      parentPhone,
      source,
      status,
      notes,
      assignedTo,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('potentialStudents').add(potentialStudentData);
    const newPotentialStudent = { id: docRef.id, ...potentialStudentData };

    return res.status(201).json({
      success: true,
      message: 'Potential student created successfully',
      potentialStudent: newPotentialStudent
    });

  } catch (error) {
    console.error('Error creating potential student:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create potential student'
    });
  }
});

// Get potential student by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    const doc = await admin.firestore().collection('potentialStudents').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Potential student not found' });
    }

    const potentialStudentData = doc.data()!;

    // Check if user has access to this potential student
    if (role === 'teacher' && potentialStudentData.assignedTo !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ id: doc.id, ...potentialStudentData });
  } catch (error) {
    console.error('Error fetching potential student:', error);
    return res.status(500).json({ message: 'Failed to fetch potential student' });
  }
});

// Update potential student
router.put('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;
    const updateData = req.body;

    const doc = await admin.firestore().collection('potentialStudents').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Potential student not found' });
    }

    const potentialStudentData = doc.data()!;

    // Check if user has access to update this potential student
    if (role === 'teacher' && potentialStudentData.assignedTo !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove fields that shouldn't be updated
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('potentialStudents').doc(id).update(updateData);

    return res.json({ success: true, message: 'Potential student updated successfully' });
  } catch (error) {
    console.error('Error updating potential student:', error);
    return res.status(500).json({ message: 'Failed to update potential student' });
  }
});

// Delete potential student
router.delete('/:id', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await admin.firestore().collection('potentialStudents').doc(id).delete();

    return res.json({ success: true, message: 'Potential student deleted successfully' });
  } catch (error) {
    console.error('Error deleting potential student:', error);
    return res.status(500).json({ message: 'Failed to delete potential student' });
  }
});

// Assign potential student to teacher
router.post('/:id/assign', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    // Validate that teacher exists and is a teacher
    const teacherDoc = await admin.firestore().collection('users').doc(teacherId).get();
    if (!teacherDoc.exists || teacherDoc.data()?.role !== 'teacher') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid teacher ID' 
      });
    }

    await admin.firestore().collection('potentialStudents').doc(id).update({
      assignedTo: teacherId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ success: true, message: 'Potential student assigned successfully' });
  } catch (error) {
    console.error('Error assigning potential student:', error);
    return res.status(500).json({ message: 'Failed to assign potential student' });
  }
});

// Convert potential student to regular student
router.post('/:id/convert', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      role = 'student', 
      status = 'active', 
      username,
      studentCode 
    } = req.body;

    const doc = await admin.firestore().collection('potentialStudents').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Potential student not found' });
    }

    const potentialStudentData = doc.data()!;

    // Check if username already exists
    if (username) {
      const existingUser = await admin.firestore()
        .collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        return res.status(400).json({ 
          success: false,
          message: 'Username already exists' 
        });
      }
    }

    // Generate student code if not provided
    let finalStudentCode = studentCode;
    if (!finalStudentCode && role === 'student') {
      finalStudentCode = await generateStudentCode();
    }

    // Create user in users collection
    const userData = {
      username,
      name: potentialStudentData.name,
      email: potentialStudentData.email,
      role,
      gender: potentialStudentData.gender,
      englishName: potentialStudentData.englishName,
      dob: potentialStudentData.dob,
      phone: potentialStudentData.phone,
      parentName: potentialStudentData.parentName,
      parentPhone: potentialStudentData.parentPhone,
      notes: potentialStudentData.notes,
      studentCode: finalStudentCode,
      status,
      firebaseUid: null, // Will be set when user registers
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await admin.firestore().collection('users').add(userData);

    // Update potential student status
    await admin.firestore().collection('potentialStudents').doc(id).update({
      status: 'converted',
      convertedToUserId: userRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ 
      success: true, 
      message: 'Potential student converted successfully',
      userId: userRef.id
    });
  } catch (error) {
    console.error('Error converting potential student:', error);
    return res.status(500).json({ message: 'Failed to convert potential student' });
  }
});

// Helper function to generate student code
async function generateStudentCode(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const snapshot = await admin.firestore()
    .collection('users')
    .where('studentCode', '>=', `STU${year}0001`)
    .where('studentCode', '<=', `STU${year}9999`)
    .orderBy('studentCode', 'desc')
    .limit(1)
    .get();

  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastCode = snapshot.docs[0].data().studentCode;
    const lastNumber = parseInt(lastCode.slice(-4));
    nextNumber = lastNumber + 1;
  }

  return `STU${year}${nextNumber.toString().padStart(4, '0')}`;
}

export { router as potentialStudentsRouter }; 