const express = require('express');
const { verifyToken } = require('./auth');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');
const Level = require('../models/Level');

// Get all levels
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('=== LEVELS ROUTE DEBUG ===');
    console.log('User from token:', req.user);
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.userId || req.user.id);

    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      console.log('Access denied - role not allowed:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, teacher, or staff role required.',
      });
    }

    console.log('Role check passed, fetching levels...');

    // First, let's check if there are any levels at all (including inactive ones)
    const allLevels = await Level.find({}).sort({ createdAt: 1 });
    console.log('All levels in database:', allLevels.length);
    console.log(
      'All levels data:',
      allLevels.map((l) => ({ id: l._id, name: l.name, code: l.code, isActive: l.isActive }))
    );

    // Now get only active levels
    const levels = await Level.find({ isActive: true }).sort({ createdAt: 1 });
    console.log('Active levels found:', levels.length);
    console.log(
      'Active levels data:',
      levels.map((l) => ({ id: l._id, name: l.name, code: l.code }))
    );

    res.json({ success: true, levels });
    console.log('=== END LEVELS ROUTE DEBUG ===');
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new level (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required' });
    }
    const exists = await Level.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: 'Level with this name or code already exists' });
    }
    const newLevel = await Level.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
    });
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'add',
      entityType: 'level',
      entityId: newLevel._id,
      details: { after: newLevel },
      ip: req.ip,
    });
    res.status(201).json({ success: true, message: 'Level created successfully', level: newLevel });
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update level (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const { name, code, description } = req.body;
    const level = await Level.findById(req.params.id);
    if (!level || !level.isActive) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    // Check for conflicts
    const conflict = await Level.findOne({
      _id: { $ne: req.params.id },
      $or: [{ name: name || level.name }, { code: (code || level.code).toUpperCase() }],
    });
    if (conflict) {
      return res
        .status(400)
        .json({ success: false, message: 'Level with this name or code already exists' });
    }
    const before = { ...level.toObject() };
    level.name = name || level.name;
    level.code = code ? code.trim().toUpperCase() : level.code;
    level.description = description !== undefined ? description : level.description;
    await level.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'edit',
      entityType: 'level',
      entityId: level._id,
      details: { before, after: level },
      ip: req.ip,
    });
    res.json({ success: true, message: 'Level updated successfully', level });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete level (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const level = await Level.findById(req.params.id);
    if (!level || !level.isActive) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    const before = { ...level.toObject() };
    level.isActive = false;
    await level.save();
    await ChangeLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'delete',
      entityType: 'level',
      entityId: level._id,
      details: { before },
      ip: req.ip,
    });
    res.json({ success: true, message: 'Level deleted successfully' });
  } catch (error) {
    console.error('Delete level error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
