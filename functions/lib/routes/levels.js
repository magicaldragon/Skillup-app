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
exports.levelsRouter = void 0;
// functions/src/routes/levels.ts - Levels API Routes
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.levelsRouter = router;
// Get all levels
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { isActive } = req.query;
        let query = admin.firestore().collection('levels');
        // Add filter if provided
        if (isActive !== undefined) {
            query = query.where('isActive', '==', isActive === 'true');
        }
        const snapshot = await query.orderBy('order', 'asc').get();
        const levels = snapshot.docs.map((doc) => (Object.assign({ _id: doc.id, id: doc.id }, doc.data())));
        console.log(`Fetched ${levels.length} levels`);
        return res.json({
            success: true,
            levels: levels
        });
    }
    catch (error) {
        console.error('Error fetching levels:', error);
        return res.status(500).json({ message: 'Failed to fetch levels' });
    }
});
// Create new level
router.post('/', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, description, code, order, isActive = true } = req.body;
        // Check if level name already exists
        const existingLevel = await admin
            .firestore()
            .collection('levels')
            .where('name', '==', name)
            .limit(1)
            .get();
        if (!existingLevel.empty) {
            return res.status(400).json({
                success: false,
                message: 'Level with this name already exists',
            });
        }
        // Check if level code already exists
        if (code) {
            const existingCode = await admin
                .firestore()
                .collection('levels')
                .where('code', '==', code)
                .limit(1)
                .get();
            if (!existingCode.empty) {
                return res.status(400).json({
                    success: false,
                    message: 'Level with this code already exists',
                });
            }
        }
        // If order is not provided, get the next order number
        let levelOrder = order;
        if (!levelOrder) {
            const lastLevel = await admin
                .firestore()
                .collection('levels')
                .orderBy('order', 'desc')
                .limit(1)
                .get();
            levelOrder = lastLevel.empty ? 1 : lastLevel.docs[0].data().order + 1;
        }
        // Create level in Firestore
        const levelData = {
            name,
            description,
            code: code || '',
            order: levelOrder,
            isActive,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await admin.firestore().collection('levels').add(levelData);
        const newLevel = Object.assign({ id: docRef.id, _id: docRef.id }, levelData);
        return res.status(201).json({
            success: true,
            message: 'Level created successfully',
            level: newLevel,
        });
    }
    catch (error) {
        console.error('Error creating level:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create level',
        });
    }
});
// Seed levels with predefined data
router.post('/seed', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
    try {
        // Predefined levels from constants
        const predefinedLevels = [
            {
                name: 'STARTERS (PRE)',
                description: 'Cambridge English Qualifications Pre A1 Starters.',
                code: 'PRE',
                order: 1,
                isActive: true,
            },
            {
                name: 'MOVERS (A1)',
                description: 'Cambridge English Qualifications A1 Movers.',
                code: 'A1',
                order: 2,
                isActive: true,
            },
            {
                name: 'FLYERS (A2A)',
                description: 'Cambridge English Qualifications A2 Flyers.',
                code: 'A2A',
                order: 3,
                isActive: true,
            },
            {
                name: 'KET (A2B)',
                description: 'Cambridge English Qualifications A2 Key for Schools.',
                code: 'A2B',
                order: 4,
                isActive: true,
            },
            {
                name: 'PET (B1)',
                description: 'Cambridge English Qualifications B1 Preliminary for Schools.',
                code: 'B1',
                order: 5,
                isActive: true,
            },
            {
                name: 'PRE-IELTS (B2PRE)',
                description: 'Foundation for IELTS.',
                code: 'B2PRE',
                order: 6,
                isActive: true,
            },
            {
                name: 'IELTS',
                description: 'International English Language Testing System.',
                code: 'I',
                order: 7,
                isActive: true,
            },
        ];
        let created = 0;
        let skipped = 0;
        for (const levelData of predefinedLevels) {
            try {
                // Check if level already exists by name
                const existingLevel = await admin
                    .firestore()
                    .collection('levels')
                    .where('name', '==', levelData.name)
                    .limit(1)
                    .get();
                if (!existingLevel.empty) {
                    console.log(`Level "${levelData.name}" already exists, skipping...`);
                    skipped++;
                    continue;
                }
                // Create level in Firestore
                const newLevelData = Object.assign(Object.assign({}, levelData), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                await admin.firestore().collection('levels').add(newLevelData);
                console.log(`Created level: ${levelData.name}`);
                created++;
            }
            catch (error) {
                console.error(`Error creating level ${levelData.name}:`, error);
            }
        }
        return res.json({
            success: true,
            message: 'Levels seeding completed',
            created,
            skipped,
            total: predefinedLevels.length,
        });
    }
    catch (error) {
        console.error('Error seeding levels:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to seed levels',
        });
    }
});
// Get level by ID
router.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await admin.firestore().collection('levels').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Level not found' });
        }
        return res.json(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (error) {
        console.error('Error fetching level:', error);
        return res.status(500).json({ message: 'Failed to fetch level' });
    }
});
// Update level
router.put('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Remove fields that shouldn't be updated
        delete updateData.createdAt;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        // Check if name already exists (if name is being updated)
        if (updateData.name) {
            const existingLevel = await admin
                .firestore()
                .collection('levels')
                .where('name', '==', updateData.name)
                .where(admin.firestore.FieldPath.documentId(), '!=', id)
                .limit(1)
                .get();
            if (!existingLevel.empty) {
                return res.status(400).json({
                    success: false,
                    message: 'Level with this name already exists',
                });
            }
        }
        await admin.firestore().collection('levels').doc(id).update(updateData);
        // Get the updated level data
        const updatedDoc = await admin.firestore().collection('levels').doc(id).get();
        const updatedLevel = Object.assign({ id: updatedDoc.id, _id: updatedDoc.id }, updatedDoc.data());
        return res.json({
            success: true,
            message: 'Level updated successfully',
            level: updatedLevel
        });
    }
    catch (error) {
        console.error('Error updating level:', error);
        return res.status(500).json({ message: 'Failed to update level' });
    }
});
// Delete level
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if level is being used by any classes
        const classesUsingLevel = await admin
            .firestore()
            .collection('classes')
            .where('levelId', '==', id)
            .limit(1)
            .get();
        if (!classesUsingLevel.empty) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete level that is being used by classes',
            });
        }
        await admin.firestore().collection('levels').doc(id).delete();
        return res.json({ success: true, message: 'Level deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting level:', error);
        return res.status(500).json({ message: 'Failed to delete level' });
    }
});
// Reorder levels
router.post('/reorder', auth_1.verifyToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { levelOrders } = req.body; // Array of { id, order }
        if (!Array.isArray(levelOrders)) {
            return res.status(400).json({
                success: false,
                message: 'levelOrders must be an array',
            });
        }
        const batch = admin.firestore().batch();
        for (const { id, order } of levelOrders) {
            const levelRef = admin.firestore().collection('levels').doc(id);
            batch.update(levelRef, {
                order,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        return res.json({ success: true, message: 'Levels reordered successfully' });
    }
    catch (error) {
        console.error('Error reordering levels:', error);
        return res.status(500).json({ message: 'Failed to reorder levels' });
    }
});
//# sourceMappingURL=levels.js.map