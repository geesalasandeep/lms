import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveSession extends Document {
    courseId: mongoose.Types.ObjectId;
    title: string;
    startTime: Date;
    status: 'scheduled' | 'live' | 'ended';
    roomId: string; // Used for Socket.io / WebRTC signaling
}

const LiveSessionSchema = new Schema<ILiveSession>({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
    roomId: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema);
