import mongoose, { Schema, Document } from 'mongoose';

export interface EnrolledCourse {
    courseId: mongoose.Types.ObjectId;
    progress: number;
    unlockedChapters: mongoose.Types.ObjectId[];
    completedAt?: Date;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    mobile?: string;
    role: 'Admin' | 'Student';
    googleId?: string;
    otp?: string;
    otpExpiresAt?: Date;
    enrolledCourses: EnrolledCourse[];
}

const CourseProgressSchema = new Schema<EnrolledCourse>({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    progress: { type: Number, default: 0 },
    unlockedChapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }],
    completedAt: { type: Date }
});

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    mobile: { type: String },
    role: { type: String, enum: ['Admin', 'Student'], default: 'Student' },
    googleId: { type: String },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    enrolledCourses: [CourseProgressSchema]
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
