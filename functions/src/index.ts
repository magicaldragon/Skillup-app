// functions/src/index.ts - Firebase Functions Main Entry Point
import express from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

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

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      projectId: admin.app().options.projectId,
      database: 'firestore'
    },
    mongodb: {
      uri: process.env.MONGODB_URI ? 'configured' : 'not configured'
    },
    vstorage: {
      accessKey: process.env.VSTORAGE_ACCESS_KEY || process.env.VITE_VSTORAGE_ACCESS_KEY || 'cb1d2453d51a5936b5eee3be7685d1dc' ? 'configured' : 'not configured',
      bucket: process.env.VSTORAGE_BUCKET || process.env.VITE_VSTORAGE_BUCKET || 'skillup'
    }
  });
});

// Test endpoint for connectivity
app.get('/test', (_req, res) => {
  res.json({
    status: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Backend is reachable'
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
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the Express app as a Firebase Function
export const api = onRequest({
  region: 'us-central1',
    timeoutSeconds: 540,
  memory: '256MiB'
}, app); 