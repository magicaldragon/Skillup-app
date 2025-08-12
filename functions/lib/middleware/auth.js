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