const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const fs = require('fs');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // For now, we'll use Firebase Auth for password verification
    // This is a simplified version - in production, you'd verify with Firebase
    // For testing purposes, we'll accept any password if user exists
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        id: user._id,
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'skillup-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        status: user.status,
        studentCode: user.studentCode
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillup-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Debug route to check if user exists (for troubleshooting)
router.get('/debug/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    console.log('Debug: Checking user existence for:', email);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        email: email
      });
    }
    
    // Return user info without sensitive data
    res.json({
      success: true,
      message: 'User found',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Debug user check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user',
      error: error.message
    });
  }
});

// Simple connectivity test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify authentication
router.get('/test-auth', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working',
    user: {
      id: req.user.userId || req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // Handle both userId and id fields from token
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid token: missing user ID' 
      });
    }

    const user = await User.findById(userId).select('-password');
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
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Logout route (client-side token removal)
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Firebase login route for hybrid auth users
router.post('/firebase-login', async (req, res) => {
  try {
    // Ensure DB is connected before proceeding
    if (!require('mongoose').connection || require('mongoose').connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database not ready, please try again shortly' });
    }

    console.log('Firebase login request received:', { 
      email: req.body.email, 
      hasToken: !!req.body.firebaseToken 
    });

    const { firebaseToken, email } = req.body;

    if (!firebaseToken || !email) {
      console.log('Missing required fields:', { hasToken: !!firebaseToken, hasEmail: !!email });
      return res.status(400).json({ 
        success: false, 
        message: 'Firebase token and email are required' 
      });
    }

    // Find user by email in MongoDB
    console.log('Looking up user with email:', email);
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found in database:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found in database. Please contact administrator.' 
      });
    }

    console.log('User found:', { 
      id: user._id, 
      name: user.name, 
      role: user.role, 
      status: user.status 
    });

    // Check if user is active (allow all statuses for now to avoid blocking users)
    if (user.status === 'off') {
      console.log('User account is disabled:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Account is disabled. Please contact administrator.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name,
        id: user._id
      },
      process.env.JWT_SECRET || 'skillup-secret-key',
      { expiresIn: '24h' }
    );

    console.log('JWT token generated successfully for user:', user.email);

    // Return user data and token
    const userResponse = {
      id: user._id,
      _id: user._id, // Include both for compatibility
      name: user.name,
      fullname: user.name, // Include both for compatibility
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      status: user.status,
      studentCode: user.studentCode
    };

    console.log('Sending successful response for user:', user.email);
    res.json({
      success: true,
      message: 'Firebase login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Firebase login error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid user data';
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = 'Database error occurred';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/logs - Return last 100 lines of backend log (or placeholder)
router.get('/admin/logs', verifyToken, async (req, res) => {
  try {
    // Only allow admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    // Try to read log file (if available)
    const logPath = process.env.BACKEND_LOG_PATH || './backend.log';
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
      const lastLines = lines.slice(-100).join('\n');
      return res.json({ success: true, logs: lastLines });
    } else {
      return res.json({ success: true, logs: 'No backend log file found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch backend logs', error: error.message });
  }
});

module.exports = { router, verifyToken }; 