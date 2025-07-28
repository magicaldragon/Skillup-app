const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('./auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ChangeLog = require('../models/ChangeLog');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/avatars')),
  filename: (req, file, cb) => cb(null, `${req.params.id}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Get all users (admin can see all, teacher can see students and staff, staff can see students only)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    // Admin can see all users, teacher can see students and staff, staff can only see students
    let users;
    if (req.user.role === 'admin') {
      users = await User.find().select('-password');
      console.log(`[DEBUG] /api/users: Found ${users.length} users for admin. Roles:`, users.map(u => u.role));
    } else if (req.user.role === 'teacher') {
      // Teacher can see students and staff
      users = await User.find({ role: { $in: ['student', 'staff'] } }).select('-password');
    } else {
      // Staff can only see students
      users = await User.find({ role: 'student' }).select('-password');
    }
    
    res.json({
      success: true,
      users: users.map(u => {
        const obj = u.toObject();
        obj.id = obj._id;
        obj.displayName = obj.displayName || obj.name || '';
        delete obj._id;
        return obj;
      })
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Check if email exists (for registration validation)
router.get('/check-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const user = await User.findOne({ email });
    
    res.json({
      success: true,
      exists: !!user
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Check if username exists
router.get('/check-username/:username', verifyToken, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username });
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ exists: false, error: 'Internal server error' });
  }
});

// Get user by Firebase UID (for hybrid auth) - MUST BE BEFORE /:id route
router.get('/firebase/:firebaseUid', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid }).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user by Firebase UID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Create new user (admin can create any role, teacher can create students and staff, staff can create students only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Extract fields from request body
    const { name, email, role, firebaseUid, password, username, phone, englishName, dob, gender, note } = req.body;
    
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    // Permission hierarchy: students < staff < teachers < admin
    if (req.user.role === 'staff' && role !== 'student') {
      return res.status(403).json({ 
        success: false, 
        message: 'Staff can only create students.' 
      });
    }
    
    if (req.user.role === 'teacher' && (role !== 'student' && role !== 'staff')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Teachers can only create students and staff.' 
      });
    }

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${!name ? 'name ' : ''}${!email ? 'email ' : ''}${!role ? 'role' : ''}`.trim() 
      });
    }

    // Password is required only if not using Firebase Auth
    if (!firebaseUid && !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required when not using Firebase Auth' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Check if Firebase UID already exists (if provided)
    if (firebaseUid) {
      const existingFirebaseUser = await User.findOne({ firebaseUid });
      if (existingFirebaseUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Firebase UID already exists' 
        });
      }
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      role,
      firebaseUid,
      username,
      ...(password && { password }), // Only include password if provided
      ...(phone && { phone }),
      ...(englishName && { englishName }),
      ...(dob && { dob }),
      ...(gender && { gender }),
      ...(note && { note })
    });

    await user.save();

    // Log the action
    const logUser = {
      id: (req.user && (req.user.id || req.user._id)) || 'system',
      name: (req.user && (req.user.name || req.user.email)) || 'System',
      role: (req.user && req.user.role) || 'system'
    };
    await ChangeLog.create({
      userId: logUser.id,
      userName: logUser.name,
      userRole: logUser.role,
      action: 'add',
      entityType: 'user',
      entityId: user._id,
      details: { after: user },
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    // Add detailed error message for debugging
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      stack: error.stack,
      error: error
    });
  }
});

// Update user
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, role, status, ...otherFields } = req.body;

    // Get the user to be updated
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check permissions (admin can update anyone, teacher can update students and staff, staff can update students, users can update themselves)
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff' && req.user.userId !== req.params.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update your own profile.' 
      });
    }

    // Permission hierarchy: students < staff < teachers < admin
    if (req.user.role === 'staff' && userToUpdate.role !== 'student') {
      return res.status(403).json({ 
        success: false, 
        message: 'Staff can only update students' 
      });
    }
    
    if (req.user.role === 'teacher' && (userToUpdate.role !== 'student' && userToUpdate.role !== 'staff')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Teachers can only update students and staff' 
      });
    }

    // Only admin can change role and status
    if (req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.status;
    }
    // Allow users to update their own diceBearStyle and diceBearSeed
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
      delete req.body.diceBearStyle;
      delete req.body.diceBearSeed;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Log the action
    const before = await User.findById(req.params.id);
    await User.findByIdAndUpdate(req.params.id, req.body);
    const after = await User.findById(req.params.id);
    const logUser = {
      id: (req.user && (req.user.id || req.user._id)) || 'system',
      name: (req.user && (req.user.name || req.user.email)) || 'System',
      role: (req.user && req.user.role) || 'system'
    };
    await ChangeLog.create({
      userId: logUser.id,
      userName: logUser.name,
      userRole: logUser.role,
      action: 'edit',
      entityType: 'user',
      entityId: req.params.id,
      details: { before, after },
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Avatar upload endpoint
router.post('/:id/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    // Only allow user to upload their own avatar or admin
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only upload your own avatar.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.params.id, { avatarUrl });
    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to upload avatar.', error: error?.message || error });
    }
  }
});

