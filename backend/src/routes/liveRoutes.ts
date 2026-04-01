import { Router } from 'express';
import { createLiveSession, startLiveSession, getLiveSessions, subscribeNotification, notifyStudentsLive } from '../controllers/liveController';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Notifications
router.post('/notifications/subscribe', subscribeNotification);

// Public / Student Live Sessions
router.get('/live', authenticate, getLiveSessions);

// Admin Routes
// Admin Routes
router.post('/live/notify-students', authenticate, authorizeAdmin, notifyStudentsLive);
router.post('/live', authenticate, authorizeAdmin, createLiveSession);
router.post('/live/:id/start', authenticate, authorizeAdmin, startLiveSession);

export default router;
