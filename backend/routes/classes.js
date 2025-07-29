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
      return res.status(403).json({ success: false, message: 'Access denied. Admin, teacher, or staff role required.' });
    }
    let query = { isActive: true };
    if (req.user.role === 'teacher') {
      query.teacherId = req.user.userId;
    }
    // TODO: Staff-specific filtering if needed
    const classes = await Class.find(query).populate('teacherId', 'name').populate('studentIds', 'name email');
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
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff' && req.user.userId !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const classes = await Class.find({ studentIds: studentId, isActive: true }).populate('teacherId', 'name').populate('studentIds', 'name email');
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
      return res.status(403).json({ success: false, message: 'Access denied. Admin, teacher, or staff role required.' });
    }
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({ success: false, message: 'You can only view your own classes' });
    }
    const classes = await Class.find({ teacherId, isActive: true }).populate('teacherId', 'name').populate('studentIds', 'name email');
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new class
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const { name, levelId, description, studentIds } = req.body;
    if (!name || !levelId) {
      return res.status(400).json({ success: false, message: 'Name and level ID are required' });
    }
    const newClass = await Class.create({
      name,
      levelId,
      description: description || '',
      teacherId: req.user.userId,
      studentIds: studentIds || [],
    });
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'add',
      entityType: 'class',
      entityId: newClass._id,
      details: { after: newClass },
      ip: req.ip
    });
    res.status(201).json({ success: true, message: 'Class created successfully', class: newClass });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update class
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only update classes you created' });
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
      ip: req.ip
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
      return res.status(403).json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only modify classes you created' });
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
      ip: req.ip
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
      return res.status(403).json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only modify classes you created' });
    }
    const { studentId } = req.params;
    if (!classObj.studentIds.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is not in this class' });
    }
    const before = { ...classObj.toObject() };
    classObj.studentIds = classObj.studentIds.filter(id => id.toString() !== studentId);
    await classObj.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'edit',
      entityType: 'class',
      entityId: classObj._id,
      details: { before, after: classObj },
      ip: req.ip
    });
    res.json({ success: true, message: 'Student removed from class successfully', class: classObj });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete class
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin or teacher role required.' });
    }
    const classObj = await Class.findById(req.params.id);
    if (!classObj || !classObj.isActive) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (req.user.role !== 'admin' && classObj.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only delete classes you created' });
    }
    const before = { ...classObj.toObject() };
    classObj.isActive = false;
    await classObj.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'delete',
      entityType: 'class',
      entityId: classObj._id,
      details: { before },
      ip: req.ip
    });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 