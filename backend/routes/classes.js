const express = require('express');
const { verifyToken } = require('./auth');
const router = express.Router();

// Mock data for now - in production this would come from a database
let classes = [
  {
    id: 'class1',
    name: 'IELTS Advanced - Reading & Writing',
    levelId: 'ielts_advanced',
    description: 'Advanced IELTS preparation focusing on reading and writing skills',
    teacherId: 'teacher1',
    studentIds: ['student1', 'student2'],
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'class2',
    name: 'IELTS Intermediate - Speaking & Listening',
    levelId: 'ielts_intermediate',
    description: 'Intermediate IELTS preparation focusing on speaking and listening skills',
    teacherId: 'teacher1',
    studentIds: ['student3'],
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

// Get all classes (admin can see all, teacher can see their classes, staff can see assigned classes)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    let filteredClasses = classes;

    // Teacher can only see their own classes
    if (req.user.role === 'teacher') {
      filteredClasses = classes.filter(c => c.teacherId === req.user.userId);
    }

    // Staff can only see their assigned classes
    if (req.user.role === 'staff') {
      // TODO: Filter by staff's assigned classes
      // For now, return all classes
    }

    res.json({
      success: true,
      classes: filteredClasses
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get classes for a specific student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if user is admin, teacher, staff, or the student themselves
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff' && req.user.userId !== studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    const studentClasses = classes.filter(c => c.studentIds.includes(studentId) && c.isActive);

    res.json({
      success: true,
      classes: studentClasses
    });
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get classes for a specific teacher
router.get('/teacher/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    // Teachers can only see their own classes
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own classes'
      });
    }

    const teacherClasses = classes.filter(c => c.teacherId === teacherId);

    res.json({
      success: true,
      classes: teacherClasses
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Create new class (admin/teacher only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const { name, levelId, description, studentIds } = req.body;

    // Validate required fields
    if (!name || !levelId) {
      return res.status(400).json({
        success: false,
        message: 'Name and level ID are required'
      });
    }

    const newClass = {
      id: `class${Date.now()}`,
      name,
      levelId,
      description: description || '',
      teacherId: req.user.userId,
      studentIds: studentIds || [],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    classes.push(newClass);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update class (admin/teacher can update their own classes)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const classIndex = classes.findIndex(c => c.id === req.params.id);
    if (classIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classToUpdate = classes[classIndex];

    // Only admin can update classes created by others
    if (req.user.role !== 'admin' && classToUpdate.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update classes you created'
      });
    }

    const { name, levelId, description, studentIds, isActive } = req.body;

    // Update class
    classes[classIndex] = {
      ...classToUpdate,
      name: name || classToUpdate.name,
      levelId: levelId || classToUpdate.levelId,
      description: description !== undefined ? description : classToUpdate.description,
      studentIds: studentIds || classToUpdate.studentIds,
      isActive: isActive !== undefined ? isActive : classToUpdate.isActive
    };

    res.json({
      success: true,
      message: 'Class updated successfully',
      class: classes[classIndex]
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Add student to class (admin/teacher only)
router.post('/:id/students', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const classIndex = classes.findIndex(c => c.id === req.params.id);
    if (classIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classToUpdate = classes[classIndex];

    // Only admin can modify classes created by others
    if (req.user.role !== 'admin' && classToUpdate.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify classes you created'
      });
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Check if student is already in the class
    if (classToUpdate.studentIds.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already in this class'
      });
    }

    classes[classIndex] = {
      ...classToUpdate,
      studentIds: [...classToUpdate.studentIds, studentId]
    };

    res.json({
      success: true,
      message: 'Student added to class successfully',
      class: classes[classIndex]
    });
  } catch (error) {
    console.error('Add student to class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Remove student from class (admin/teacher only)
router.delete('/:id/students/:studentId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const classIndex = classes.findIndex(c => c.id === req.params.id);
    if (classIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classToUpdate = classes[classIndex];

    // Only admin can modify classes created by others
    if (req.user.role !== 'admin' && classToUpdate.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify classes you created'
      });
    }

    const { studentId } = req.params;

    // Check if student is in the class
    if (!classToUpdate.studentIds.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is not in this class'
      });
    }

    classes[classIndex] = {
      ...classToUpdate,
      studentIds: classToUpdate.studentIds.filter(id => id !== studentId)
    };

    res.json({
      success: true,
      message: 'Student removed from class successfully',
      class: classes[classIndex]
    });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete class (admin/teacher can delete their own classes)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const classIndex = classes.findIndex(c => c.id === req.params.id);
    if (classIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classToDelete = classes[classIndex];

    // Only admin can delete classes created by others
    if (req.user.role !== 'admin' && classToDelete.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete classes you created'
      });
    }

    classes.splice(classIndex, 1);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router; 