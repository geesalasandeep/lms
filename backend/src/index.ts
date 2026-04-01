import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

export const app = express();
export const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Routes
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import courseRoutes from './routes/courseRoutes';
import liveRoutes from './routes/liveRoutes';
import notificationRoutes from './routes/notificationRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', liveRoutes);

// Static files (for video uploads later)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Mock Cron Job for Push Notifications (Checks every 1 minute)
// setInterval(() => {
//     console.log('[Scheduler] Checking for upcoming live sessions exactly 10 minutes from now...');
//     // Logic would be: find LiveSessions where startTime is between now+9m and now+10m.
//     // webpush.sendNotification(...)
// }, 60 * 1000);

// Start DB and Server
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnstream_lms';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });

// Socket.io basics
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', socket.id);
    });

    socket.on('join-user-room', (userId: string) => {
        console.log(`User ${userId} joined their private notification room`);
        socket.join(userId);
    });

    socket.on('broadcaster-ready', (roomId: string) => {
        socket.to(roomId).emit('broadcaster-ready');
    });

    socket.on('offer', (payload: any) => {
        io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload: any) => {
        io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (incoming: any) => {
        io.to(incoming.target).emit('ice-candidate', incoming);
    });

    socket.on('send-chat-message', (payload: any) => {
        const { roomId, message, userName, isEncrypted } = payload;
        if (isEncrypted) {
            console.log(`[E2EE Blind Server] Relaying encrypted text for ${userName} in room ${roomId}: ${message.substring(0, 20)}...`);
        }
        io.to(roomId).emit('receive-chat-message', {
            text: message,
            user: userName,
            isEncrypted: isEncrypted || false,
            timestamp: new Date()
        });
    });

    socket.on('end-session', (roomId: string) => {
        socket.to(roomId).emit('session-ended');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
