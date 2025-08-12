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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeLogs = exports.studentRecords = exports.potentialStudents = exports.submissions = exports.assignments = exports.levels = exports.classes = exports.users = exports.auth = exports.api = void 0;
// functions/src/index.ts - Firebase Functions Main Entry Point
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
// Initialize Firebase Admin
admin.initializeApp();
// Import routes
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const classes_1 = require("./routes/classes");
const levels_1 = require("./routes/levels");
const assignments_1 = require("./routes/assignments");
const submissions_1 = require("./routes/submissions");
const potentialStudents_1 = require("./routes/potentialStudents");
const studentRecords_1 = require("./routes/studentRecords");
const changeLogs_1 = require("./routes/changeLogs");
// Create Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://skillup-frontend-uvt6.onrender.com',
        'https://skillup-frontend.onrender.com',
        'https://skillup-3beaf.web.app',
        'https://skillup-3beaf.firebaseapp.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Compression middleware
app.use((0, compression_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Firebase Functions API is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// API routes
app.use('/auth', auth_1.authRouter);
app.use('/users', users_1.usersRouter);
app.use('/classes', classes_1.classesRouter);
app.use('/levels', levels_1.levelsRouter);
app.use('/assignments', assignments_1.assignmentsRouter);
app.use('/submissions', submissions_1.submissionsRouter);
app.use('/potential-students', potentialStudents_1.potentialStudentsRouter);
app.use('/student-records', studentRecords_1.studentRecordsRouter);
app.use('/change-logs', changeLogs_1.changeLogsRouter);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});
// Export the Express app as a Firebase Function
exports.api = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 540,
    memory: '256MB'
})
    .https.onRequest(app);
// Export individual functions for better performance
exports.auth = functions.region('us-central1').https.onRequest(auth_1.authRouter);
exports.users = functions.region('us-central1').https.onRequest(users_1.usersRouter);
exports.classes = functions.region('us-central1').https.onRequest(classes_1.classesRouter);
exports.levels = functions.region('us-central1').https.onRequest(levels_1.levelsRouter);
exports.assignments = functions.region('us-central1').https.onRequest(assignments_1.assignmentsRouter);
exports.submissions = functions.region('us-central1').https.onRequest(submissions_1.submissionsRouter);
exports.potentialStudents = functions.region('us-central1').https.onRequest(potentialStudents_1.potentialStudentsRouter);
exports.studentRecords = functions.region('us-central1').https.onRequest(studentRecords_1.studentRecordsRouter);
exports.changeLogs = functions.region('us-central1').https.onRequest(changeLogs_1.changeLogsRouter);
//# sourceMappingURL=index.js.map