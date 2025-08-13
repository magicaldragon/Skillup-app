var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: () => m[k] };
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
        o.default = v;
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
      if (mod?.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.assignmentsRouter = void 0;
// functions/src/routes/assignments.ts - Assignments API Routes
const express_1 = require('express');
const admin = __importStar(require('firebase-admin'));
const auth_1 = require('../middleware/auth');
const router = (0, express_1.Router)();
exports.assignmentsRouter = router;
// Get all assignments (with role-based filtering)
router.get('/', auth_1.verifyToken, async (req, res) => {
  try {
    const { role } = req.user;
    const { classId, isActive } = req.query;
    let query = admin.firestore().collection('assignments');
    // Role-based filtering
    if (role === 'student') {
      // Students see assignments for classes they're enrolled in
      const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds =
        (userData === null || userData === void 0 ? void 0 : userData.classIds) || [];
      if (classIds.length === 0) {
        return res.json([]);
      }
      query = query.where('classId', 'in', classIds);
    } else if (role === 'teacher') {
      // Teachers see assignments for classes they teach
      const teacherClasses = await admin
        .firestore()
        .collection('classes')
        .where('teacherId', '==', req.user.userId)
        .get();
      const classIds = teacherClasses.docs.map((doc) => doc.id);
      if (classIds.length === 0) {
        return res.json([]);
      }
      query = query.where('classId', 'in', classIds);
    }
    // Admin and staff see all assignments
    // Add filters if provided
    if (classId) {
      query = query.where('classId', '==', classId);
    }
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const assignments = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
    console.log(`Fetched ${assignments.length} assignments for role: ${role}`);
    return res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});
// Create new assignment
router.post('/', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      classId,
      levelId,
      dueDate,
      maxScore = 100,
      isActive = true,
    } = req.body;
    // Validate that class exists
    const classDoc = await admin.firestore().collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Class not found',
      });
    }
    // Create assignment in Firestore
    const assignmentData = {
      title,
      description,
      classId,
      levelId,
      dueDate: dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null,
      maxScore,
      isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection('assignments').add(assignmentData);
    console.log(`Created assignment: ${docRef.id}`);
    return res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Assignment created successfully',
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
    });
  }
});
// Get assignment by ID
router.get('/:id', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    const { id } = req.params;
    const { role } = req.user;
    const doc = await admin.firestore().collection('assignments').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const assignmentData = doc.data();
    // Check if user has access to this assignment
    if (role === 'student') {
      const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds =
        (userData === null || userData === void 0 ? void 0 : userData.classIds) || [];
      if (!classIds.includes(assignmentData.classId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'teacher') {
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
    return res.json(Object.assign({ id: doc.id }, assignmentData));
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return res.status(500).json({ message: 'Failed to fetch assignment' });
  }
});
// Update assignment
router.put('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    // Remove fields that shouldn't be updated
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    // Convert dueDate to timestamp if provided
    if (updateData.dueDate) {
      updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(updateData.dueDate));
    }
    await admin.firestore().collection('assignments').doc(id).update(updateData);
    return res.json({ success: true, message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({ message: 'Failed to update assignment' });
  }
});
// Delete assignment
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if assignment has submissions
    const submissions = await admin
      .firestore()
      .collection('submissions')
      .where('assignmentId', '==', id)
      .limit(1)
      .get();
    if (!submissions.empty) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete assignment that has submissions',
      });
    }
    await admin.firestore().collection('assignments').doc(id).delete();
    return res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ message: 'Failed to delete assignment' });
  }
});
// Get assignments for a specific class
router.get('/class/:classId', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    const { classId } = req.params;
    const { role } = req.user;
    const { isActive } = req.query;
    // Check if user has access to this class
    if (role === 'student') {
      const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds =
        (userData === null || userData === void 0 ? void 0 : userData.classIds) || [];
      if (!classIds.includes(classId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'teacher') {
      const classDoc = await admin.firestore().collection('classes').doc(classId).get();
      if (
        !classDoc.exists ||
        ((_a = classDoc.data()) === null || _a === void 0 ? void 0 : _a.teacherId) !==
          req.user.userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    let query = admin.firestore().collection('assignments').where('classId', '==', classId);
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const assignments = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
    return res.json(assignments);
  } catch (error) {
    console.error('Error fetching class assignments:', error);
    return res.status(500).json({ message: 'Failed to fetch class assignments' });
  }
});
//# sourceMappingURL=assignments.js.map
