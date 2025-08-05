const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PotentialStudent = require('../models/PotentialStudent');
const { verifyToken } = require('./auth');
const { generateStudentCode, reassignAllStudentCodes, findStudentCodeGaps } = require('../utils/studentCodeGenerator');

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
      status = 'potential',
      firebaseUid // Accept firebaseUid from frontend
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Validate that firebaseUid is provided
    if (!firebaseUid) {
      return res.status(400).json({ 
        success: false,
        message: 'Firebase UID is required' 
      });
    }

    let studentCode = null;

    // Generate student code for students
    if (role === 'student') {
      studentCode = await generateStudentCode();
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
      firebaseUid
    });

    await user.save();

    // If this is a student with status 'potential', also create a PotentialStudent record
    if (role === 'student' && status === 'potential') {
      try {
        const potentialStudent = new PotentialStudent({
          name,
          englishName,
          email,
          phone,
          gender,
          dob,
          parentName,
          parentPhone,
          source: 'registration_form',
          status: 'pending', // PotentialStudent uses different status values
          notes: notes || `Created from registration form. Student Code: ${studentCode}`,
          assignedTo: null // Will be assigned by admin later
        });
        
        await potentialStudent.save();
        console.log(`Created PotentialStudent record for user: ${user._id}`);
      } catch (potentialStudentError) {
        console.error('Error creating PotentialStudent record:', potentialStudentError);
        // Don't fail the user creation if PotentialStudent creation fails
      }
    }

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