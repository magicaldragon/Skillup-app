// functions/src/routes/classes.ts - Classes API Routes
import { type Response, Router } from 'express';
import * as admin from 'firebase-admin';
import { type AuthenticatedRequest, requireAdmin, verifyToken } from '../middleware/auth';

const router = Router();

// Get all classes (with role-based filtering)
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { isActive, teacherId } = req.query;

    let query: any = admin.firestore().collection('classes');

    // Role-based filtering
    if (role === 'student') {
      // Students see only classes they're enrolled in
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'User ID not found' });
      }
      const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];

      if (classIds.length === 0) {
        return res.json([]);
      }

      query = query.where(admin.firestore.FieldPath.documentId(), 'in', classIds);
    } else if (role === 'teacher') {
      // Teachers see classes they teach
      query = query.where('teacherId', '==', req.user?.userId);
    }
    // Admin and staff see all classes

    // Add filters if provided
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    if (teacherId && role !== 'student') {
      query = query.where('teacherId', '==', teacherId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const classes = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${classes.length} classes for role: ${role}`);
    return res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Create new class
router.post('/', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      levelId,
      description = '',
      teacherId,
      studentIds = [],
      isActive = true,
    } = req.body;

    if (!levelId) {
      return res.status(400).json({
        success: false,
        message: 'Level ID is required',
      });
    }

    // Get level information to generate class code
    const levelDoc = await admin.firestore().collection('levels').doc(levelId).get();
    if (!levelDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Level not found',
      });
    }

    const levelData = levelDoc.data();
    const levelCode = levelData?.code || levelData?.name?.substring(0, 2).toUpperCase() || 'SU';

    // Generate unique class code
    const year = new Date().getFullYear().toString().slice(-2);
    const classCodeSnapshot = await admin
      .firestore()
      .collection('classes')
      .where('classCode', '>=', `${levelCode}-${year}001`)
      .where('classCode', '<=', `${levelCode}-${year}999`)
      .orderBy('classCode', 'desc')
      .limit(1)
      .get();

    let nextNumber = 1;
    if (!classCodeSnapshot.empty) {
      const lastCode = classCodeSnapshot.docs[0].data().classCode;
      const lastNumber = parseInt(lastCode.slice(-3));
      nextNumber = lastNumber + 1;
    }

    const classCode = `${levelCode}-${year}${nextNumber.toString().padStart(3, '0')}`;
    const className = `${levelData?.name || 'Unknown Level'} - Class ${nextNumber}`;

    // Check if class code already exists (shouldn't happen with our generation, but safety check)
    const existingClass = await admin
      .firestore()
      .collection('classes')
      .where('classCode', '==', classCode)
      .limit(1)
      .get();

    if (!existingClass.empty) {
      return res.status(400).json({
        success: false,
        message: 'Class with this code already exists',
      });
    }

    // Create class in Firestore
    const classData = {
      name: className,
      classCode,
      levelId,
      description,
      teacherId,
      studentIds,
      isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection('classes').add(classData);
    const newClass = { 
      id: docRef.id, 
      _id: docRef.id, // Add _id for frontend compatibility
      ...classData 
    };

    // Update students' classIds if provided
    if (studentIds.length > 0) {
      const batch = admin.firestore().batch();

      for (const studentId of studentIds) {
        const studentRef = admin.firestore().collection('users').doc(studentId);
        batch.update(studentRef, {
          classIds: admin.firestore.FieldValue.arrayUnion(docRef.id),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    }

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: newClass,
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create class',
    });
  }
});

// Get class by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    // Check if user has access to this class
    if (role === 'student') {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'User ID not found' });
      }
      const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];

      if (!classIds.includes(id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(id).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user?.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const doc = await admin.firestore().collection('classes').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching class:', error);
    return res.status(500).json({ message: 'Failed to fetch class' });
  }
});

// Update class
router.put('/:id', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Handle student enrollment changes
    if (updateData.studentIds !== undefined) {
      const currentClass = await admin.firestore().collection('classes').doc(id).get();
      const currentData = currentClass.data();
      const currentStudentIds = currentData?.studentIds || [];
      const newStudentIds = updateData.studentIds;

      // Find students to add and remove
      const studentsToAdd = newStudentIds.filter((sid: string) => !currentStudentIds.includes(sid));
      const studentsToRemove = currentStudentIds.filter(
        (sid: string) => !newStudentIds.includes(sid)
      );

      const batch = admin.firestore().batch();

      // Add students to class
      for (const studentId of studentsToAdd) {
        const studentRef = admin.firestore().collection('users').doc(studentId);
        batch.update(studentRef, {
          classIds: admin.firestore.FieldValue.arrayUnion(id),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Remove students from class
      for (const studentId of studentsToRemove) {
        const studentRef = admin.firestore().collection('users').doc(studentId);
        batch.update(studentRef, {
          classIds: admin.firestore.FieldValue.arrayRemove(id),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    }

    await admin.firestore().collection('classes').doc(id).update(updateData);

    return res.json({ success: true, message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({ message: 'Failed to update class' });
  }
});

// Delete class
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Remove class from all students' classIds
      const classDoc = await admin.firestore().collection('classes').doc(id).get();
      const classData = classDoc.data();
      const studentIds = classData?.studentIds || [];

      if (studentIds.length > 0) {
        const batch = admin.firestore().batch();

        for (const studentId of studentIds) {
          const studentRef = admin.firestore().collection('users').doc(studentId);
          batch.update(studentRef, {
            classIds: admin.firestore.FieldValue.arrayRemove(id),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
      }

      await admin.firestore().collection('classes').doc(id).delete();

      return res.json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
      console.error('Error deleting class:', error);
      return res.status(500).json({ message: 'Failed to delete class' });
    }
  }
);

// Add student to class
router.post(
  '/:id/students/:studentId',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: classId, studentId } = req.params;

      // Add student to class
      await admin
        .firestore()
        .collection('classes')
        .doc(classId)
        .update({
          studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Add class to student's classIds
      await admin
        .firestore()
        .collection('users')
        .doc(studentId)
        .update({
          classIds: admin.firestore.FieldValue.arrayUnion(classId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return res.json({ success: true, message: 'Student added to class successfully' });
    } catch (error) {
      console.error('Error adding student to class:', error);
      return res.status(500).json({ message: 'Failed to add student to class' });
    }
  }
);

// Remove student from class
router.delete(
  '/:id/students/:studentId',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: classId, studentId } = req.params;

      // Remove student from class
      await admin
        .firestore()
        .collection('classes')
        .doc(classId)
        .update({
          studentIds: admin.firestore.FieldValue.arrayRemove(studentId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Remove class from student's classIds
      await admin
        .firestore()
        .collection('users')
        .doc(studentId)
        .update({
          classIds: admin.firestore.FieldValue.arrayRemove(classId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return res.json({ success: true, message: 'Student removed from class successfully' });
    } catch (error) {
      console.error('Error removing student from class:', error);
      return res.status(500).json({ message: 'Failed to remove student from class' });
    }
  }
);

export { router as classesRouter };
