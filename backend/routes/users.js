const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('./auth');
const router = express.Router();

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
    } else if (req.user.role === 'teacher') {
      // Teacher can see students and staff
      users = await User.find({ role: { $in: ['student', 'staff'] } }).select('-password');
    } else {
      // Staff can only see students
      users = await User.find({ role: 'student' }).select('-password');
    }
    
    res.json({
      success: true,
      users
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
    // Check if user is admin, teacher, or staff
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, teacher, or staff role required.' 
      });
    }

    // Permission hierarchy: students < staff < teachers < admin
    if (req.user.role === 'staff' && req.body.role !== 'student') {
      return res.status(403).json({ 
        success: false, 
        message: 'Staff can only create students.' 
      });
    }
    
    if (req.user.role === 'teacher' && (req.body.role !== 'student' && req.body.role !== 'staff')) {
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
      ...(password && { password }), // Only include password if provided
      ...otherFields
    });

    await user.save();

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

module.exports = router; 