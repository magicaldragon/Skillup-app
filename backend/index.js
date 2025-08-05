const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('✅ Backend initialized - using frontend Firebase SDK for authentication');

// API usage monitoring
let apiUsage = {
  geminiRequests: 0,
  lastReset: Date.now()
};

// Reset usage counter daily
setInterval(() => {
  apiUsage.geminiRequests = 0;
  apiUsage.lastReset = Date.now();
  console.log('API usage counter reset');
}, 24 * 60 * 60 * 1000); // 24 hours

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173', // Vite preview server
  'https://skillup-frontend-uvt6.onrender.com', // <-- Deployed frontend URL (Render)
  'https://skillup-frontend.onrender.com', // Alternative frontend URL
  // Add any additional origins from environment variables
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

// More permissive CORS configuration for development
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log('CORS: Checking origin:', origin);
    console.log('CORS: Allowed origins:', allowedOrigins);
    
    // Allow all origins in development, or check against allowedOrigins in production
    if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origin allowed');
      return callback(null, true);
    } else {
      console.log('CORS: Origin not allowed:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Add caching middleware for static responses
const cacheControl = (req, res, next) => {
  // Cache test endpoint for 30 seconds
  if (req.path === '/api/test') {
    res.set('Cache-Control', 'public, max-age=30');
  }
  next();
};

app.use(cacheControl);

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const { router: authRouter } = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentsRouter = require('./routes/assignments');
const submissionsRouter = require('./routes/submissions');
const classesRouter = require('./routes/classes');
const levelsRouter = require('./routes/levels');
const changeLogsRouter = require('./routes/changeLogs');
const potentialStudentsRouter = require('./routes/potentialStudents');
const studentRecordsRouter = require('./routes/studentRecords');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/change-logs', changeLogsRouter);
app.use('/api/potential-students', potentialStudentsRouter);
app.use('/api/student-records', studentRecordsRouter);

// Serve uploaded avatars statically
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// Example root route
app.get('/', (req, res) => {
  res.send('SKILLUP Backend is running!');
});

// --- Optimized test route for frontend-backend connection ---
app.get('/api/test', (req, res) => {
  // Return immediately without database queries for faster response
  res.json({ 
    success: true, 
    message: 'Backend API is working and connected to MongoDB!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- CORS test route ---
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CORS is working!',
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins
  });
});

// --- API usage monitoring route ---
app.get('/api/usage', (req, res) => {
  res.json({
    success: true,
    usage: {
      geminiRequests: apiUsage.geminiRequests,
      lastReset: new Date(apiUsage.lastReset).toISOString(),
      estimatedCost: `$${(apiUsage.geminiRequests * 0.0001).toFixed(4)}` // Rough estimate
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      error: 'CORS_ERROR'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);
  console.log('API Key configured:', !!process.env.API_KEY);
});
// Fixed critical bugs: role variable scope and staff role support 
