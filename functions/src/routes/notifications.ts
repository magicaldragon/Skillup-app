// functions/src/routes/notifications.ts - Notifications API Routes
import { type Response, Router } from 'express';
import * as admin from 'firebase-admin';
import { type AuthenticatedRequest, verifyToken } from '../middleware/auth';

const router = Router();

// Get all notifications for the current user
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Try to get notifications with error handling for missing index
    try {
      const snapshot = await admin
        .firestore()
        .collection('notifications')
        .where('userId', '==', req.user.userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const notifications = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));

      return res.json({
        success: true,
        notifications,
      });
    } catch (indexError) {
      console.warn('Composite index not available, falling back to simple query:', indexError);
      
      // Fallback: Get notifications without ordering (requires less complex index)
      const snapshot = await admin
        .firestore()
        .collection('notifications')
        .where('userId', '==', req.user.userId)
        .limit(50)
        .get();

      const notifications = snapshot.docs
        .map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          // Manual sorting by createdAt if available
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bTime.getTime() - aTime.getTime();
        });

      return res.json({
        success: true,
        notifications,
      });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { id } = req.params;
    const notificationRef = admin.firestore().collection('notifications').doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify the notification belongs to the current user
    const notificationData = notificationDoc.data();
    if (notificationData?.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await notificationRef.update({
      isRead: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
});

// Mark all notifications as read for the current user
router.patch('/mark-all-read', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const batch = admin.firestore().batch();
    const notificationsSnapshot = await admin
      .firestore()
      .collection('notifications')
      .where('userId', '==', req.user.userId)
      .where('isRead', '==', false)
      .get();

    notificationsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
});

// Create notification (internal use - called by other services)
export const createNotification = async (
  userId: string,
  type: 'student_report' | 'class_assignment' | 'system_alert',
  title: string,
  message: string,
  relatedId?: string
) => {
  try {
    const notificationData = {
      userId,
      type,
      title,
      message,
      isRead: false,
      relatedId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('notifications').add(notificationData);
    console.log(`Notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export { router as notificationsRouter }; 