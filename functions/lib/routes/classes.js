"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.classesRouter = void 0;
// functions/src/routes/classes.ts - Classes API Routes
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.classesRouter = router;
// Get all classes (with role-based filtering)
router.get('/', auth_1.verifyToken, async (req, res) => {
    var _a, _b;
    try {
        const { role } = req.user;
        const { isActive, teacherId } = req.query;
        let query = admin.firestore().collection('classes');
        // Role-based filtering
        if (role === 'student') {
            // Students see only classes they're enrolled in
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ message: 'User ID not found' });
            }
            const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
            const userData = userDoc.data();
            const classIds = (userData === null || userData === void 0 ? void 0 : userData.classIds) || [];
            if (classIds.length === 0) {
                return res.json([]);
            }
            query = query.where(admin.firestore.FieldPath.documentId(), 'in', classIds);
        }
        else if (role === 'teacher') {
            // Teachers see classes they teach
            query = query.where('teacherId', '==', (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId);
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
        const classes = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        console.log(`Fetched ${classes.length} classes for role: ${role}`);
        return res.json(classes);
    }
    catch (error) {
        console.error('Error fetching classes:', error);
        return res.status(500).json({ message: 'Failed to fetch classes' });
    }
});
// Create new class
router.post('/', auth_1.verifyToken, auth_1.requireTeacher, async (req, res) => {
    var _a;
    try {
        const { levelId, startingDate, description = '', teacherId, studentIds = [], isActive = true, } = req.body;
        if (!levelId) {
            return res.status(400).json({
                success: false,
                message: 'Level ID is required',
            });
        }
        if (!startingDate) {
            return res.status(400).json({
                success: false,
                message: 'Starting date is required',
            });
        }
        // Validate starting date is provided
        const startDate = new Date(startingDate);
        // Note: Allow any date - no future date restriction as per user requirements
        // Get level information to generate class code
        const levelDoc = await admin.firestore().collection('levels').doc(levelId).get();
        if (!levelDoc.exists) {
            return res.status(400).json({
                success: false,
                message: 'Level not found',
            });
        }
        const levelData = levelDoc.data();
        const levelCode = (levelData === null || levelData === void 0 ? void 0 : levelData.code) || ((_a = levelData === null || levelData === void 0 ? void 0 : levelData.name) === null || _a === void 0 ? void 0 : _a.substring(0, 2).toUpperCase()) || 'SU';
        // Generate unique class code with gap filling logic (SU-001, SU-002, etc.)
        // Find all existing class codes for this level
        const existingClassesSnapshot = await admin
            .firestore()
            .collection('classes')
            .where('classCode', '>=', `${levelCode}-001`)
            .where('classCode', '<=', `${levelCode}-999`)
            .orderBy('classCode', 'asc')
            .get();
        let nextNumber = 1;
        if (!existingClassesSnapshot.empty) {
            const existingCodes = existingClassesSnapshot.docs.map(doc => doc.data().classCode).sort();
            console.log(`Existing class codes for ${levelCode}:`, existingCodes);
            // Find the first missing number in the sequence
            let expectedNumber = 1;
            for (const existingCode of existingCodes) {
                const existingNumber = parseInt(existingCode.slice(-3));
                if (existingNumber === expectedNumber) {
                    expectedNumber++;
                }
                else {
                    // Found a gap, use this number
                    nextNumber = expectedNumber;
                    console.log(`Found gap in sequence, using number: ${nextNumber}`);
                    break;
                }
            }
            // If no gaps found, use the next number after the highest existing
            if (nextNumber === 1) {
                const highestCode = existingCodes[existingCodes.length - 1];
                const highestNumber = parseInt(highestCode.slice(-3));
                nextNumber = highestNumber + 1;
                console.log(`No gaps found, incrementing from highest: ${highestNumber} -> ${nextNumber}`);
            }
        }
        else {
            console.log(`No existing classes for ${levelCode}, starting with 001`);
        }
        const classCode = `${levelCode}-${nextNumber.toString().padStart(3, '0')}`;
        console.log(`Generated class code: ${classCode}`);
        const className = `${(levelData === null || levelData === void 0 ? void 0 : levelData.name) || 'Unknown Level'} - Class ${nextNumber}`;
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
            startingDate: startDate,
            description,
            teacherId,
            studentIds,
            isActive,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await admin.firestore().collection('classes').add(classData);
        const newClass = Object.assign({ id: docRef.id, _id: docRef.id }, classData);
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
    }
    catch (error) {
        console.error('Error creating class:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create class',
        });
    }
});
// Get class by ID
router.get('/:id', auth_1.verifyToken, async (req, res) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { role } = req.user;
        // Check if user has access to this class
        if (role === 'student') {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ message: 'User ID not found' });
            }
            const userDoc = await admin.firestore().collection('users').doc(req.user.userId).get();
            const userData = userDoc.data();
            const classIds = (userData === null || userData === void 0 ? void 0 : userData.classIds) || [];
            if (!classIds.includes(id)) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }
        else if (role === 'teacher') {
            const classDoc = await admin.firestore().collection('classes').doc(id).get();
            if (!classDoc.exists || ((_b = classDoc.data()) === null || _b === void 0 ? void 0 : _b.teacherId) !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId)) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }
        const doc = await admin.firestore().collection('classes').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const classData = Object.assign({ id: doc.id, _id: doc.id }, doc.data());
        return res.json(classData);
    }
    catch (error) {
        console.error('Error fetching class:', error);
        return res.status(500).json({ message: 'Failed to fetch class' });
    }
});
// Check for gaps in class code sequence
router.get('/check-gaps/:levelId', auth_1.verifyToken, auth_1.requireTeacher, async (req, res) => {
    var _a;
    try {
        const { levelId } = req.params;
        // Get level information
        const levelDoc = await admin.firestore().collection('levels').doc(levelId).get();
        if (!levelDoc.exists) {
            return res.status(400).json({
                success: false,
                message: 'Level not found',
            });
        }
        const levelData = levelDoc.data();
        const levelCode = (levelData === null || levelData === void 0 ? void 0 : levelData.code) || ((_a = levelData === null || levelData === void 0 ? void 0 : levelData.name) === null || _a === void 0 ? void 0 : _a.substring(0, 2).toUpperCase()) || 'SU';
        // Find all existing class codes for this level (SU-001, SU-002, etc.)
        const existingClassesSnapshot = await admin
            .firestore()
            .collection('classes')
            .where('classCode', '>=', `${levelCode}-001`)
            .where('classCode', '<=', `${levelCode}-999`)
            .orderBy('classCode', 'asc')
            .get();
        const existingCodes = existingClassesSnapshot.docs.map(doc => doc.data().classCode).sort();
        const gaps = [];
        // Find gaps in the sequence
        let expectedNumber = 1;
        for (const existingCode of existingCodes) {
            const existingNumber = parseInt(existingCode.slice(-3));
            while (expectedNumber < existingNumber) {
                const gapCode = `${levelCode}-${expectedNumber.toString().padStart(3, '0')}`;
                gaps.push(gapCode);
                expectedNumber++;
            }
            expectedNumber++;
        }
        // Check if there's a gap after the last existing code
        if (existingCodes.length > 0) {
            const lastNumber = parseInt(existingCodes[existingCodes.length - 1].slice(-3));
            const nextAvailable = lastNumber + 1;
            if (nextAvailable <= 999) {
                const nextCode = `${levelCode}-${nextAvailable.toString().padStart(3, '0')}`;
                gaps.push(nextCode);
            }
        }
        return res.json({
            success: true,
            levelCode,
            existingCodes,
            gaps,
            nextAvailable: gaps.length > 0 ? gaps[0] : `${levelCode}-001`
        });
    }
    catch (error) {
        console.error('Error checking class code gaps:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check class code gaps',
        });
    }
});
// Update class
router.put('/:id', auth_1.verifyToken, auth_1.requireTeacher, async (req, res) => {
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
            const currentStudentIds = (currentData === null || currentData === void 0 ? void 0 : currentData.studentIds) || [];
            const newStudentIds = updateData.studentIds;
            // Find students to add and remove
            const studentsToAdd = newStudentIds.filter((sid) => !currentStudentIds.includes(sid));
            const studentsToRemove = currentStudentIds.filter((sid) => !newStudentIds.includes(sid));
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
    }
    catch (error) {
        console.error('Error updating class:', error);
        return res.status(500).json({ message: 'Failed to update class' });
    }
});
// Delete class
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Remove class from all students' classIds
        const classDoc = await admin.firestore().collection('classes').doc(id).get();
        const classData = classDoc.data();
        const studentIds = (classData === null || classData === void 0 ? void 0 : classData.studentIds) || [];
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
    }
    catch (error) {
        console.error('Error deleting class:', error);
        return res.status(500).json({ message: 'Failed to delete class' });
    }
});
// Add student to class
router.post('/:id/students/:studentId', auth_1.verifyToken, auth_1.requireTeacher, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error adding student to class:', error);
        return res.status(500).json({ message: 'Failed to add student to class' });
    }
});
// Remove student from class
router.delete('/:id/students/:studentId', auth_1.verifyToken, auth_1.requireTeacher, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error removing student from class:', error);
        return res.status(500).json({ message: 'Failed to remove student from class' });
    }
});
//# sourceMappingURL=classes.js.map