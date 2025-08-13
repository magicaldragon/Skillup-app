const express = require('express');
const { verifyToken } = require('./auth');
const router = express.Router();
const _ChangeLog = require('../models/ChangeLog');

// Mock data for now - in production this would come from a database
const submissions = [
  {
    id: '1',
    assignmentId: '1',
    studentId: 'student1',
    content: 'This is my reading comprehension response...',
    submittedAt: new Date().toISOString(),
    score: 85,
    feedback: 'Excellent comprehension of the main ideas. Good use of context clues.',
    gradedBy: 'teacher1',
    gradedAt: new Date().toISOString(),
  },
  {
    id: '2',
    assignmentId: '2',
    studentId: 'student1',
    content: 'This is my opinion essay on environmental issues...',
    submittedAt: new Date().toISOString(),
    score: null,
    feedback: null,
    gradedBy: null,
    gradedAt: null,
  },
];

// Get all submissions (admin/teacher can see all, staff can see submissions for their classes)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, teacher, or staff role required.',
      });
    }

    const filteredSubmissions = submissions;

    // Staff can only see submissions for their classes
    if (req.user.role === 'staff') {
      // TODO: Filter by staff's assigned classes
      // For now, return all submissions
    }

    res.json({
      success: true,
      submissions: filteredSubmissions,
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get submissions for a specific assignment
router.get('/assignment/:assignmentId', verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, teacher, or staff role required.',
      });
    }

    const assignmentSubmissions = submissions.filter((s) => s.assignmentId === assignmentId);

    res.json({
      success: true,
      submissions: assignmentSubmissions,
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get submissions for a specific student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if user is admin, teacher, staff, or the student themselves
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'teacher' &&
      req.user.role !== 'staff' &&
      req.user.userId !== studentId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const studentSubmissions = submissions.filter((s) => s.studentId === studentId);

    res.json({
      success: true,
      submissions: studentSubmissions,
    });
  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create new submission (students only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.',
      });
    }

    const { assignmentId, content } = req.body;

    // Validate required fields
    if (!assignmentId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and content are required',
      });
    }

    // Check if student already submitted for this assignment
    const existingSubmission = submissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === req.user.userId
    );
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted for this assignment',
      });
    }

    const newSubmission = {
      id: Date.now().toString(),
      assignmentId,
      studentId: req.user.userId,
      content,
      submittedAt: new Date().toISOString(),
      score: null,
      feedback: null,
      gradedBy: null,
      gradedAt: null,
    };

    submissions.push(newSubmission);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      submission: newSubmission,
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update submission (students can update their own ungraded submissions)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const submissionIndex = submissions.findIndex((s) => s.id === req.params.id);
    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    const submission = submissions[submissionIndex];

    // Students can only update their own ungraded submissions
    if (req.user.role === 'student') {
      if (submission.studentId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own submissions',
        });
      }

      if (submission.score !== null) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a graded submission',
        });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required',
        });
      }

      submissions[submissionIndex] = {
        ...submission,
        content,
        submittedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        message: 'Submission updated successfully',
        submission: submissions[submissionIndex],
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Grade submission (admin/teacher only)
router.put('/:id/grade', verifyToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or teacher role required.',
      });
    }

    const submissionIndex = submissions.findIndex((s) => s.id === req.params.id);
    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    const { score, feedback } = req.body;

    // Validate required fields
    if (score === undefined || score === null) {
      return res.status(400).json({
        success: false,
        message: 'Score is required',
      });
    }

    // Validate score range (0-100)
    if (score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 0 and 100',
      });
    }

    submissions[submissionIndex] = {
      ...submissions[submissionIndex],
      score,
      feedback: feedback || '',
      gradedBy: req.user.userId,
      gradedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission: submissions[submissionIndex],
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete submission (admin/teacher can delete any, students can delete their own ungraded)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const submissionIndex = submissions.findIndex((s) => s.id === req.params.id);
    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    const submission = submissions[submissionIndex];

    // Students can only delete their own ungraded submissions
    if (req.user.role === 'student') {
      if (submission.studentId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own submissions',
        });
      }

      if (submission.score !== null) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a graded submission',
        });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    submissions.splice(submissionIndex, 1);

    res.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
