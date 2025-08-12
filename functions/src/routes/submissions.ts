// functions/src/routes/submissions.ts - Submissions API Routes
import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, verifyToken } from '../middleware/auth';

const router = Router();

// Get all submissions (with role-based filtering)
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { assignmentId, classId, studentId, status } = req.query;
    
    let query: any = admin.firestore().collection('submissions');

    // Role-based filtering
    if (role === 'student') {
      // Students see only their own submissions
      query = query.where('studentId', '==', req.user!.userId);
    } else if (role === 'teacher') {
      // Teachers see submissions for classes they teach
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
    // Admin and staff see all submissions

    // Add filters if provided
    if (assignmentId) {
      query = query.where('assignmentId', '==', assignmentId);
    }
    
    if (classId && role !== 'student') {
      query = query.where('classId', '==', classId);
    }
    
    if (studentId && role !== 'student') {
      query = query.where('studentId', '==', studentId);
    }
    
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      query = query.where('status', 'in', statusArray);
    }

    const snapshot = await query.orderBy('submittedAt', 'desc').get();
    const submissions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Fetched ${submissions.length} submissions for role: ${role}`);
    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// Create new submission
router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      assignmentId, 
      classId, 
      content, 
      fileUrl 
    } = req.body;

    const studentId = req.user!.userId;

    // Validate that assignment exists
    const assignmentDoc = await admin.firestore().collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(400).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    const assignmentData = assignmentDoc.data()!;

    // Check if student is enrolled in the class
    if (assignmentData.classId !== classId) {
      return res.status(400).json({ 
        success: false,
        message: 'Assignment does not belong to the specified class' 
      });
    }

    const userDoc = await admin.firestore().collection('users').doc(studentId).get();
    const userData = userDoc.data();
    const classIds = userData?.classIds || [];
    
    if (!classIds.includes(classId)) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not enrolled in this class' 
      });
    }

    // Check if submission already exists
    const existingSubmission = await admin.firestore()
      .collection('submissions')
      .where('assignmentId', '==', assignmentId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existingSubmission.empty) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already submitted this assignment' 
      });
    }

    // Determine if submission is late
    const now = admin.firestore.Timestamp.now();
    const isLate = assignmentData.dueDate && now.toDate() > assignmentData.dueDate.toDate();
    const status = isLate ? 'late' : 'submitted';

    // Create submission in Firestore
    const submissionData = {
      assignmentId,
      studentId,
      classId,
      content,
      fileUrl,
      status,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('submissions').add(submissionData);
    const newSubmission = { id: docRef.id, ...submissionData };

    return res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      submission: newSubmission
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create submission'
    });
  }
});

// Get submission by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    const doc = await admin.firestore().collection('submissions').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submissionData = doc.data()!;

    // Check if user has access to this submission
    if (role === 'student' && submissionData.studentId !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(submissionData.classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    return res.json({ id: doc.id, ...submissionData });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

// Update submission (for grading)
router.put('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;
    const updateData = req.body;

    const doc = await admin.firestore().collection('submissions').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submissionData = doc.data()!;

    // Check if user has access to update this submission
    if (role === 'student') {
      // Students can only update their own submissions before grading
      if (submissionData.studentId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (submissionData.status === 'graded') {
        return res.status(400).json({ message: 'Cannot update graded submission' });
      }
      
      // Students can only update content and fileUrl
      const allowedFields = ['content', 'fileUrl'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    } else if (role === 'teacher') {
      // Teachers can grade submissions for their classes
      const classDoc = await admin.firestore().collection('classes').doc(submissionData.classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Teachers can update score, feedback, and status
      const allowedFields = ['score', 'feedback', 'status'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
      
      // If grading, set gradedAt timestamp
      if (updateData.score !== undefined || updateData.feedback !== undefined) {
        updateData.status = 'graded';
        updateData.gradedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    } else if (role !== 'admin' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('submissions').doc(id).update(updateData);

    return res.json({ success: true, message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    return res.status(500).json({ message: 'Failed to update submission' });
  }
});

// Delete submission
router.delete('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    const doc = await admin.firestore().collection('submissions').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submissionData = doc.data()!;

    // Check if user has access to delete this submission
    if (role === 'student') {
      if (submissionData.studentId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (submissionData.status === 'graded') {
        return res.status(400).json({ message: 'Cannot delete graded submission' });
      }
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(submissionData.classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role !== 'admin' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await admin.firestore().collection('submissions').doc(id).delete();

    return res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({ message: 'Failed to delete submission' });
  }
});

// Get submissions for a specific assignment
router.get('/assignment/:assignmentId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { role } = req.user!;

    // Check if user has access to this assignment
    const assignmentDoc = await admin.firestore().collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const assignmentData = assignmentDoc.data()!;

    if (role === 'student') {
      const userDoc = await admin.firestore().collection('users').doc(req.user!.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];
      
      if (!classIds.includes(assignmentData.classId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(assignmentData.classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const snapshot = await admin.firestore()
      .collection('submissions')
      .where('assignmentId', '==', assignmentId)
      .orderBy('submittedAt', 'desc')
      .get();

    const submissions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return res.status(500).json({ message: 'Failed to fetch assignment submissions' });
  }
});

export { router as submissionsRouter }; 