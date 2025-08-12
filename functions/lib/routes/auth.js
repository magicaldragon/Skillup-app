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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
// functions/src/routes/auth.ts - Authentication API Routes
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRouter = router;
// Get current user profile
router.get('/profile', auth_1.verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userData = userDoc.data();
        // Remove sensitive information
        const { firebaseUid } = userData, safeUserData = __rest(userData, ["firebaseUid"]);
        return res.json(Object.assign({ id: userDoc.id }, safeUserData));
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Failed to fetch user profile' });
    }
});
// Update user profile
router.put('/profile', auth_1.verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const updateData = req.body;
        // Remove fields that shouldn't be updated
        delete updateData.firebaseUid;
        delete updateData.role;
        delete updateData.createdAt;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await admin.firestore().collection('users').doc(userId).update(updateData);
        return res.json({ success: true, message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ message: 'Failed to update user profile' });
    }
});
// Verify Firebase token
router.post('/verify', async (req, res) => {
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
            user: Object.assign({ id: userDoc.id }, userData),
            customToken
        });
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
// Refresh user session
router.post('/refresh', auth_1.verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;
        // Get updated user data
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userData = userDoc.data();
        // Create a new custom token
        const customToken = await admin.auth().createCustomToken(userData.firebaseUid, {
            userId: userDoc.id,
            role: userData.role,
            email: userData.email
        });
        return res.json({
            success: true,
            message: 'Session refreshed successfully',
            user: Object.assign({ id: userDoc.id }, userData),
            customToken
        });
    }
    catch (error) {
        console.error('Error refreshing session:', error);
        return res.status(500).json({ message: 'Failed to refresh session' });
    }
});
// Logout (client-side token invalidation)
router.post('/logout', auth_1.verifyToken, async (_req, res) => {
    try {
        // Client-side logout - just return success
        // The actual token invalidation should be handled client-side
        res.json({
            success: true,
            message: 'Logout successful. Please clear your local storage.'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});
// Get user permissions
router.get('/permissions', auth_1.verifyToken, async (req, res) => {
    try {
        const { role } = req.user;
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
            permissions: permissions[role] || {}
        });
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        return res.status(500).json({ message: 'Failed to fetch permissions' });
    }
});
// Change password (requires Firebase Auth)
router.post('/change-password', auth_1.verifyToken, async (_req, res) => {
    try {
        // Password change should be handled client-side via Firebase Auth
        // This endpoint is a placeholder for future server-side password validation
        res.json({
            success: true,
            message: 'Password change should be handled via Firebase Auth client SDK'
        });
    }
    catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Password change failed'
        });
    }
});
//# sourceMappingURL=auth.js.map