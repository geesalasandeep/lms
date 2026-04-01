import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;

        // console.log('User ID:', userId);
        // Fetch notifications, sort by newest first, limit to latest 20
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        // Ensure user owns the notification
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};
