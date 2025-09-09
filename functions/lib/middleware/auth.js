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
exports.requireStaff = exports.requireTeacher = exports.requireAdmin = exports.requireRole = exports.verifyToken = void 0;
const admin = __importStar(require("firebase-admin"));
const verifyToken = async (req, res, next) => {
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
                decodedToken = { uid: sessionData.uid, email: sessionData.email };
                console.log('Session token verified successfully for user:', sessionData.email);
            }
            catch (sessionError) {
                // If session token fails, try Firebase ID token
                console.log('Session token failed, trying Firebase ID token verification');
                try {
                    decodedToken = await admin.auth().verifyIdToken(token);
                    console.log('Firebase ID token verified successfully for UID:', decodedToken.uid);
                }
                catch (firebaseError) {
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
        }
        catch (tokenError) {
            console.error('Token verification failed:', tokenError);
            // Provide more specific error messages
            if (tokenError instanceof Error) {
                if (tokenError.message.includes('Token used too late')) {
                    res.status(401).json({
                        success: false,
                        message: 'Token has expired. Please log in again.',
                    });
                }
                else if (tokenError.message.includes('Invalid token')) {
                    res.status(401).json({
                        success: false,
                        message: 'Invalid authentication token. Please log in again.',
                    });
                }
                else {
                    res.status(401).json({
                        success: false,
                        message: 'Authentication failed. Please log in again.',
                    });
                }
            }
            else {
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
            userId: userData._id || userData.id || userData.firebaseUid || '',
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};
exports.verifyToken = verifyToken;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireTeacher = (0, exports.requireRole)(['admin', 'teacher']);
exports.requireStaff = (0, exports.requireRole)(['admin', 'teacher', 'staff']);
//# sourceMappingURL=auth.js.map