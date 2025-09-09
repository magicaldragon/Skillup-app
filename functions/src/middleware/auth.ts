// functions/src/middleware/auth.ts - Authentication Middleware
import type { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    userId: string;
  };
}

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format',
      });
      return;
    }

    let decodedToken;
    let userData;

    try {
      // First try to decode as session token
      try {
        const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
        
        // Check if token is expired
        if (sessionData.exp && sessionData.exp < Math.floor(Date.now() / 1000)) {
          res.status(401).json({
            success: false,
            message: 'Token has expired. Please log in again.',
          });
          return;
        }

        // Get user data from Firestore by userId
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(sessionData.userId)
          .get();

        if (!userDoc.exists) {
          res.status(401).json({
            success: false,
            message: 'User not found in database',
          });
          return;
        }

        userData = userDoc.data();
        if (userData) {
          // For session tokens, preserve the userId from the token and add document ID
          userData._id = userDoc.id;
          userData.docId = userDoc.id;
        }
        decodedToken = { uid: sessionData.uid, email: sessionData.email, userId: sessionData.userId };
        console.log('Session token verified successfully for user:', sessionData.email);
      } catch (sessionError) {
        // If session token fails, try Firebase ID token
        console.log('Session token failed, trying Firebase ID token verification');
        try {
          decodedToken = await admin.auth().verifyIdToken(token);
          console.log('Firebase ID token verified successfully for UID:', decodedToken.uid);
        } catch (firebaseError) {
          console.error('Firebase ID token verification also failed:', firebaseError);
          throw new Error('Both session and Firebase token verification failed');
        }

        // Get user data from Firestore by firebaseUid
        const userQuery = await admin
          .firestore()
          .collection('users')
          .where('firebaseUid', '==', decodedToken.uid)
          .limit(1)
          .get();

        if (userQuery.empty) {
          console.error('User not found in Firestore for Firebase UID:', decodedToken.uid);
          res.status(401).json({
            success: false,
            message: 'User account not found. Please contact administrator.',
          });
          return;
        }

        userData = userQuery.docs[0].data();
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      
      // Provide more specific error messages
      if (tokenError instanceof Error) {
        if (tokenError.message.includes('Token used too late')) {
          res.status(401).json({
            success: false,
            message: 'Token has expired. Please log in again.',
          });
        } else if (tokenError.message.includes('Invalid token')) {
          res.status(401).json({
            success: false,
            message: 'Invalid authentication token. Please log in again.',
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Authentication failed. Please log in again.',
          });
        }
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
      return;
    }

    if (!decodedToken || !userData) {
      res.status(401).json({
        success: false,
        message: 'Token verification failed',
      });
      return;
    }

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email || '',
      role: userData.role || 'student',
      userId: decodedToken.userId || userData._id || userData.id || userData.firebaseUid || '',
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireTeacher = requireRole(['admin', 'teacher']);
export const requireStaff = requireRole(['admin', 'teacher', 'staff']);
