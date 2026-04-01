import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
    courseId: mongoose.Types.ObjectId;
    title: string;
    order: number;
    videoUrl: string; // Internal file system path
    durationMinutes: number;
}

const ChapterSchema = new Schema<IChapter>({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    videoUrl: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IChapter>('Chapter', ChapterSchema);
