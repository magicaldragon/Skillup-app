"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
// functions/src/routes/users.ts - Users API Routes
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.usersRouter = router;
// Get all users (with role-based filtering)
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { role } = req.user;
        const { status } = req.query;
        let query = admin.firestore().collection('users');
        // Role-based filtering
        if (role === 'admin' || role === 'teacher' || role === 'staff') {
            // Admin, teachers, and staff see all users
        }
        else if (role === 'student') {
            // Students see only themselves
            query = query.where('firebaseUid', '==', req.user.uid);
        }
        // Add status filtering if provided
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            query = query.where('status', 'in', statusArray);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const users = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        console.log(`Fetched ${users.length} users for role: ${role}${status ? ` with status: ${status}` : ''}`);
        return res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
});
// Register new user
router.post('/', async (req, res) => {
    try {
        const { name, email, role, gender, englishName, dob, phone, parentName, parentPhone, notes, status = 'potential', firebaseUid, username, } = req.body;
        // Check if user already exists
        const existingUser = await admin
            .firestore()
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        if (!existingUser.empty) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
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
            email,
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
        const user = Object.assign({ id: docRef.id }, userData);
        // If this is a student with status 'potential', also create a PotentialStudent record
        if (role === 'student' && status === 'potential') {
            try {
                const potentialStudentData = {
                    name,
                    englishName,
                    email,
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
            }
            catch (potentialStudentError) {
                console.error('Error creating PotentialStudent record:', potentialStudentError);
                // Don't fail the user creation if PotentialStudent creation fails
            }
        }
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user,
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create user',
        });
    }
});
// Get user by ID
router.get('/:id', auth_1.verifyToken, async (req, res) => {
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
        return res.json(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Failed to fetch user' });
    }
});
// Update user
router.put('/:id', auth_1.verifyToken, async (req, res) => {
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
        const authUpdateData = {};
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
            }
            catch (authError) {
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
            console.log(`Display name change detected for user ${id}: ${currentUserData.name} → ${updateData.name}`);
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
                    console.log(`Updated Firebase Auth custom claims for user ${id} with username: ${updateData.username}`);
                }
            }
            catch (authError) {
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
            }
            catch (authError) {
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
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Failed to update user' });
    }
});
// Delete user
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
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
            }
            catch (authError) {
                const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
                console.error('Error deleting Firebase Auth user:', authError);
                // Don't fail the request if Auth deletion fails, but log it
                console.warn(`Firebase Auth user ${userData.firebaseUid} could not be deleted:`, errorMessage);
            }
        }
        console.log(`Deleted user ${id} from Firestore and Firebase Auth`);
        return res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Failed to delete user' });
    }
});
// Check if email exists
router.get('/check-email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const snapshot = await admin
            .firestore()
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        return res.json({ exists: !snapshot.empty });
    }
    catch (error) {
        console.error('Error checking email:', error);
        return res.status(500).json({ exists: false });
    }
});
// Check if username exists
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const snapshot = await admin
            .firestore()
            .collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();
        return res.json({ exists: !snapshot.empty });
    }
    catch (error) {
        console.error('Error checking username:', error);
        return res.status(500).json({ exists: false });
    }
});
// Change user password
router.put('/:id/password', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'Failed to update password' });
    }
});
// Update user avatar
router.post('/:id/avatar', auth_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // This would typically handle file upload to Firebase Storage
        // For now, we'll just return a success message with the user ID
        return res.json({
            message: 'Avatar updated successfully',
            avatarUrl: 'placeholder-url',
            userId: id,
        });
    }
    catch (error) {
        console.error('Error updating avatar:', error);
        return res.status(500).json({ message: 'Failed to update avatar' });
    }
});
// Remove user avatar
router.delete('/:id/avatar', auth_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await admin.firestore().collection('users').doc(id).update({ avatarUrl: null });
        return res.json({ message: 'Avatar removed successfully' });
    }
    catch (error) {
        console.error('Error removing avatar:', error);
        return res.status(500).json({ message: 'Failed to remove avatar' });
    }
});
// Helper function to generate student code
async function generateStudentCode() {
    const year = new Date().getFullYear().toString().slice(-2);
    const snapshot = await admin
        .firestore()
        .collection('users')
        .where('studentCode', '>=', `STU${year}0001`)
        .where('studentCode', '<=', `STU${year}9999`)
        .orderBy('studentCode', 'desc')
        .limit(1)
        .get();
    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastCode = snapshot.docs[0].data().studentCode;
        const lastNumber = parseInt(lastCode.slice(-4));
        nextNumber = lastNumber + 1;
    }
    return `STU${year}${nextNumber.toString().padStart(4, '0')}`;
}
//# sourceMappingURL=users.js.map