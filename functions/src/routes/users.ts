// functions/src/routes/users.ts - Users API Routes
import { type Response, Router } from 'express';
import * as admin from 'firebase-admin';
import type { Query, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { type AuthenticatedRequest, requireAdmin, verifyToken } from '../middleware/auth';

const router = Router();

// Get all users (with role-based filtering)
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📊 [Users API] Request started:', {
      method: req.method,
      url: req.url,
      query: req.query,
      hasUser: !!req.user,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });
    
    if (!req.user) {
      console.error('❌ [Users API] No user in request after auth middleware');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { role } = req.user;
    const { status } = req.query;

    console.log('📊 Users API request:', {
      role,
      status,
      statusType: typeof status,
      query: req.query
    });

    let query: Query<DocumentData> = admin.firestore().collection('users');

    // Role-based filtering
    if (role === 'admin' || role === 'teacher' || role === 'staff') {
      // Admin, teachers, and staff see all users
    } else if (role === 'student') {
      // Students see only themselves
      query = query.where('firebaseUid', '==', req.user.uid);
    }

    // Add status filtering if provided
    let statusArray: string[] = [];
    if (status) {
      console.log('🔍 [Users API] Status filtering input:', {
        status,
        type: typeof status,
        isArray: Array.isArray(status)
      });
      
      try {
        if (Array.isArray(status)) {
          // If status is already an array, filter out null/undefined values
          statusArray = status
            .filter(s => s != null && s !== '')
            .map(s => String(s).trim())
            .filter(s => s.length > 0);
        } else if (typeof status === 'string' && status.trim()) {
          // If status is a string, handle comma-separated values
          if (status.includes(',')) {
            statusArray = status
              .split(',')
              .map(s => s?.trim())
              .filter(s => s != null && s !== '' && s.length > 0);
          } else {
            statusArray = [status.trim()];
          }
        } else if (status != null) {
          // Handle other types by converting to string
          const statusStr = String(status).trim();
          if (statusStr.length > 0) {
            statusArray = [statusStr];
          }
        }
        
        if (statusArray.length === 0) {
          console.log('⚠️ [Users API] No valid status values found, skipping status filter');
        } else {
          console.log('🎯 [Users API] Status filter applied:', statusArray);
          
          if (statusArray.length === 1) {
            query = query.where('status', '==', statusArray[0]);
          } else {
            query = query.where('status', 'in', statusArray);
          }
        }
      } catch (statusError) {
        console.error('❌ [Users API] Error processing status filter:', statusError);
        // Continue without status filter if there's an error
        statusArray = [];
      }
    }

    // Execute query - avoid orderBy with status filtering until composite index is created
    let snapshot;
    try {
      if (status && statusArray && statusArray.length > 0) {
        // When filtering by status, don't use orderBy to avoid composite index requirement
        console.log('🔍 [Users API] Executing query without orderBy due to status filtering');
        snapshot = await query.get();
      } else {
        // Only use orderBy when not filtering by status
        console.log('🔍 [Users API] Executing query with orderBy (no status filter)');
        snapshot = await query.orderBy('createdAt', 'desc').get();
      }
    } catch (queryError) {
      console.warn('⚠️ [Users API] Query failed, trying simple query without orderBy:', queryError);
      // Fallback to simple query without any orderBy
      snapshot = await query.get();
    }

    const users = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      _id: doc.id, // Add both id and _id for compatibility
      ...doc.data(),
    }));

    // Sort users by createdAt in memory if we couldn't use orderBy
    if (status && statusArray && statusArray.length > 0) {
      users.sort((a, b) => {
        const aData = a as any;
        const bData = b as any;
        const aTime = aData.createdAt?.toDate?.() || new Date(0);
        const bTime = bData.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime(); // Descending order
      });
    }

    console.log(
      `✅ [Users API] Fetched ${users.length} users for role: ${role}${status ? ` with status: ${status}` : ''}`
    );
    return res.json(users);
  } catch (error) {
    console.error('❌ [Users API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      statusParam: req.query.status,
      userRole: req.user?.role,
      userUid: req.user?.uid
    });
    return res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register new user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      email, // This is now the Firebase email
      personalEmail, // This is the personal email (optional)
      role,
      gender,
      englishName,
      dob,
      phone,
      parentName,
      parentPhone,
      notes,
      status = 'potential',
      firebaseUid,
      username,
    } = req.body;

    // Check if user already exists with Firebase email
    const existingUser = await admin
      .firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({
        success: false,
        message: 'User with this Firebase email already exists',
      });
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await admin
        .firestore()
        .collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (!existingUsername.empty) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
      }
    }

    // Validate that firebaseUid is provided
    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required',
      });
    }

    let studentCode = null;

    // Generate student code for students
    if (role === 'student') {
      studentCode = await generateStudentCode();
    }

    // Create user in Firestore
    const userData = {
      username,
      name,
      email, // Firebase email for authentication
      personalEmail, // Personal email for contact (optional)
      role,
      gender,
      englishName,
      dob,
      phone,
      parentName,
      parentPhone,
      notes,
      studentCode,
      status,
      firebaseUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection('users').add(userData);
    const user = { id: docRef.id, ...userData };

    // If this is a student with status 'potential', also create a PotentialStudent record
    if (role === 'student' && status === 'potential') {
      try {
        const potentialStudentData = {
          name,
          englishName,
          email: personalEmail || email, // Use personal email if available, otherwise Firebase email
          phone,
          gender,
          dob,
          parentName,
          parentPhone,
          source: 'admin_registration',
          status: 'pending',
          notes: notes || `Created from registration form. Student Code: ${studentCode}`,
          assignedTo: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await admin.firestore().collection('potentialStudents').add(potentialStudentData);
        console.log(`Created PotentialStudent record for user: ${docRef.id}`);
      } catch (potentialStudentError) {
        console.error('Error creating PotentialStudent record:', potentialStudentError);
        // Don't fail the user creation if PotentialStudent creation fails
      }
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { id } = req.params;
    const { role } = req.user;

    // Students can only see themselves
    if (role === 'student' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const doc = await admin.firestore().collection('users').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { id } = req.params;
    const { role } = req.user;
    const updateData = req.body;

    // Students can only update themselves
    if (role === 'student' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get current user data to check for email changes
    const currentUserDoc = await admin.firestore().collection('users').doc(id).get();
    if (!currentUserDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserData = currentUserDoc.data();
    if (!currentUserData) {
      return res.status(404).json({ message: 'User data not found' });
    }
    
    const newEmail = updateData.email;
    const currentEmail = currentUserData.email;

    // Prepare Firebase Auth update data
    const authUpdateData: Record<string, string> = {};

    // If email is being changed, update Firebase Auth as well
    if (newEmail && newEmail !== currentEmail) {
      try {
        // Check if new email already exists
        const emailCheck = await admin
          .firestore()
          .collection('users')
          .where('email', '==', newEmail)
          .where('firebaseUid', '!=', currentUserData.firebaseUid)
          .limit(1)
          .get();

        if (!emailCheck.empty) {
          return res.status(400).json({ message: 'Email already exists' });
        }

        authUpdateData.email = newEmail;
        console.log(`Email change detected for user ${id}: ${currentEmail} → ${newEmail}`);
      } catch (authError: unknown) {
        const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
        console.error('Error checking email uniqueness:', authError);
        return res.status(500).json({
          message: 'Failed to verify email uniqueness',
          error: errorMessage,
        });
      }
    }

    // If display name is being changed, update Firebase Auth as well
    if (updateData.name && updateData.name !== currentUserData.name) {
      authUpdateData.displayName = updateData.name;
      console.log(
        `Display name change detected for user ${id}: ${currentUserData.name} → ${updateData.name}`
      );
    }

    // If username is being changed, update Firebase Auth custom claims
    if (updateData.username && updateData.username !== currentUserData.username) {
      try {
        // Check if username already exists
        const usernameCheck = await admin
          .firestore()
          .collection('users')
          .where('username', '==', updateData.username)
          .where('firebaseUid', '!=', currentUserData.firebaseUid)
          .limit(1)
          .get();

        if (!usernameCheck.empty) {
          return res.status(400).json({ message: 'Username already exists' });
        }

        // Update custom claims with new username
        if (currentUserData.firebaseUid) {
          const customClaims = {
            username: updateData.username,
            role: currentUserData.role,
          };
          await admin.auth().setCustomUserClaims(currentUserData.firebaseUid, customClaims);
          console.log(
            `Updated Firebase Auth custom claims for user ${id} with username: ${updateData.username}`
          );
        }
      } catch (authError: unknown) {
        const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
        console.error('Error updating Firebase Auth custom claims:', authError);
        return res.status(500).json({
          message: 'Failed to update username in authentication system',
          error: errorMessage,
        });
      }
    }

    // Update Firebase Auth user if there are changes
    if (Object.keys(authUpdateData).length > 0 && currentUserData.firebaseUid) {
      try {
        await admin.auth().updateUser(currentUserData.firebaseUid, authUpdateData);
        console.log(`Updated Firebase Auth for user ${id}:`, authUpdateData);
      } catch (authError: unknown) {
        const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
        console.error('Error updating Firebase Auth user:', authError);
        return res.status(500).json({
          message: 'Failed to update user in authentication system',
          error: errorMessage,
        });
      }
    }

    // Remove sensitive fields that shouldn't be updated
    delete updateData.firebaseUid;
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('users').doc(id).update(updateData);

    console.log(`Updated user ${id} with data:`, updateData);
    return res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Get user data before deletion to remove from Firebase Auth
      const userDoc = await admin.firestore().collection('users').doc(id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      if (!userData) {
        return res.status(404).json({ message: 'User data not found' });
      }

      // Delete from Firestore first
      await admin.firestore().collection('users').doc(id).delete();

      // Delete from Firebase Auth if firebaseUid exists
      if (userData.firebaseUid) {
        try {
          await admin.auth().deleteUser(userData.firebaseUid);
          console.log(`Deleted Firebase Auth user: ${userData.firebaseUid}`);
        } catch (authError: unknown) {
          const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
          console.error('Error deleting Firebase Auth user:', authError);
          // Don't fail the request if Auth deletion fails, but log it
          console.warn(
            `Firebase Auth user ${userData.firebaseUid} could not be deleted:`,
            errorMessage
          );
        }
      }

      console.log(`Deleted user ${id} from Firestore and Firebase Auth`);
      return res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  }
);

// Check if email exists
router.get('/check-email/:email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const snapshot = await admin
      .firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    return res.json({ exists: !snapshot.empty });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ exists: false });
  }
});

// Check if username exists
router.get('/check-username/:username', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const snapshot = await admin
      .firestore()
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    return res.json({ exists: !snapshot.empty });
  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ exists: false });
  }
});

