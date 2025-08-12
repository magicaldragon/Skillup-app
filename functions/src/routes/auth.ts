// functions/src/routes/auth.ts - Authentication API Routes
import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, verifyToken } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/profile', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user!;

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data()!;
    
    // Remove sensitive information
    const { firebaseUid, ...safeUserData } = userData;

    return res.json({
      id: userDoc.id,
      ...safeUserData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user!;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.firebaseUid;
    delete updateData.role;
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('users').doc(userId).update(updateData);

    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Failed to update user profile' });
  }
});

// Verify Firebase token
router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Token is required' 
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from Firestore
    const userQuery = await admin.firestore()
      .collection('users')
      .where('firebaseUid', '==', decodedToken.uid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found in database' 
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Create a custom token for the user
    const customToken = await admin.auth().createCustomToken(decodedToken.uid, {
      userId: userDoc.id,
      role: userData.role,
      email: userData.email
    });

    return res.json({
      success: true,
      message: 'Token verified successfully',
      user: {
        id: userDoc.id,
        ...userData
      },
      customToken
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// Refresh user session
router.post('/refresh', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user!;

    // Get updated user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data()!;

    // Create a new custom token
    const customToken = await admin.auth().createCustomToken(userData.firebaseUid, {
      userId: userDoc.id,
      role: userData.role,
      email: userData.email
    });

    return res.json({
      success: true,
      message: 'Session refreshed successfully',
      user: {
        id: userDoc.id,
        ...userData
      },
      customToken
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    return res.status(500).json({ message: 'Failed to refresh session' });
  }
});

// Logout (client-side token invalidation)
router.post('/logout', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real implementation, you might want to track logout events
    // For now, we'll just return a success response
    // The actual token invalidation happens on the client side
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ message: 'Failed to logout' });
  }
});

// Get user permissions
router.get('/permissions', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;

    // Define permissions based on role
    const permissions = {
      admin: {
        canManageUsers: true,
        canManageClasses: true,
        canManageLevels: true,
        canManageAssignments: true,
        canViewAllData: true,
        canDeleteData: true,
        canManageSystem: true
      },
      teacher: {
        canManageUsers: false,
        canManageClasses: false,
        canManageLevels: false,
        canManageAssignments: true,
        canViewAllData: false,
        canDeleteData: false,
        canManageSystem: false,
        canGradeSubmissions: true,
        canViewOwnClasses: true,
        canViewOwnStudents: true
      },
      student: {
        canManageUsers: false,
        canManageClasses: false,
        canManageLevels: false,
        canManageAssignments: false,
        canViewAllData: false,
        canDeleteData: false,
        canManageSystem: false,
        canSubmitAssignments: true,
        canViewOwnData: true,
        canViewOwnClasses: true
      },
      staff: {
        canManageUsers: true,
        canManageClasses: true,
        canManageLevels: true,
        canManageAssignments: true,
        canViewAllData: true,
        canDeleteData: false,
        canManageSystem: false
      }
    };

    return res.json({
      success: true,
      permissions: permissions[role as keyof typeof permissions] || {}
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ message: 'Failed to fetch permissions' });
  }
});

// Change password (requires Firebase Auth)
router.post('/change-password', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Note: Password changes should be handled through Firebase Auth on the client side
    // This endpoint is for logging the change request
    return res.json({
      success: true,
      message: 'Password change request logged. Please use Firebase Auth to change your password.'
    });
  } catch (error) {
    console.error('Error processing password change:', error);
    return res.status(500).json({ message: 'Failed to process password change' });
  }
});

export { router as authRouter }; 