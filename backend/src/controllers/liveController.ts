import { Request, Response } from 'express';
import LiveSession from '../models/LiveSession';
import User from '../models/User';
import Notification from '../models/Notification';
import Course from '../models/Course';
import webpush from 'web-push';
import { sendEmail } from '../utils/mailer';

// Configure Web Push (In production, replace with real VAPID keys)
// Run `./node_modules/.bin/web-push generate-vapid-keys` to get keys locally
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BM_dummy_public_key_replace_me';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'dummy_private_key_replace_me';

try {
    webpush.setVapidDetails('mailto:admin@learnstream.com', publicVapidKey, privateVapidKey);
} catch (e) {
    console.log('WebPush not configured properly yet.',);
}

// In-memory subscription store for dev (Use DB in prod)
const subscriptions: any[] = [];

export const subscribeNotification = (req: Request, res: Response): void => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
};

export const createLiveSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId, title, startTime } = req.body;
        const roomId = `room_${Date.now()}`;

        const session = new LiveSession({ courseId, title, startTime, roomId, status: 'scheduled' });
        await session.save();

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create live session' });
    }
};

export const startLiveSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const session = await LiveSession.findByIdAndUpdate(id, { status: 'live' }, { new: true });

        // Simulate Notification
        const payload = JSON.stringify({ title: 'Live Session Started!', body: `${session?.title} is now live.` });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error'));
        });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start live session' });
    }
};

export const notifyStudentsLive = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.body;

        let courseTitle = 'LMS Antigravity';
        let query: any = { role: 'Student' };

        if (courseId) {
            const course = await Course.findById(courseId);
            if (course) courseTitle = course.title;
            query = { role: 'Student', 'enrolledCourses.courseId': courseId };
        }

        // Fetch scoped students
        const students = await User.find(query, 'email name');

        if (!students || students.length === 0) {
            res.status(404).json({ message: 'No students found to notify' });
            return;
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>🔴 Live Session is Starting!</h2>
                <p>Hello Student,</p>
                <p>A live session for <strong>${courseTitle}</strong> is about to start right now.</p>
                <p>Please log into your LMS dashboard and join the Live stream to participate.</p>
                <br/>
                <p>See you there!</p>
                <p><strong>LMS Antigravity Team</strong></p>
            </div>
        `;

        // Dispatch emails to all students concurrently
        const emailPromises = students.map(student =>
            sendEmail(student.email, '🔴 Live Session is Starting!', emailHtml)
                .catch(err => console.error('Failed to notify student:', student.email))
        );

        // Bulk insert DB Notifications
        const dbNotifications = students.map(student => ({
            userId: student._id,
            title: 'Live Session Started!',
            message: 'A live session is broadcasting right now. Click here to join.',
            link: `/live?courseId=${courseId || ''}`,
            isRead: false
        }));

        await Promise.all([
            ...emailPromises,
            Notification.insertMany(dbNotifications).catch(err => console.error('Failed inserting DB notifs:', err))
        ]);

        res.status(200).json({ message: `Successfully notified ${students.length} students` });
    } catch (error) {
        console.error('Error notifying students:', error);
        res.status(500).json({ error: 'Failed to notify students' });
    }
};

export const getLiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessions = await LiveSession.find({ status: { $in: ['scheduled', 'live'] } }).populate('courseId', 'title');
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};