// Remove avatar endpoint
router.delete('/:id/avatar', verifyToken, async (req, res) => {
  try {
    // Only allow user to remove their own avatar or admin
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only remove your own avatar.' });
    }
    const user = await User.findById(req.params.id);
    if (user && user.avatarUrl) {
      const filePath = path.join(__dirname, '../', user.avatarUrl);
      fs.unlink(filePath, err => {
        // Ignore error if file does not exist
      });
    }
    await User.findByIdAndUpdate(req.params.id, { avatarUrl: '' });
    res.json({ success: true, message: 'Avatar removed.' });
  } catch (error) {
    console.error('Avatar remove error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove avatar.' });
  }
});

// Delete user (admin can delete anyone, teacher can delete students and staff, staff can delete students only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    // Prevent deleting self
    if (req.user.userId === req.params.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Get the user to be deleted
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Permission hierarchy: students < staff < teachers < admin
    if (req.user.role === 'staff' && userToDelete.role !== 'student') {
      return res.status(403).json({ 
        success: false, 
        message: 'Staff can only delete students' 
      });
    }
    
    if (req.user.role === 'teacher' && (userToDelete.role !== 'student' && userToDelete.role !== 'staff')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Teachers can only delete students and staff' 
      });
    }

    // Check if this is the last admin (only for admin deletions)
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete the last admin account' 
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    // Log the action
    const before = await User.findById(req.params.id);
    const logUser = {
      id: (req.user && (req.user.id || req.user._id)) || 'system',
      name: (req.user && (req.user.name || req.user.email)) || 'System',
      role: (req.user && req.user.role) || 'system'
    };
    await ChangeLog.create({
      userId: logUser.id,
      userName: logUser.name,
      userRole: logUser.role,
      action: 'delete',
      entityType: 'user',
      entityId: req.params.id,
      details: { before },
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// --- Admin Debug Endpoints ---
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'changeme';

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin only' });
}

// Simple in-memory log for demonstration
let errorLogs = [
  { timestamp: new Date().toISOString(), message: 'Sample error log', level: 'error', service: 'backend' }
];

router.get('/admin/error-logs', verifyToken, requireAdmin, (req, res) => {
  res.json({ success: true, logs: errorLogs.slice(-100) });
});

// User sync status: compare MongoDB and Firebase (simulate for now)
router.get('/admin/user-sync-status', verifyToken, requireAdmin, async (req, res) => {
  // Simulate: fetch all users from MongoDB
  const mongoUsers = await User.find({});
  // Simulate: fetch all users from Firebase (not implemented, so just return MongoDB for now)
  // In real app, compare with Firebase list
  res.json({ success: true, mongoCount: mongoUsers.length, firebaseCount: mongoUsers.length, discrepancies: [] });
});

// Deploy/redeploy endpoints (simulate)
router.post('/admin/deploy-frontend', verifyToken, requireAdmin, (req, res) => {
  // In real app, trigger a webhook or script
  res.json({ success: true, message: 'Frontend redeploy triggered (simulated).' });
});
router.post('/admin/deploy-backend', verifyToken, requireAdmin, (req, res) => {
  // In real app, trigger a webhook or script
  res.json({ success: true, message: 'Backend redeploy triggered (simulated).' });
});

// Version endpoint
router.get('/admin/version', (req, res) => {
  res.json({ success: true, version: '1.0.0', uptime: process.uptime() });
});

module.exports = router; 