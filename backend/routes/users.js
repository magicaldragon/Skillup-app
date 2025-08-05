const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('./auth');
const { generateStudentCode, reassignAllStudentCodes, findStudentCodeGaps } = require('../utils/studentCodeGenerator');
const admin = require('firebase-admin');

// Get all users (with role-based filtering)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    // Role-based filtering - allow admin, teacher, and staff to see all users
    if (role === 'admin' || role === 'teacher' || role === 'staff') {
      // Admin, teachers, and staff see all users
      query = {};
    } else if (role === 'student') {
      // Students see only themselves (for security)
      const userId = req.user.userId || req.user.id;
      query = { _id: userId };
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    console.log(`Fetched ${users.length} users for role: ${role}`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin endpoint to get student code statistics
router.get('/admin/student-codes/stats', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = await findStudentCodeGaps();
    res.json(stats);
  } catch (error) {
    console.error('Error getting student code stats:', error);
    res.status(500).json({ message: 'Failed to get student code statistics' });
  }
});

// Admin endpoint to reassign all student codes
router.post('/admin/student-codes/reassign', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await reassignAllStudentCodes();
    res.json(result);
  } catch (error) {
    console.error('Error reassigning student codes:', error);
    res.status(500).json({ message: 'Failed to reassign student codes' });
  }
});

// Register new user
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      gender, 
      englishName, 
      dob, 
      phone, 
      parentName, 
      parentPhone, 
      notes,
      firebaseUid, // Accept firebaseUid from frontend if provided
      password // Accept password from frontend for Firebase user creation
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    let studentCode = null;
    let status = 'potential';
    let finalFirebaseUid = firebaseUid;

    // Generate student code for students
    if (role === 'student') {
      studentCode = await generateStudentCode();
      status = 'potential'; // Default status for new students
    }

    // Create Firebase Auth user if not provided and Firebase Admin is available
    if (!finalFirebaseUid && global.firebaseAdmin && password) {
      try {
        const firebaseUser = await global.firebaseAdmin.auth().createUser({
          email,
          displayName: name,
          password: password,
        });

        // Set custom claims based on role
        await global.firebaseAdmin.auth().setCustomUserClaims(firebaseUser.uid, { role });
        
        finalFirebaseUid = firebaseUser.uid;
        console.log('✅ Firebase user created successfully:', finalFirebaseUid);
      } catch (firebaseError) {
        console.error('❌ Firebase user creation failed:', firebaseError);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to create user in authentication system: ' + firebaseError.message 
        });
      }
    } else if (!finalFirebaseUid) {
      // If no Firebase UID provided and Firebase Admin not available, return error
      return res.status(500).json({ 
        success: false,
        message: 'Firebase user creation not available. Please provide firebaseUid or configure Firebase Admin SDK.' 
      });
    }

    // Create user in MongoDB
    const user = new User({
      name,
      email,
      role,
      gender,
      englishName,
      dob,
      phone,
      parentName,
      parentPhone,
      notes,
      studentCode,
      status,
      firebaseUid: finalFirebaseUid
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
        status: user.status,
        studentCode: user.studentCode,
        firebaseUid: user.firebaseUid
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create user: ' + error.message 
    });
  }
});

// Update user
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      role, 
      gender, 
      englishName, 
      dob, 
      phone, 
      parentName, 
      parentPhone, 
      notes, 
      status, 
      studentCode 
    } = req.body;

    const updateData = {
      name,
      email,
      role,
      gender,
      englishName,
      dob,
      phone,
      parentName,
      parentPhone,
      notes,
      status,
      studentCode,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update Firebase Auth user if needed
    if (user.firebaseUid) {
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          displayName: user.name,
          email: user.email
        });

        // Update custom claims
        await admin.auth().setCustomUserClaims(user.firebaseUid, { role });
      } catch (firebaseError) {
        console.error('Firebase user update failed:', firebaseError);
      }
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete from Firebase Auth if UID exists
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        console.error('Firebase user deletion failed:', firebaseError);
      }
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user avatar
router.post('/:id/avatar', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // This would typically handle file upload to cloud storage
    // For now, we'll just return a success message
    res.json({ message: 'Avatar updated successfully', avatarUrl: 'placeholder-url' });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Remove user avatar
router.delete('/:id/avatar', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { avatarUrl: null });
    res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Error removing avatar:', error);
    res.status(500).json({ message: 'Failed to remove avatar' });
  }
});

module.exports = router; 