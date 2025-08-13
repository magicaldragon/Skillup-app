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
      // First try to verify as Firebase ID token
      decodedToken = await admin.auth().verifyIdToken(token);

      // Get user data from Firestore by firebaseUid
      const userQuery = await admin
        .firestore()
        .collection('users')
        .where('firebaseUid', '==', decodedToken.uid)
        .limit(1)
        .get();

      if (userQuery.empty) {
        res.status(401).json({
          success: false,
          message: 'User not found in database',
        });
        return;
      }

      userData = userQuery.docs[0].data();
    } catch (firebaseError) {
      // If Firebase ID token verification fails, try as custom token
      try {
        decodedToken = await admin.auth().verifyIdToken(token);

        // For custom tokens, we need to extract user info from the token
        const userQuery = await admin
          .firestore()
          .collection('users')
          .where('firebaseUid', '==', decodedToken.uid)
          .limit(1)
          .get();

        if (userQuery.empty) {
          res.status(401).json({
            success: false,
            message: 'User not found in database',
          });
          return;
        }

        userData = userQuery.docs[0].data();
      } catch (customError) {
        console.error('Both token verification methods failed:', { firebaseError, customError });
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
        return;
      }
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
      userId: userData._id || userData.id || '',
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
