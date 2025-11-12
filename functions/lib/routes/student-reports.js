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
exports.studentReportsRouter = void 0;
// functions/src/routes/student-reports.ts - Student Reports API Routes
const express_1 = require('express');
const admin = __importStar(require('firebase-admin'));
const auth_1 = require('../middleware/auth');
const notifications_1 = require('./notifications');
const router = (0, express_1.Router)();
exports.studentReportsRouter = router;
// Get all student reports
router.get('/', auth_1.verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { role } = req.user;
    // Only admin, teachers, and staff can view reports
    if (role !== 'admin' && role !== 'teacher' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const snapshot = await admin
      .firestore()
      .collection('studentReports')
      .orderBy('createdAt', 'desc')
      .get();
    const reports = snapshot.docs.map((doc) => Object.assign({ _id: doc.id }, doc.data()));
    return res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('Error fetching student reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student reports',
    });
  }
});
// Create new student report
router.post('/', auth_1.verifyToken, async (req, res) => {
  var _a;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { role } = req.user;
    // Only admin, teachers, and staff can create reports
    if (role !== 'admin' && role !== 'teacher' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { studentId, classId, className, problems, caseNo } = req.body;
    if (!studentId || !classId || !problems || !caseNo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, classId, problems, caseNo',
      });
    }
    // Get student information
    const studentDoc = await admin.firestore().collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Student not found',
      });
    }
    const studentData = studentDoc.data();
    // Get class information for level
    const classDoc = await admin.firestore().collection('classes').doc(classId).get();
    let levelName = 'Unknown';
    if (classDoc.exists) {
      const classData = classDoc.data();
      if (classData === null || classData === void 0 ? void 0 : classData.levelId) {
        const levelDoc = await admin.firestore().collection('levels').doc(classData.levelId).get();
        if (levelDoc.exists) {
          levelName =
            ((_a = levelDoc.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown';
        }
      }
    }
    // Get reporter information
    const reporterDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
    const reporterData = reporterDoc.exists ? reporterDoc.data() : {};
    // Create report data
    const reportData = {
      caseNo,
      date: admin.firestore.FieldValue.serverTimestamp(),
      reporterId: req.user.userId,
      reporterName:
        (reporterData === null || reporterData === void 0 ? void 0 : reporterData.name) ||
        'Unknown',
      reporterEnglishName:
        (reporterData === null || reporterData === void 0 ? void 0 : reporterData.englishName) ||
        '',
      studentId,
      studentName:
        (studentData === null || studentData === void 0 ? void 0 : studentData.name) || 'Unknown',
      studentEnglishName:
        (studentData === null || studentData === void 0 ? void 0 : studentData.englishName) || '',
      classId,
      className,
      levelName,
      problems,
      solution: '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection('studentReports').add(reportData);
    const newReport = Object.assign({ _id: docRef.id }, reportData);
    // Create notification for admin users about the new report
    try {
      const adminUsersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .get();
      adminUsersSnapshot.docs.forEach((adminDoc) => {
        (0, notifications_1.createNotification)(
          adminDoc.id,
          'student_report',
          'New Student Report',
          `New report submitted for ${(studentData === null || studentData === void 0 ? void 0 : studentData.name) || 'Unknown Student'} in ${className}`,
          docRef.id
        );
      });
      // Also notify teachers and staff
      const staffUsersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('role', 'in', ['teacher', 'staff'])
        .get();
      staffUsersSnapshot.docs.forEach((staffDoc) => {
        (0, notifications_1.createNotification)(
          staffDoc.id,
          'student_report',
          'New Student Report',
          `New report submitted for ${(studentData === null || studentData === void 0 ? void 0 : studentData.name) || 'Unknown Student'} in ${className}`,
          docRef.id
        );
      });
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the report creation if notifications fail
    }
    return res.status(201).json({
      success: true,
      message: 'Student report created successfully',
      report: newReport,
    });
  } catch (error) {
    console.error('Error creating student report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create student report',
    });
  }
});
// Update report status
router.patch('/:id/status', auth_1.verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { role } = req.user;
    // Only admin, teachers, and staff can update report status
    if (role !== 'admin' && role !== 'teacher' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['pending', 'observing', 'solved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, observing, solved',
      });
    }
    const reportRef = admin.firestore().collection('studentReports').doc(id);
    const reportDoc = await reportRef.get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }
    await reportRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.json({
      success: true,
      message: 'Report status updated successfully',
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report status',
    });
  }
});
// Update report solution
router.patch('/:id', auth_1.verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { role } = req.user;
    // Only admin, teachers, and staff can update report solutions
    if (role !== 'admin' && role !== 'teacher' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const { solution } = req.body;
    if (!solution || typeof solution !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Solution is required and must be a string',
      });
    }
    const reportRef = admin.firestore().collection('studentReports').doc(id);
    const reportDoc = await reportRef.get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }
    await reportRef.update({
      solution,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.json({
      success: true,
      message: 'Report solution updated successfully',
    });
  } catch (error) {
    console.error('Error updating report solution:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report solution',
    });
  }
});
// Get report by ID
router.get('/:id', auth_1.verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { role } = req.user;
    // Only admin, teachers, and staff can view reports
    if (role !== 'admin' && role !== 'teacher' && role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const reportDoc = await admin.firestore().collection('studentReports').doc(id).get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }
    const report = Object.assign({ _id: reportDoc.id }, reportDoc.data());
    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
    });
  }
});
// Delete report (admin only)
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const reportRef = admin.firestore().collection('studentReports').doc(id);
    const reportDoc = await reportRef.get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }
    await reportRef.delete();
    return res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report',
    });
  }
});
//# sourceMappingURL=student-reports.js.map
