// functions/src/routes/changeLogs.ts - Change Logs API Routes
import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all change logs (with role-based filtering)
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { entityType, entityId, action, userId, startDate, endDate } = req.query;
    
    let query: any = admin.firestore().collection('changeLogs');

    // Role-based filtering
    if (role === 'student') {
      // Students see only logs related to their own data
      query = query.where('entityId', '==', req.user!.userId);
    } else if (role === 'teacher') {
      // Teachers see logs for their classes and students
      const teacherClasses = await admin.firestore()
        .collection('classes')
        .where('teacherId', '==', req.user!.userId)
        .get();
      
      const classIds = teacherClasses.docs.map(doc => doc.id);
      
      if (classIds.length === 0) {
        return res.json([]);
      }
      
      // Get students in teacher's classes
      const studentsInClasses = await admin.firestore()
        .collection('users')
        .where('classIds', 'array-contains-any', classIds)
        .get();
      
      const studentIds = studentsInClasses.docs.map(doc => doc.id);
      const allowedEntityIds = [...classIds, ...studentIds];
      
      query = query.where('entityId', 'in', allowedEntityIds);
    }
    // Admin and staff see all logs

    // Add filters if provided
    if (entityType) {
      const entityTypeArray = Array.isArray(entityType) ? entityType : [entityType];
      query = query.where('entityType', 'in', entityTypeArray);
    }
    
    if (entityId && role !== 'student') {
      query = query.where('entityId', '==', entityId);
    }
    
    if (action) {
      const actionArray = Array.isArray(action) ? action : [action];
      query = query.where('action', 'in', actionArray);
    }
    
    if (userId && role !== 'student') {
      query = query.where('userId', '==', userId);
    }

    // Date filtering
    if (startDate) {
      query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate as string)));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate as string)));
    }

    const snapshot = await query.orderBy('timestamp', 'desc').get();
    const changeLogs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Fetched ${changeLogs.length} change logs for role: ${role}`);
    res.json(changeLogs);
  } catch (error) {
    console.error('Error fetching change logs:', error);
    res.status(500).json({ message: 'Failed to fetch change logs' });
  }
});

// Create new change log
router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      entityType, 
      entityId, 
      action, 
      details, 
      oldValues, 
      newValues 
    } = req.body;

    const userId = req.user!.userId;

    // Create change log in Firestore
    const changeLogData = {
      entityType,
      entityId,
      action,
      details,
      oldValues,
      newValues,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('changeLogs').add(changeLogData);
    const newChangeLog = { id: docRef.id, ...changeLogData };

    res.status(201).json({
      success: true,
      message: 'Change log created successfully',
      changeLog: newChangeLog
    });

  } catch (error) {
    console.error('Error creating change log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create change log'
    });
  }
});

// Get change log by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    const doc = await admin.firestore().collection('changeLogs').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Change log not found' });
    }

    const changeLogData = doc.data()!;

    // Check if user has access to this change log
    if (role === 'student' && changeLogData.entityId !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'teacher') {
      // Check if teacher has access to the entity
      const teacherClasses = await admin.firestore()
        .collection('classes')
        .where('teacherId', '==', req.user!.userId)
        .get();
      
      const classIds = teacherClasses.docs.map(doc => doc.id);
      
      if (changeLogData.entityType === 'class' && !classIds.includes(changeLogData.entityId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (changeLogData.entityType === 'user') {
        const userDoc = await admin.firestore().collection('users').doc(changeLogData.entityId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const userData = userDoc.data()!;
        const userClassIds = userData?.classIds || [];
        const hasAccess = classIds.some(classId => userClassIds.includes(classId));
        
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    return res.json({ id: doc.id, ...changeLogData });
  } catch (error) {
    console.error('Error fetching change log:', error);
    return res.status(500).json({ message: 'Failed to fetch change log' });
  }
});

// Get change logs for a specific entity
router.get('/entity/:entityType/:entityId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { role } = req.user!;

    // Check if user has access to this entity
    if (role === 'student' && entityType === 'user' && entityId !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'teacher') {
      if (entityType === 'class') {
        const classDoc = await admin.firestore().collection('classes').doc(entityId).get();
        if (!classDoc.exists || classDoc.data()?.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else if (entityType === 'user') {
        const userDoc = await admin.firestore().collection('users').doc(entityId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const userData = userDoc.data()!;
        const userClassIds = userData?.classIds || [];
        
        const teacherClasses = await admin.firestore()
          .collection('classes')
          .where('teacherId', '==', req.user!.userId)
          .get();
        
        const classIds = teacherClasses.docs.map(doc => doc.id);
        const hasAccess = classIds.some(classId => userClassIds.includes(classId));
        
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    const snapshot = await admin.firestore()
      .collection('changeLogs')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .orderBy('timestamp', 'desc')
      .get();

    const changeLogs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(changeLogs);
  } catch (error) {
    console.error('Error fetching entity change logs:', error);
    res.status(500).json({ message: 'Failed to fetch entity change logs' });
  }
});

// Delete change log (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await admin.firestore().collection('changeLogs').doc(id).delete();

    res.json({ success: true, message: 'Change log deleted successfully' });
  } catch (error) {
    console.error('Error deleting change log:', error);
    res.status(500).json({ message: 'Failed to delete change log' });
  }
});

// Get change logs summary (for dashboard)
router.get('/summary/dashboard', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    let query: any = admin.firestore()
      .collection('changeLogs')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate));

    // Role-based filtering
    if (role === 'student') {
      query = query.where('entityId', '==', req.user!.userId);
    } else if (role === 'teacher') {
      const teacherClasses = await admin.firestore()
        .collection('classes')
        .where('teacherId', '==', req.user!.userId)
        .get();
      
      const classIds = teacherClasses.docs.map(doc => doc.id);
      
      if (classIds.length === 0) {
        return res.json({
          totalChanges: 0,
          changesByAction: {},
          changesByEntityType: {},
          recentChanges: []
        });
      }
      
      const studentsInClasses = await admin.firestore()
        .collection('users')
        .where('classIds', 'array-contains-any', classIds)
        .get();
      
      const studentIds = studentsInClasses.docs.map(doc => doc.id);
      const allowedEntityIds = [...classIds, ...studentIds];
      
      query = query.where('entityId', 'in', allowedEntityIds);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').get();
    const changeLogs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate summary
    const changesByAction: { [key: string]: number } = {};
    const changesByEntityType: { [key: string]: number } = {};

    changeLogs.forEach((log: any) => {
      changesByAction[log.action] = (changesByAction[log.action] || 0) + 1;
      changesByEntityType[log.entityType] = (changesByEntityType[log.entityType] || 0) + 1;
    });

    const recentChanges = changeLogs.slice(0, 10); // Last 10 changes

    res.json({
      totalChanges: changeLogs.length,
      changesByAction,
      changesByEntityType,
      recentChanges
    });
  } catch (error) {
    console.error('Error fetching change logs summary:', error);
    res.status(500).json({ message: 'Failed to fetch change logs summary' });
  }
});

export { router as changeLogsRouter }; 