// Sync existing students with potential status to PotentialStudents collection
router.post('/sync-potential-students', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Find all users with potential or contacted status
    const snapshot = await admin
      .firestore()
      .collection('users')
      .where('status', 'in', ['potential', 'contacted'])
      .get();

    let created = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      // Check if PotentialStudent record already exists
      const existingPotentialStudent = await admin
        .firestore()
        .collection('potentialStudents')
        .where('email', '==', userData.email)
        .limit(1)
        .get();

      if (existingPotentialStudent.empty) {
        // Create new PotentialStudent record
        const potentialStudentData = {
          name: userData.name,
          englishName: userData.englishName,
          email: userData.email,
          phone: userData.phone,
          gender: userData.gender,
          dob: userData.dob,
          parentName: userData.parentName,
          parentPhone: userData.parentPhone,
          source: 'sync_existing_users',
          status: 'pending',
          notes: userData.notes || `Synced from existing user. Student Code: ${userData.studentCode}`,
          assignedTo: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await admin.firestore().collection('potentialStudents').add(potentialStudentData);
        created++;
        console.log(`Created PotentialStudent record for user: ${doc.id}`);
      } else {
        skipped++;
        console.log(`PotentialStudent record already exists for user: ${doc.id}`);
      }
    }

    return res.json({
      success: true,
      message: 'Sync completed successfully',
      created,
      skipped,
      total: snapshot.size,
    });
  } catch (error) {
    console.error('Error syncing potential students:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync potential students',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Change user password
router.put(
  '/:id/password',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Get user data to find firebaseUid
      const userDoc = await admin.firestore().collection('users').doc(id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      if (!userData) {
        return res.status(404).json({ message: 'User data not found' });
      }

      if (!userData.firebaseUid) {
        return res.status(400).json({ message: 'User has no Firebase Auth account' });
      }

      // Update password in Firebase Auth
      await admin.auth().updateUser(userData.firebaseUid, {
        password: newPassword,
      });

      console.log(`Password updated for Firebase Auth user: ${userData.firebaseUid}`);
      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ message: 'Failed to update password' });
    }
  }
);

