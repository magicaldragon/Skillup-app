const express = require('express');
const { verifyToken } = require('./auth');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');
const StudentRecord = require('../models/StudentRecord');
const User = require('../models/User');
const Class = require('../models/Class');

// Get all classes
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, teacher, or staff role required.',
      });
    }
    const query = { isActive: true };
    if (req.user.role === 'teacher') {
      query.teacherId = req.user.userId;
    }
    // TODO: Staff-specific filtering if needed
    const classes = await Class.find(query)
      .populate('teacherId', 'name')
      .populate('studentIds', 'name email')
      .populate('levelId', 'name code');
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get classes for a specific student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'teacher' &&
      req.user.role !== 'staff' &&
      req.user.userId !== studentId
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const classes = await Class.find({ studentIds: studentId, isActive: true })
      .populate('teacherId', 'name')
      .populate('studentIds', 'name email')
      .populate('levelId', 'name code');
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get classes for a specific teacher
router.get('/teacher/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, teacher, or staff role required.',
      });
    }
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only view your own classes' });
    }
    const classes = await Class.find({ teacherId, isActive: true })
      .populate('teacherId', 'name')
      .populate('studentIds', 'name email')
      .populate('levelId', 'name code');
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new class
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('=== CREATE CLASS DEBUG ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      console.log('Access denied - role not allowed:', req.user.role);
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }

    const { levelId, description, studentIds } = req.body;
    console.log('Extracted levelId:', levelId);

    if (!levelId) {
      console.log('Level ID is missing');
      return res.status(400).json({ success: false, message: 'Level ID is required' });
    }

    // Verify level exists
    const Level = require('../models/Level');
    const level = await Level.findById(levelId);
    console.log('Found level:', level ? { id: level._id, name: level.name } : 'null');

    if (!level || !level.isActive) {
      console.log('Invalid level ID or level not active');
      return res.status(400).json({ success: false, message: 'Invalid level ID' });
    }

    // Generate next classCode (SU-XXX). Fill gaps first.
    // Only consider active classes for code assignment
    const allCodes = await Class.find({ isActive: true }, 'classCode').lean();
    const takenNumbers = allCodes
      .map((c) => c.classCode || '')
      .map((code) => {
        const m = code.match(/SU-(\d{3})/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null)
      .sort((a, b) => a - b); // Ensure sorted order
    const taken = new Set(takenNumbers);
    let nextNumber = 1;
    while (taken.has(nextNumber)) {
      nextNumber += 1;
    }
    const classCode = `SU-${String(nextNumber).padStart(3, '0')}`;
    console.log('Generated classCode (gap-aware):', classCode);

    let newClass;
    try {
      newClass = await Class.create({
        name: classCode, // Use classCode as name
        classCode,
        levelId,
        description: description || '',
        teacherId: req.user.userId,
        studentIds: studentIds || [],
      });
    } catch (err) {
      // If duplicate key on classCode, attempt to reuse/reactivate existing inactive record
      if (err && err.code === 11000 && err.keyPattern && err.keyPattern.classCode) {
        const existing = await Class.findOne({ classCode });
        if (existing && existing.isActive === false) {
          const before = { ...existing.toObject() };
          existing.isActive = true;
          existing.levelId = levelId;
          existing.description = description || '';
          existing.teacherId = req.user.userId;
          existing.studentIds = studentIds || [];
          existing.name = classCode;
          await existing.save();
          await ChangeLog.create({
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'reactivate',
            entityType: 'class',
            entityId: existing._id,
            details: { before, after: existing },
            ip: req.ip,
          });
          return res
            .status(200)
            .json({ success: true, message: 'Class reactivated successfully', class: existing });
        }
        // Otherwise, compute a brand-new code that does not exist at all (active or inactive)
        const allCodesAny = await Class.find({}, 'classCode').lean();
        const allTaken = new Set(
          allCodesAny
            .map((c) => c.classCode || '')
            .map((code) => {
              const m = code.match(/SU-(\d{3})/);
              return m ? parseInt(m[1], 10) : null;
            })
            .filter((n) => n !== null)
        );
        let fallbackNumber = 1;
        while (allTaken.has(fallbackNumber)) fallbackNumber += 1;
        const fallbackCode = `SU-${String(fallbackNumber).padStart(3, '0')}`;
        newClass = await Class.create({
          name: fallbackCode,
          classCode: fallbackCode,
          levelId,
          description: description || '',
          teacherId: req.user.userId,
          studentIds: studentIds || [],
        });
      } else {
        throw err;
      }
    }

    console.log('Created class:', {
      id: newClass._id,
      name: newClass.name,
      levelId: newClass.levelId,
    });
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'add',
      entityType: 'class',
      entityId: newClass._id,
      details: { after: newClass },
      ip: req.ip,
    });

    console.log('Class created successfully, sending response');
    res.status(201).json({ success: true, message: 'Class created successfully', class: newClass });
    console.log('=== END CREATE CLASS DEBUG ===');
  } catch (error) {
    console.error('Create class error:', error);
    console.log('=== END CREATE CLASS DEBUG (ERROR) ===');
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update class
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only update classes you created' });
    }
    const { name, levelId, description, studentIds, isActive } = req.body;
    const before = { ...classObj.toObject() };
    if (name) classObj.name = name;
    if (levelId) classObj.levelId = levelId;
    if (description !== undefined) classObj.description = description;
    if (studentIds) classObj.studentIds = studentIds;
    if (isActive !== undefined) classObj.isActive = isActive;
    await classObj.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'edit',
      entityType: 'class',
      entityId: classObj._id,
      details: { before, after: classObj },
      ip: req.ip,
    });
    res.json({ success: true, message: 'Class updated successfully', class: classObj });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add student to class
