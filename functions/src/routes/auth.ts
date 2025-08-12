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
      token: customToken
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to verify token' 
    });
  }
});

// Firebase login route - exchange Firebase token for JWT
router.post('/firebase-login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firebaseToken, email } = req.body;

    if (!firebaseToken || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Firebase token and email are required' 
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
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

    // Create a custom JWT token for the user
    const customToken = await admin.auth().createCustomToken(decodedToken.uid, {
      userId: userDoc.id,
      role: userData.role,
      email: userData.email
    });

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userDoc.id,
        ...userData
      },
      token: customToken
    });
  } catch (error) {
    console.error('Error in firebase-login:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Login failed' 
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
router.post('/logout', verifyToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Client-side logout - just return success
    // The actual token invalidation should be handled client-side
    res.json({ 
      success: true, 
      message: 'Logout successful. Please clear your local storage.' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
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
router.post('/change-password', verifyToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Password change should be handled client-side via Firebase Auth
    // This endpoint is a placeholder for future server-side password validation
    res.json({ 
      success: true, 
      message: 'Password change should be handled via Firebase Auth client SDK' 
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Password change failed' 
    });
  }
});

export { router as authRouter }; 