const express = require('express');
const { verifyToken } = require('./auth');
const router = express.Router();

// Mock data for now - in production this would come from a database
let assignments = [
  {
    id: '1',
    title: 'IELTS Reading Practice - Academic',
    description: 'Practice reading comprehension with academic texts',
    skill: 'reading',
    level: 'IELTS',
    dueDate: '2024-12-31',
    classIds: ['class1', 'class2'],
    createdAt: new Date().toISOString(),
    createdBy: 'teacher1'
  },
  {
    id: '2',
    title: 'IELTS Writing Task 2 - Opinion Essay',
    description: 'Write an opinion essay on environmental issues',
    skill: 'writing',
    level: 'IELTS',
    dueDate: '2024-12-25',
    classIds: ['class1'],
    createdAt: new Date().toISOString(),
    createdBy: 'teacher1'
  }
];

// Get all assignments (admin/teacher can see all, staff can see assignments for their classes)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    let filteredAssignments = assignments;

    // Staff can only see assignments for their classes
    if (req.user.role === 'staff') {
      // TODO: Filter by staff's assigned classes
      // For now, return all assignments
    }

    res.json({
      success: true,
      assignments: filteredAssignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get assignments for a specific student
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

    // TODO: Get student's class assignments from database
    // For now, return all assignments
    const studentAssignments = assignments;

    res.json({
      success: true,
      assignments: studentAssignments
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Create new assignment (admin/teacher only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const { title, description, skill, level, dueDate, classIds } = req.body;

    // Validate required fields
    if (!title || !skill || !level || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, skill, level, and due date are required'
      });
    }

    const newAssignment = {
      id: Date.now().toString(),
      title,
      description: description || '',
      skill,
      level,
      dueDate,
      classIds: classIds || [],
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };

    assignments.push(newAssignment);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update assignment (admin/teacher only, and only if they created it)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const assignmentIndex = assignments.findIndex(a => a.id === req.params.id);
    if (assignmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignment = assignments[assignmentIndex];

    // Only admin can update assignments created by others
    if (req.user.role !== 'admin' && assignment.createdBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update assignments you created'
      });
    }

    const { title, description, skill, level, dueDate, classIds } = req.body;

    // Update assignment
    assignments[assignmentIndex] = {
      ...assignment,
      title: title || assignment.title,
      description: description !== undefined ? description : assignment.description,
      skill: skill || assignment.skill,
      level: level || assignment.level,
      dueDate: dueDate || assignment.dueDate,
      classIds: classIds || assignment.classIds
    };

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: assignments[assignmentIndex]
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete assignment (admin/teacher only, and only if they created it)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or teacher role required.' 
      });
    }

    const assignmentIndex = assignments.findIndex(a => a.id === req.params.id);
    if (assignmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignment = assignments[assignmentIndex];

    // Only admin can delete assignments created by others
    if (req.user.role !== 'admin' && assignment.createdBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete assignments you created'
      });
    }

    assignments.splice(assignmentIndex, 1);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router; 