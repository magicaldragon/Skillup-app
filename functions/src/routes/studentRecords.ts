// functions/src/routes/studentRecords.ts - Student Records API Routes
import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all student records (with role-based filtering)
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { studentId, classId, levelId } = req.query;
    
    let query: any = admin.firestore().collection('studentRecords');

    // Role-based filtering
    if (role === 'student') {
      // Students see only their own records
      query = query.where('studentId', '==', req.user!.userId);
    } else if (role === 'teacher') {
      // Teachers see records for classes they teach
      const teacherClasses = await admin.firestore()
        .collection('classes')
        .where('teacherId', '==', req.user!.userId)
        .get();
      
      const classIds = teacherClasses.docs.map(doc => doc.id);
      
      if (classIds.length === 0) {
        return res.json([]);
      }
      
      query = query.where('classId', 'in', classIds);
    }
    // Admin and staff see all records

    // Add filters if provided
    if (studentId && role !== 'student') {
      query = query.where('studentId', '==', studentId);
    }
    
    if (classId && role !== 'student') {
      query = query.where('classId', '==', classId);
    }
    
    if (levelId) {
      query = query.where('levelId', '==', levelId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const studentRecords = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Fetched ${studentRecords.length} student records for role: ${role}`);
    res.json(studentRecords);
  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({ message: 'Failed to fetch student records' });
  }
});

// Create new student record
router.post('/', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      studentId, 
      classId, 
      levelId, 
      enrollmentDate, 
      completionDate, 
      status = 'enrolled', 
      grade, 
      attendance, 
      notes 
    } = req.body;

    // Validate that student exists
    const studentDoc = await admin.firestore().collection('users').doc(studentId).get();
    if (!studentDoc.exists || studentDoc.data()?.role !== 'student') {
      return res.status(400).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Validate that class exists
    const classDoc = await admin.firestore().collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(400).json({ 
        success: false,
        message: 'Class not found' 
      });
    }

    // Check if record already exists for this student and class
    const existingRecord = await admin.firestore()
      .collection('studentRecords')
      .where('studentId', '==', studentId)
      .where('classId', '==', classId)
      .limit(1)
      .get();

    if (!existingRecord.empty) {
      return res.status(400).json({ 
        success: false,
        message: 'Student record already exists for this class' 
      });
    }

    // Create student record in Firestore
    const studentRecordData = {
      studentId,
      classId,
      levelId,
      enrollmentDate: enrollmentDate ? admin.firestore.Timestamp.fromDate(new Date(enrollmentDate)) : admin.firestore.FieldValue.serverTimestamp(),
      completionDate: completionDate ? admin.firestore.Timestamp.fromDate(new Date(completionDate)) : null,
      status,
      grade,
      attendance: attendance || 0,
      notes,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('studentRecords').add(studentRecordData);
    const newStudentRecord = { id: docRef.id, ...studentRecordData };

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      studentRecord: newStudentRecord
    });

  } catch (error) {
    console.error('Error creating student record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create student record'
    });
  }
});

// Get student record by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    const doc = await admin.firestore().collection('studentRecords').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const studentRecordData = doc.data()!;

    // Check if user has access to this student record
    if (role === 'student' && studentRecordData.studentId !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(studentRecordData.classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    return res.json({ id: doc.id, ...studentRecordData });
  } catch (error) {
    console.error('Error fetching student record:', error);
    return res.status(500).json({ message: 'Failed to fetch student record' });
  }
});

// Update student record
router.put('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;
    const updateData = req.body;

    const doc = await admin.firestore().collection('studentRecords').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const studentRecordData = doc.data()!;

    // Check if user has access to update this student record
    if (role === 'student' && studentRecordData.studentId !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(studentRecordData.classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role !== 'admin' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove fields that shouldn't be updated
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Convert dates to timestamps if provided
    if (updateData.enrollmentDate) {
      updateData.enrollmentDate = admin.firestore.Timestamp.fromDate(new Date(updateData.enrollmentDate));
    }
    if (updateData.completionDate) {
      updateData.completionDate = admin.firestore.Timestamp.fromDate(new Date(updateData.completionDate));
    }

    await admin.firestore().collection('studentRecords').doc(id).update(updateData);

    return res.json({ success: true, message: 'Student record updated successfully' });
  } catch (error) {
    console.error('Error updating student record:', error);
    return res.status(500).json({ message: 'Failed to update student record' });
  }
});

// Delete student record
router.delete('/:id', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await admin.firestore().collection('studentRecords').doc(id).delete();

    res.json({ success: true, message: 'Student record deleted successfully' });
  } catch (error) {
    console.error('Error deleting student record:', error);
    res.status(500).json({ message: 'Failed to delete student record' });
  }
});

// Get student records for a specific student
router.get('/student/:studentId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { role } = req.user!;

    // Check if user has access to this student's records
    if (role === 'student' && studentId !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'teacher') {
      // Check if teacher has any classes with this student
      const studentDoc = await admin.firestore().collection('users').doc(studentId).get();
      if (!studentDoc.exists) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const studentData = studentDoc.data()!;
      const classIds = studentData?.classIds || [];
      
      if (classIds.length === 0) {
        return res.json([]);
      }

      const teacherClasses = await admin.firestore()
        .collection('classes')
        .where('teacherId', '==', req.user!.userId)
        .where(admin.firestore.FieldPath.documentId(), 'in', classIds)
        .get();

      if (teacherClasses.empty) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const snapshot = await admin.firestore()
      .collection('studentRecords')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    const studentRecords = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(studentRecords);
  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({ message: 'Failed to fetch student records' });
  }
});

// Get student records for a specific class
router.get('/class/:classId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { role } = req.user!;

    // Check if user has access to this class
    if (role === 'student') {
      const userDoc = await admin.firestore().collection('users').doc(req.user!.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];
      
      if (!classIds.includes(classId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const snapshot = await admin.firestore()
      .collection('studentRecords')
      .where('classId', '==', classId)
      .orderBy('createdAt', 'desc')
      .get();

    const studentRecords = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(studentRecords);
  } catch (error) {
    console.error('Error fetching class student records:', error);
    res.status(500).json({ message: 'Failed to fetch class student records' });
  }
});

export { router as studentRecordsRouter }; 