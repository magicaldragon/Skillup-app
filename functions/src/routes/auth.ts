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
    console.log('Firebase login request received:', { 
      hasToken: !!req.body.firebaseToken, 
      hasEmail: !!req.body.email,
      email: req.body.email 
    });

    const { firebaseToken, email } = req.body;

    if (!firebaseToken || !email) {
      console.error('Missing required fields:', { hasToken: !!firebaseToken, hasEmail: !!email });
      return res.status(400).json({ 
        success: false,
        message: 'Firebase token and email are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Verify the Firebase token
    let decodedToken;
    try {
      console.log('Verifying Firebase token...');
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log('Firebase token verified successfully, UID:', decodedToken.uid);
    } catch (tokenError) {
      console.error('Firebase token verification failed:', tokenError);
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token'
      });
    }
    
    // First try to find user by firebaseUid
    let userQuery = await admin.firestore()
      .collection('users')
      .where('firebaseUid', '==', decodedToken.uid)
      .limit(1)
      .get();

    // If not found by firebaseUid, try to find by email
    if (userQuery.empty) {
      userQuery = await admin.firestore()
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
    }

    let userDoc;
    let userData;

    if (userQuery.empty) {
      // User doesn't exist in Firestore, sync from Firebase Auth
      console.log(`Syncing user from Firebase Auth to Firestore for email: ${email}`);
      
      try {
        // Get user details from Firebase Auth
        const firebaseUser = await admin.auth().getUser(decodedToken.uid);
        
        // Determine role based on email domain or existing logic
        let role = 'student'; // default
        if (email.includes('@teacher.skillup')) {
          role = 'teacher';
        } else if (email.includes('@admin.skillup') || email.includes('skillup-admin')) {
          role = 'admin';
        }
        
        const newUserData = {
          email: firebaseUser.email || email,
          firebaseUid: decodedToken.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          role: role,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Create user document in Firestore
        userDoc = await admin.firestore().collection('users').add(newUserData);
        userData = newUserData;
        
        console.log(`Synced user from Firebase Auth with ID: ${userDoc.id}, role: ${role}`);
      } catch (syncError) {
        console.error('Error syncing user from Firebase Auth:', syncError);
        // Fallback to basic user creation
        const fallbackUserData = {
          email: email,
          firebaseUid: decodedToken.uid,
          name: email.split('@')[0],
          role: 'student',
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        userDoc = await admin.firestore().collection('users').add(fallbackUserData);
        userData = fallbackUserData;
        console.log(`Created fallback user with ID: ${userDoc.id}`);
      }
    } else {
      // User exists, update firebaseUid if needed
      userDoc = userQuery.docs[0];
      userData = userDoc.data();
      
      // If user doesn't have firebaseUid, update it
      if (!userData.firebaseUid) {
        await userDoc.ref.update({
          firebaseUid: decodedToken.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        userData.firebaseUid = decodedToken.uid;
      }
    }

    // Validate user data before creating token
    if (!userData || !userData.role || !userData.email) {
      console.error('Invalid user data after creation/retrieval:', userData);
      return res.status(500).json({
        success: false,
        message: 'User data validation failed'
      });
    }

    // Instead of creating a custom token (which requires special permissions),
    // we'll return the user data and let the frontend handle authentication state
    // The Firebase ID token is already verified, so we can trust the user is authenticated
    
    console.log('Login successful for user:', { 
      uid: decodedToken.uid, 
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
      // Return the original Firebase ID token instead of a custom token
      token: firebaseToken
    });
  } catch (error) {
    console.error('Error in firebase-login:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return res.status(500).json({ 
      success: false,
      message: 'Login failed: ' + (error instanceof Error ? error.message : 'Unknown error')
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

// Admin route to sync all Firebase Auth users to Firestore
router.post('/sync-users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This should be protected by admin role, but for now allowing it
    console.log('Starting Firebase Auth to Firestore user sync...');
    
    // Get all users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers();
    const firebaseUsers = listUsersResult.users;
    
    console.log(`Found ${firebaseUsers.length} users in Firebase Auth`);
    
    const syncResults = [];
    
    for (const firebaseUser of firebaseUsers) {
      try {
        // Check if user already exists in Firestore
        const existingUserQuery = await admin.firestore()
          .collection('users')
          .where('firebaseUid', '==', firebaseUser.uid)
          .limit(1)
          .get();
        
        if (existingUserQuery.empty) {
          // User doesn't exist in Firestore, create them
          let role = 'student'; // default
          if (firebaseUser.email?.includes('@teacher.skillup')) {
            role = 'teacher';
          } else if (firebaseUser.email?.includes('@admin.skillup') || firebaseUser.email?.includes('skillup-admin')) {
            role = 'admin';
          }
          
          const newUserData = {
            email: firebaseUser.email || '',
            firebaseUid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown',
            role: role,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          const userDoc = await admin.firestore().collection('users').add(newUserData);
          
          syncResults.push({
            email: firebaseUser.email,
            action: 'created',
            userId: userDoc.id,
            role: role
          });
          
          console.log(`Created user in Firestore: ${firebaseUser.email} (${role})`);
        } else {
          // User exists, update if needed
          const existingUser = existingUserQuery.docs[0];
          const existingData = existingUser.data();
          
          if (!existingData.firebaseUid) {
            await existingUser.ref.update({
              firebaseUid: firebaseUser.uid,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            syncResults.push({
              email: firebaseUser.email,
              action: 'updated',
              userId: existingUser.id
            });
            
            console.log(`Updated existing user: ${firebaseUser.email}`);
          } else {
            syncResults.push({
              email: firebaseUser.email,
              action: 'already_synced',
              userId: existingUser.id
            });
          }
        }
      } catch (userError) {
        console.error(`Error syncing user ${firebaseUser.email}:`, userError);
        syncResults.push({
          email: firebaseUser.email,
          action: 'error',
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }
    
    console.log('User sync completed');
    
    return res.json({
      success: true,
      message: `Synced ${firebaseUsers.length} users from Firebase Auth`,
      results: syncResults
    });
    
  } catch (error) {
    console.error('Error in user sync:', error);
    return res.status(500).json({
      success: false,
      message: 'User sync failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

export { router as authRouter }; 