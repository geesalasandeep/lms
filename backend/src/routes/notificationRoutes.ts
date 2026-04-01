import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.put('/:id/read', authenticate, markAsRead);

export default router;
