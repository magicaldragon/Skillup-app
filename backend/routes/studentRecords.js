const express = require('express');
const router = express.Router();
const StudentRecord = require('../models/StudentRecord');
const User = require('../models/User');
const { verifyToken } = require('./auth');

// Get all student records with filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      studentId, action, category, performedBy,
      startDate, endDate, page = 1, limit = 50
    } = req.query;
    
    const filter = {};
    
    if (studentId) filter.studentId = studentId;
    if (action) filter.action = action;
    if (category) filter.category = category;
    if (performedBy) filter.performedBy = performedBy;
    
    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await StudentRecord.find(filter)
      .populate('studentId', 'name email')
      .populate('performedBy', 'name email')
      .populate('relatedClass', 'name')
      .populate('relatedAssignment', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await StudentRecord.countDocuments(filter);
    
    res.json({
      success: true,
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student records'
    });
  }
});

// Get student records by student ID
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { action, category, page = 1, limit = 20 } = req.query;
    
    const filter = { studentId };
    
    if (action) filter.action = action;
    if (category) filter.category = category;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await StudentRecord.find(filter)
      .populate('performedBy', 'name email')
      .populate('relatedClass', 'name')
      .populate('relatedAssignment', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await StudentRecord.countDocuments(filter);
    
    res.json({
      success: true,
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student records'
    });
  }
});

// Get reports (student problems)
router.get('/reports', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const filter = { action: 'report' };
    
    if (status) {
      filter['details.status'] = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await StudentRecord.find(filter)
      .populate('studentId', 'name email englishName')
      .populate('performedBy', 'name email')
      .populate('relatedClass', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await StudentRecord.countDocuments(filter);
    
    res.json({
      success: true,
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Get student record by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const record = await StudentRecord.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('performedBy', 'name email')
      .populate('relatedClass', 'name')
      .populate('relatedAssignment', 'title');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found'
      });
    }
    
    res.json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Error fetching student record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student record'
    });
  }
});

// Create new student record
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      studentId, studentName, action, category, details,
      relatedClass, relatedAssignment
    } = req.body;
    
    // Validate student exists (if studentId is provided)
    if (studentId) {
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
    }
    
    // For reports, ensure we have the required details
    if (action === 'report') {
      if (!details || !details.problem) {
        return res.status(400).json({
          success: false,
          message: 'Problem description is required for reports'
        });
      }
      
      // Set default status if not provided
      if (!details.status) {
        details.status = '!!!';
      }
    }
    
    const record = new StudentRecord({
      studentId,
      studentName: studentName || (studentId ? (await User.findById(studentId)).name : 'Unknown'),
      action,
      category: category || (action === 'report' ? 'academic' : 'administrative'),
      details,
      relatedClass,
      relatedAssignment,
      performedBy: req.user.id,
      performedByName: req.user.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await record.save();
    
    // Populate the record for response (only if studentId exists)
    if (studentId) {
      await record.populate([
        { path: 'studentId', select: 'name email englishName' },
        { path: 'performedBy', select: 'name email' },
        { path: 'relatedClass', select: 'name' },
        { path: 'relatedAssignment', select: 'title' }
      ]);
    } else {
      await record.populate([
        { path: 'performedBy', select: 'name email' },
        { path: 'relatedClass', select: 'name' },
        { path: 'relatedAssignment', select: 'title' }
      ]);
    }
    
    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      record
    });
  } catch (error) {
    console.error('Error creating student record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student record'
    });
  }
});

// Update student record
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const record = await StudentRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found'
      });
    }
    
    // Allow updating details for reports
    if (record.action === 'report') {
      if (req.body.details) {
        // Merge existing details with new details
        record.details = { ...record.details, ...req.body.details };
      }
    } else {
      // For other records, only allow updating certain fields
      const allowedUpdates = ['details', 'notes'];
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          record[key] = req.body[key];
        }
      });
    }
    
    await record.save();
    
    // Populate the record for response
    await record.populate([
      { path: 'studentId', select: 'name email englishName' },
      { path: 'performedBy', select: 'name email' },
      { path: 'relatedClass', select: 'name' },
      { path: 'relatedAssignment', select: 'title' }
    ]);
    
    res.json({
      success: true,
      message: 'Student record updated successfully',
      record
    });
  } catch (error) {
    console.error('Error updating student record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student record'
    });
  }
});

// Delete student record (soft delete)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const record = await StudentRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found'
      });
    }
    
    // Soft delete by setting isActive to false
    record.isActive = false;
    await record.save();
    
    res.json({
      success: true,
      message: 'Student record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student record'
    });
  }
});

// Get student records statistics
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }
    
    const filter = dateFilter.$gte || dateFilter.$lte ? { timestamp: dateFilter } : {};
    
    const stats = await StudentRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const categoryStats = await StudentRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await StudentRecord.countDocuments(filter);
    const thisMonth = await StudentRecord.countDocuments({
      timestamp: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    res.json({
      success: true,
      stats: {
        total,
        thisMonth,
        byAction: stats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching student record stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get student activity timeline
router.get('/student/:studentId/timeline', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50 } = req.query;
    
    const records = await StudentRecord.find({ studentId })
      .populate('performedBy', 'name email')
      .populate('relatedClass', 'name')
      .populate('relatedAssignment', 'title')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      timeline: records
    });
  } catch (error) {
    console.error('Error fetching student timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student timeline'
    });
  }
});

module.exports = router;