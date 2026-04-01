import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
    title: string;
    description: string;
    thumbnailUrl: string;
    instructorId: mongoose.Types.ObjectId;
    price: number;
}

const CourseSchema = new Schema<ICourse>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', CourseSchema);
