var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: () => m[k],
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (o, v) => {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : (o, v) => {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (() => {
    var ownKeys = (o) => {
      ownKeys =
        Object.getOwnPropertyNames ||
        ((o) => {
          var ar = [];
          for (var k in o) if (Object.hasOwn(o, k)) ar[ar.length] = k;
          return ar;
        });
      return ownKeys(o);
    };
    return (mod) => {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
// functions/src/routes/submissions.ts - Submissions API Routes
const express_1 = require('express');
const admin = __importStar(require('firebase-admin'));
const auth_1 = require('../middleware/auth');
const router = (0, express_1.Router)();
// Get all submissions (with role-based filtering)
router.get('/', auth_1.verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { role } = req.user;
    const { classId, studentId, assignmentId } = req.query;
    let query = admin.firestore().collection('submissions');
    // Role-based filtering
    if (role === 'admin' || role === 'teacher' || role === 'staff') {
      // Admin, teachers, and staff see all submissions
    } else if (role === 'student') {
      // Students see only their own submissions
      query = query.where('studentId', '==', req.user.userId);
    }
    // Add class filtering if provided
    if (classId && role !== 'student') {
      query = query.where('classId', '==', classId);
    }
    // Add student filtering if provided
    if (studentId && role !== 'student') {
      query = query.where('studentId', '==', studentId);
    }
    // Add assignment filtering if provided
    if (assignmentId) {
      query = query.where('assignmentId', '==', assignmentId);
    }
    const snapshot = await query.orderBy('submittedAt', 'desc').get();
    const submissions = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
    console.log(
      `Fetched ${submissions.length} submissions for role: ${role}${classId ? ` with classId: ${classId}` : ''}${studentId ? ` with studentId: ${studentId}` : ''}${assignmentId ? ` with assignmentId: ${assignmentId}` : ''}`
    );
    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});
// Create new submission
router.post('/', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { assignmentId, classId, content, fileUrl } = req.body;
    const studentId = req.user.userId;
    // Validate required fields
    if (!assignmentId || !classId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID, class ID, and content are required',
      });
    }
    // Verify assignment exists and belongs to the class
    const assignmentDoc = await admin.firestore().collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const assignmentData = assignmentDoc.data();
    if (!assignmentData) {
      return res.status(404).json({ message: 'Assignment data not found' });
    }
    if (assignmentData.classId !== classId) {
      return res.status(400).json({ message: 'Assignment does not belong to the specified class' });
    }
    // Verify student is enrolled in the class
    const classDoc = await admin.firestore().collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const classData = classDoc.data();
    if (!classData) {
      return res.status(404).json({ message: 'Class data not found' });
    }
    if (
      !((_a = classData.studentIds) === null || _a === void 0 ? void 0 : _a.includes(studentId))
    ) {
      return res.status(403).json({ message: 'Student not enrolled in this class' });
    }
    // Check if submission already exists
    const existingSubmission = await admin
      .firestore()
      .collection('submissions')
      .where('assignmentId', '==', assignmentId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();
    if (!existingSubmission.empty) {
      return res.status(400).json({
        success: false,
        message: 'Submission already exists for this assignment',
      });
    }
    // Create submission
    const submissionData = {
      assignmentId,
      studentId,
      classId,
      content,
      fileUrl: fileUrl || null,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
    };
    const docRef = await admin.firestore().collection('submissions').add(submissionData);
    console.log(
      `Created submission ${docRef.id} for assignment ${assignmentId} by student ${studentId}`
    );
    return res.json({
      success: true,
      message: 'Submission created successfully',
      id: docRef.id,
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create submission',
    });
  }
});
// Get submission by ID
router.get('/:id', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { role } = req.user;
    const doc = await admin.firestore().collection('submissions').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    const submissionData = doc.data();
    if (!submissionData) {
      return res.status(404).json({ message: 'Submission data not found' });
    }
    // Check access permissions
    if (role === 'student' && submissionData.studentId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // For teachers, check if they teach the class
    if (role === 'teacher') {
      const classDoc = await admin
        .firestore()
        .collection('classes')
        .doc(submissionData.classId)
        .get();
      if (
        !classDoc.exists ||
        ((_a = classDoc.data()) === null || _a === void 0 ? void 0 : _a.teacherId) !==
          req.user.userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json(Object.assign({ id: doc.id }, submissionData));
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
});
// Update submission
router.put('/:id', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { role } = req.user;
    const updateData = req.body;
    const doc = await admin.firestore().collection('submissions').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    const submissionData = doc.data();
    if (!submissionData) {
      return res.status(404).json({ message: 'Submission data not found' });
    }
    // Check access permissions
    if (role === 'student' && submissionData.studentId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // For teachers, check if they teach the class
    if (role === 'teacher') {
      const classDoc = await admin
        .firestore()
        .collection('classes')
        .doc(submissionData.classId)
        .get();
      if (
        !classDoc.exists ||
        ((_a = classDoc.data()) === null || _a === void 0 ? void 0 : _a.teacherId) !==
          req.user.userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Define allowed fields for updates
    const allowedFields = ['content', 'fileUrl', 'score', 'feedback', 'status'];
    const filteredData = {};
    // Filter out non-allowed fields
    Object.keys(updateData).forEach((key) => {
      if (!allowedFields.includes(key)) {
        return;
      }
      filteredData[key] = updateData[key];
    });
    // Add timestamp for grading
    if (updateData.score !== undefined || updateData.feedback !== undefined) {
      filteredData.gradedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (role !== 'admin' && role !== 'staff') {
      // Only allow content updates for non-admin users
      delete filteredData.score;
      delete filteredData.feedback;
      delete filteredData.status;
    }
    // Update submission
    await admin.firestore().collection('submissions').doc(id).update(filteredData);
    console.log(`Updated submission ${id} by ${role} ${req.user.userId}`);
    return res.json({
      success: true,
      message: 'Submission updated successfully',
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update submission',
    });
  }
});
// Delete submission
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { role } = req.user;
    const doc = await admin.firestore().collection('submissions').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    const submissionData = doc.data();
    if (!submissionData) {
      return res.status(404).json({ message: 'Submission data not found' });
    }
    // Check access permissions
    if (role === 'student' && submissionData.studentId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // For teachers, check if they teach the class
    if (role === 'teacher') {
      const classDoc = await admin
        .firestore()
        .collection('classes')
        .doc(submissionData.classId)
        .get();
      if (
        !classDoc.exists ||
        ((_a = classDoc.data()) === null || _a === void 0 ? void 0 : _a.teacherId) !==
          req.user.userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role !== 'admin' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Delete submission
    await admin.firestore().collection('submissions').doc(id).delete();
    console.log(`Deleted submission ${id} by ${role} ${req.user.userId}`);
    return res.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete submission',
    });
  }
});
// Get submissions by assignment
router.get('/assignment/:assignmentId', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { assignmentId } = req.params;
    const { role } = req.user;
    // Verify assignment exists
    const assignmentDoc = await admin.firestore().collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const assignmentData = assignmentDoc.data();
    if (!assignmentData) {
      return res.status(404).json({ message: 'Assignment data not found' });
    }
    // Check if user has access to this assignment
    const classIds = assignmentData.classIds || [];
    if (!classIds.includes(assignmentData.classId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // For teachers, check if they teach any of the classes
    if (role === 'teacher') {
      const classDoc = await admin
        .firestore()
        .collection('classes')
        .doc(assignmentData.classId)
        .get();
      if (
        !classDoc.exists ||
        ((_a = classDoc.data()) === null || _a === void 0 ? void 0 : _a.teacherId) !==
          req.user.userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Get submissions for this assignment
    let query = admin
      .firestore()
      .collection('submissions')
      .where('assignmentId', '==', assignmentId);
    // Students can only see their own submissions
    if (role === 'student') {
      query = query.where('studentId', '==', req.user.userId);
    }
    const snapshot = await query.orderBy('submittedAt', 'desc').get();
    const submissions = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
    console.log(`Fetched ${submissions.length} submissions for assignment ${assignmentId}`);
    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions by assignment:', error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});
exports.default = router;
//# sourceMappingURL=submissions.js.map
