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
        let decodedToken;
        let userData;
        try {
            // First try to verify as Firebase ID token
            decodedToken = await admin.auth().verifyIdToken(token);
            // Get user data from Firestore by firebaseUid
            const userQuery = await admin.firestore()
                .collection('users')
                .where('firebaseUid', '==', decodedToken.uid)
                .limit(1)
                .get();
            if (userQuery.empty) {
                res.status(401).json({
                    success: false,
                    message: 'User not found in database'
                });
                return;
            }
            userData = userQuery.docs[0].data();
        }
        catch (firebaseError) {
            // If Firebase ID token verification fails, try as custom token
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
                // For custom tokens, we need to extract user info from the token
                const userQuery = await admin.firestore()
                    .collection('users')
                    .where('firebaseUid', '==', decodedToken.uid)
                    .limit(1)
                    .get();
                if (userQuery.empty) {
                    res.status(401).json({
                        success: false,
                        message: 'User not found in database'
                    });
                    return;
                }
                userData = userQuery.docs[0].data();
            }
            catch (customError) {
                console.error('Both token verification methods failed:', { firebaseError, customError });
                res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
                return;
            }
        }
        if (!decodedToken || !userData) {
            res.status(401).json({
                success: false,
                message: 'Token verification failed'
            });
            return;
        }
        // Add user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || userData.email || '',
            role: userData.role || 'student',
            userId: userData._id || userData.id || ''
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
exports.verifyToken = verifyToken;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireTeacher = (0, exports.requireRole)(['admin', 'teacher']);
exports.requireStaff = (0, exports.requireRole)(['admin', 'teacher', 'staff']);
//# sourceMappingURL=auth.js.map