// Update user avatar
router.post('/:id/avatar', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { id } = req.params;
    const { role } = req.user;
    
    // Students can only update their own avatar
    if (role === 'student' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For now, we'll handle the avatar URL from the request body
    // In a full implementation, this would handle file upload to Firebase Storage
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    // Update the user's avatar in Firestore
    await admin.firestore().collection('users').doc(id).update({
      avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Updated avatar for user ${id}: ${avatarUrl}`);
    
    return res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatarUrl,
      userId: id,
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Remove user avatar
router.delete('/:id/avatar', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await admin.firestore().collection('users').doc(id).update({ avatarUrl: null });
    return res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return res.status(500).json({ message: 'Failed to remove avatar' });
  }
});



// Helper function to generate student code with gap filling (STU-001, STU-002, etc.)
async function generateStudentCode(): Promise<string> {
  // Find all existing student codes (STU-001, STU-002, etc.)
  const snapshot = await admin
    .firestore()
    .collection('users')
    .where('studentCode', '>=', 'STU-001')
    .where('studentCode', '<=', 'STU-999')
    .orderBy('studentCode', 'asc')
    .get();

  let nextNumber = 1;
  
  if (!snapshot.empty) {
    const existingCodes = snapshot.docs.map(doc => doc.data().studentCode).sort();
    console.log('Existing student codes:', existingCodes);
    
    // Find the first missing number in the sequence
    let expectedNumber = 1;
    for (const existingCode of existingCodes) {
      const existingNumber = parseInt(existingCode.slice(-3));
      if (existingNumber === expectedNumber) {
        expectedNumber++;
      } else {
        // Found a gap, use this number
        nextNumber = expectedNumber;
        console.log(`Found gap in student code sequence, using number: ${nextNumber}`);
        break;
      }
    }
    
    // If no gaps found, use the next number after the highest existing
    if (nextNumber === 1) {
      const highestCode = existingCodes[existingCodes.length - 1];
      const highestNumber = parseInt(highestCode.slice(-3));
      nextNumber = highestNumber + 1;
      console.log(`No gaps found in student codes, incrementing from highest: ${highestNumber} -> ${nextNumber}`);
    }
  } else {
    console.log('No existing student codes, starting with STU-001');
  }

  const studentCode = `STU-${nextNumber.toString().padStart(3, '0')}`;
  console.log(`Generated student code: ${studentCode}`);
  return studentCode;
}

export { router as usersRouter };
