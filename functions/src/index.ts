// functions/src/index.ts - Firebase Functions Main Entry Point
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Initialize Firebase Admin
admin.initializeApp();

// Import routes
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { classesRouter } from './routes/classes';
import { levelsRouter } from './routes/levels';
import { assignmentsRouter } from './routes/assignments';
import { submissionsRouter } from './routes/submissions';
import { potentialStudentsRouter } from './routes/potentialStudents';
import { studentRecordsRouter } from './routes/studentRecords';
import { changeLogsRouter } from './routes/changeLogs';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://skillup-frontend-uvt6.onrender.com',
    'https://skillup-frontend.onrender.com',
    'https://skillup-3beaf.web.app',
    'https://skillup-3beaf.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/classes', classesRouter);
app.use('/levels', levelsRouter);
app.use('/assignments', assignmentsRouter);
app.use('/submissions', submissionsRouter);
app.use('/potential-students', potentialStudentsRouter);
app.use('/student-records', studentRecordsRouter);
app.use('/change-logs', changeLogsRouter);

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Export the Express app as a Firebase Function v2
export const api = onRequest({
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '256MiB'
}, app); 