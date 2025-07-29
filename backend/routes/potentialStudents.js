const express = require('express');
const router = express.Router();
const PotentialStudent = require('../models/PotentialStudent');
const User = require('../models/User');
const StudentRecord = require('../models/StudentRecord');
const { verifyToken } = require('./auth');

// Get all potential students
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, assignedTo, source, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (source) filter.source = source;
    
    // Add pagination to reduce data transfer
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const potentialStudents = await PotentialStudent.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance
    
    const total = await PotentialStudent.countDocuments(filter);
    
    res.json({
      success: true,
      potentialStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching potential students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch potential students'
    });
  }
});

// Get potential student by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const potentialStudent = await PotentialStudent.findById(req.params.id)
      .populate('assignedTo', 'name email');
    
    if (!potentialStudent) {
      return res.status(404).json({
        success: false,
        message: 'Potential student not found'
      });
    }
    
    res.json({
      success: true,
      potentialStudent
    });
  } catch (error) {
    console.error('Error fetching potential student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch potential student'
    });
  }
});

// Create new potential student
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      name, englishName, email, phone, gender, dob,
      parentName, parentPhone, parentEmail,
      currentSchool, currentGrade, englishLevel,
      source, referralBy, interestedPrograms, notes
    } = req.body;
    
    // Check if email already exists
    const existingStudent = await PotentialStudent.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A potential student with this email already exists'
      });
    }
    
    const potentialStudent = new PotentialStudent({
      name,
      englishName,
      email,
      phone,
      gender,
      dob,
      parentName,
      parentPhone,
      parentEmail,
      currentSchool,
      currentGrade,
      englishLevel,
      source,
      referralBy,
      interestedPrograms,
      notes,
      assignedTo: req.user.id
    });
    
    await potentialStudent.save();
    
    res.status(201).json({
      success: true,
      message: 'Potential student created successfully',
      potentialStudent
    });
  } catch (error) {
    console.error('Error creating potential student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create potential student'
    });
  }
});

// Update potential student
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const potentialStudent = await PotentialStudent.findById(req.params.id);
    
    if (!potentialStudent) {
      return res.status(404).json({
        success: false,
        message: 'Potential student not found'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (potentialStudent.schema.paths[key]) {
        potentialStudent[key] = req.body[key];
      }
    });
    
    potentialStudent.updatedAt = new Date();
    await potentialStudent.save();
    
    res.json({
      success: true,
      message: 'Potential student updated successfully',
      potentialStudent
    });
  } catch (error) {
    console.error('Error updating potential student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update potential student'
    });
  }
});

// Update potential student status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const potentialStudent = await PotentialStudent.findById(req.params.id);
    
    if (!potentialStudent) {
      return res.status(404).json({
        success: false,
        message: 'Potential student not found'
      });
    }
    
    const oldStatus = potentialStudent.status;
    potentialStudent.status = status;
    
    // Update relevant timestamps
    if (status === 'contacted' && !potentialStudent.contactedAt) {
      potentialStudent.contactedAt = new Date();
    } else if (status === 'interviewed' && !potentialStudent.interviewedAt) {
      potentialStudent.interviewedAt = new Date();
    } else if (status === 'enrolled') {
      potentialStudent.enrolledAt = new Date();
    }
    
    await potentialStudent.save();
    
    res.json({
      success: true,
      message: `Status updated from ${oldStatus} to ${status}`,
      potentialStudent
    });
  } catch (error) {
    console.error('Error updating potential student status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// Convert potential student to regular user
router.post('/:id/convert', verifyToken, async (req, res) => {
  try {
    const potentialStudent = await PotentialStudent.findById(req.params.id);
    
    if (!potentialStudent) {
      return res.status(404).json({
        success: false,
        message: 'Potential student not found'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: potentialStudent.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    
    // Create new user
    const userData = potentialStudent.convertToUser();
    const newUser = new User(userData);
    await newUser.save();
    
    // Update potential student status
    potentialStudent.status = 'enrolled';
    potentialStudent.enrolledAt = new Date();
    await potentialStudent.save();
    
    // Create enrollment record
    await StudentRecord.createEnrollmentRecord(
      newUser._id,
      newUser.name,
      req.user.id,
      req.user.name,
      {
        program: 'General Program',
        source: 'potential_student_conversion',
        originalPotentialStudentId: potentialStudent._id
      }
    );
    
    res.json({
      success: true,
      message: 'Potential student converted to regular user successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error converting potential student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert potential student'
    });
  }
});

// Delete potential student
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const potentialStudent = await PotentialStudent.findById(req.params.id);
    
    if (!potentialStudent) {
      return res.status(404).json({
        success: false,
        message: 'Potential student not found'
      });
    }
    
    await PotentialStudent.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Potential student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting potential student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete potential student'
    });
  }
});

// Get potential student statistics
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const stats = await PotentialStudent.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await PotentialStudent.countDocuments();
    const thisMonth = await PotentialStudent.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    res.json({
      success: true,
      stats: {
        total,
        thisMonth,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Error fetching potential student stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;