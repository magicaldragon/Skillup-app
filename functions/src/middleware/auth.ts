// functions/src/middleware/auth.ts - Authentication Middleware
import { Request, Response, NextFunction } from 'express';
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
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    // Get user data from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .where('firebaseUid', '==', decodedToken.uid)
      .limit(1)
      .get();

    if (userDoc.empty) {
      res.status(401).json({
        success: false,
        message: 'User not found in database'
      });
      return;
    }

    const userData = userDoc.docs[0].data();
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: userData.role,
      userId: userDoc.docs[0].id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireTeacher = requireRole(['admin', 'teacher']);
export const requireStaff = requireRole(['admin', 'teacher', 'staff']); 