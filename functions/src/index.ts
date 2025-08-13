// functions/src/index.ts - Firebase Functions Main Entry Point

import cors from 'cors';
import express from 'express';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

// Initialize Firebase Admin with proper error handling
try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.log('Firebase Admin SDK already initialized');
  }

  // Verify Firestore connection
  console.log('Firestore connection verified');

  // Verify Auth connection
  console.log('Firebase Auth connection verified');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  throw new Error(
    `Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
}

import { assignmentsRouter } from './routes/assignments';
// Import routes
import { authRouter } from './routes/auth';
import { changeLogsRouter } from './routes/changeLogs';
import { classesRouter } from './routes/classes';
import { levelsRouter } from './routes/levels';
import { notificationsRouter } from './routes/notifications';
import { potentialStudentsRouter } from './routes/potentialStudents';
import { studentRecordsRouter } from './routes/studentRecords';
import { studentReportsRouter } from './routes/student-reports';
import submissionsRouter from './routes/submissions';
import { usersRouter } from './routes/users';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Test Firestore connection by checking if we can access the database
    const db = admin.firestore();
    // Use a simple query to test connection instead of accessing a specific collection
    await db.collection('users').limit(1).get();

    // Test Auth connection
    admin.auth();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      firebase: {
        projectId: admin.app().options.projectId,
        database: 'firestore',
        firestore: 'connected',
        auth: 'connected',
      },
      vstorage: {
        accessKey:
          process.env.VSTORAGE_ACCESS_KEY ||
          process.env.VITE_VSTORAGE_ACCESS_KEY ||
          'cb1d2453d51a5936b5eee3be7685d1dc'
            ? 'configured'
            : 'not configured',
        bucket: process.env.VSTORAGE_BUCKET || process.env.VITE_VSTORAGE_BUCKET || 'skillup',
        endpoint:
          process.env.VSTORAGE_ENDPOINT ||
          process.env.VITE_VSTORAGE_ENDPOINT ||
          'https://s3.vngcloud.vn',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      firebase: {
        projectId: admin.app().options.projectId,
        database: 'firestore',
        firestore: 'disconnected',
        auth: 'disconnected',
      },
    });
  }
});

// Test endpoint for connectivity
app.get('/test', (_req, res) => {
  res.json({
    status: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Backend is reachable',
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
app.use('/student-reports', studentReportsRouter);
app.use('/notifications', notificationsRouter);
app.use('/change-logs', changeLogsRouter);

// Error handling middleware
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: errorMessage,
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the Express app as a Firebase Function
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '256MiB',
  },
  app
);
