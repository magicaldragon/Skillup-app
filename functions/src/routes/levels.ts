// functions/src/routes/levels.ts - Levels API Routes
import { type Response, Router } from 'express';
import * as admin from 'firebase-admin';
import { type AuthenticatedRequest, requireAdmin, verifyToken } from '../middleware/auth';

const router = Router();

// Get all levels
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isActive } = req.query;

    let query: any = admin.firestore().collection('levels');

    // Add filter if provided
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query.orderBy('order', 'asc').get();
    const levels = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${levels.length} levels`);
    return res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return res.status(500).json({ message: 'Failed to fetch levels' });
  }
});

// Create new level
router.post('/', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, order, isActive = true } = req.body;

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
      order: levelOrder,
      isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection('levels').add(levelData);
    const newLevel = { id: docRef.id, ...levelData };

    return res.status(201).json({
      success: true,
      message: 'Level created successfully',
      level: newLevel,
    });
  } catch (error) {
    console.error('Error creating level:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create level',
    });
  }
});

// Get level by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await admin.firestore().collection('levels').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Level not found' });
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching level:', error);
    return res.status(500).json({ message: 'Failed to fetch level' });
  }
});

// Update level
router.put('/:id', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

    return res.json({ success: true, message: 'Level updated successfully' });
  } catch (error) {
    console.error('Error updating level:', error);
    return res.status(500).json({ message: 'Failed to update level' });
  }
});

// Delete level
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('Error deleting level:', error);
      return res.status(500).json({ message: 'Failed to delete level' });
    }
  }
);

// Reorder levels
router.post(
  '/reorder',
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('Error reordering levels:', error);
      return res.status(500).json({ message: 'Failed to reorder levels' });
    }
  }
);

export { router as levelsRouter };
