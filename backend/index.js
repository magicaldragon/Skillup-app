const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

console.log('✅ Backend initialized');

// Optimized MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 5, // Reduced for faster startup
  serverSelectionTimeoutMS: 3000, // Faster timeout
  socketTimeoutMS: 30000
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Simplified CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://skillup-frontend-uvt6.onrender.com',
  'https://skillup-frontend.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Essential middleware only
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Simple caching for static assets
app.use('/uploads/avatars', express.static('uploads/avatars', {
  maxAge: '1y'
}));

// Import and use routes
const { router: authRouter } = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentsRouter = require('./routes/assignments');
const submissionsRouter = require('./routes/submissions');
const classesRouter = require('./routes/classes');
const levelsRouter = require('./routes/levels');
const changeLogsRouter = require('./routes/changeLogs');
const potentialStudentsRouter = require('./routes/potentialStudents');
const studentRecordsRouter = require('./routes/studentRecords');

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/change-logs', changeLogsRouter);
app.use('/api/potential-students', potentialStudentsRouter);
app.use('/api/student-records', studentRecordsRouter);

// Optimized health check
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const healthy = state === 1;
  
  res.json({
    success: healthy,
    health: {
      dbConnected: healthy,
      state,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend API is working!',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('SKILLUP Backend is running!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 