router.post('/:id/students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only modify classes you created' });
    }
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    if (classObj.studentIds.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is already in this class' });
    }
    const before = { ...classObj.toObject() };
    classObj.studentIds.push(studentId);
    await classObj.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'edit',
      entityType: 'class',
      entityId: classObj._id,
      details: { before, after: classObj },
      ip: req.ip,
    });
    // Optionally, create a student record
    const student = await User.findById(studentId);
    if (student && classObj) {
      await StudentRecord.createClassAssignmentRecord(
        student._id,
        student.name,
        req.user.id,
        req.user.name,
        classObj._id,
        classObj.name
      );
    }
    res.json({ success: true, message: 'Student added to class successfully', class: classObj });
  } catch (error) {
    console.error('Add student to class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Remove student from class
router.delete('/:id/students/:studentId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only modify classes you created' });
    }
    const { studentId } = req.params;
    if (!classObj.studentIds.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is not in this class' });
    }
    const before = { ...classObj.toObject() };
    classObj.studentIds = classObj.studentIds.filter((id) => id.toString() !== studentId);
    await classObj.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'edit',
      entityType: 'class',
      entityId: classObj._id,
      details: { before, after: classObj },
      ip: req.ip,
    });
    res.json({
      success: true,
      message: 'Student removed from class successfully',
      class: classObj,
    });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete class
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only delete classes you created' });
    }
    const before = { ...classObj.toObject() };

    // Move all students back to waiting list and remove class reference
    if (Array.isArray(classObj.studentIds) && classObj.studentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: classObj.studentIds } },
        { $set: { status: 'potential' }, $pull: { classIds: classObj._id } }
      );
      // Record to StudentRecord if needed
      const affectedStudents = await User.find({ _id: { $in: classObj.studentIds } }, 'name');
      for (const st of affectedStudents) {
        await StudentRecord.createClassRemovalRecord(
          st._id,
          st.name,
          req.user.id,
          req.user.name,
          classObj._id,
          classObj.name
        );
      }
    }

    // Permanently remove the class document to free up its code for reuse
    await Class.deleteOne({ _id: classObj._id });
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'delete',
      entityType: 'class',
      entityId: classObj._id,
      details: { before, hardDelete: true },
      ip: req.ip,
    });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
