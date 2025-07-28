const express = require('express');
const { verifyToken } = require('./auth');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');

// Mock data for levels - in production this would come from MongoDB
let levels = [
  {
    id: 'starters',
    name: 'Starters',
    code: 'ST',
    description: 'Beginner level for young learners',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'movers',
    name: 'Movers',
    code: 'MV',
    description: 'Elementary level for young learners',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'flyers',
    name: 'Flyers',
    code: 'FL',
    description: 'Pre-intermediate level for young learners',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'ket',
    name: 'KET',
    code: 'KET',
    description: 'Key English Test - A2 level',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'pet',
    name: 'PET',
    code: 'PET',
    description: 'Preliminary English Test - B1 level',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'ielts',
    name: 'IELTS',
    code: 'IELTS',
    description: 'International English Language Testing System',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

// Get all levels
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    res.json({
      success: true,
      levels: levels.filter(l => l.isActive)
    });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Create new level (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    const { name, code, description } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    // Check if level already exists
    if (levels.some(l => l.name.toLowerCase() === name.toLowerCase() || l.code.toLowerCase() === code.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Level with this name or code already exists'
      });
    }

    const newLevel = {
      id: `level_${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    levels.push(newLevel);

    // Log the action
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'add',
      entityType: 'level',
      entityId: newLevel.id,
      details: { after: newLevel },
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Level created successfully',
      level: newLevel
    });
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update level (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    const levelIndex = levels.findIndex(l => l.id === req.params.id);
    if (levelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    const { name, code, description } = req.body;

    // Check if new name/code conflicts with existing levels
    const conflictingLevel = levels.find(l => 
      l.id !== req.params.id && 
      (l.name.toLowerCase() === (name || levels[levelIndex].name).toLowerCase() || 
       l.code.toLowerCase() === (code || levels[levelIndex].code).toLowerCase())
    );

    if (conflictingLevel) {
      return res.status(400).json({
        success: false,
        message: 'Level with this name or code already exists'
      });
    }

    // Update level
    levels[levelIndex] = {
      ...levels[levelIndex],
      name: name || levels[levelIndex].name,
      code: code ? code.trim().toUpperCase() : levels[levelIndex].code,
      description: description !== undefined ? description : levels[levelIndex].description
    };

    // Log the action
    const before = levels[levelIndex];
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'edit',
      entityType: 'level',
      entityId: req.params.id,
      details: { before, after: levels[levelIndex] },
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Level updated successfully',
      level: levels[levelIndex]
    });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete level (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    const levelIndex = levels.findIndex(l => l.id === req.params.id);
    if (levelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    // Soft delete by setting isActive to false
    levels[levelIndex] = {
      ...levels[levelIndex],
      isActive: false
    };

    // Log the action
    const before = levels[levelIndex];
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'delete',
      entityType: 'level',
      entityId: req.params.id,
      details: { before },
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Level deleted successfully'
    });
  } catch (error) {
    console.error('Delete level error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router; 