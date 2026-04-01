import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
    text: string;
    isCorrect: boolean;
}

export interface IQuestion {
    questionText: string;
    options: IOption[];
}

export interface IAssignment extends Document {
    chapterId: mongoose.Types.ObjectId;
    questions: IQuestion[];
    passingScore: number;
}

const OptionSchema = new Schema<IOption>({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
});

const QuestionSchema = new Schema<IQuestion>({
    questionText: { type: String, required: true },
    options: [OptionSchema]
});

const AssignmentSchema = new Schema<IAssignment>({
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    questions: [QuestionSchema],
    passingScore: { type: Number, default: 40 } // Percentage required
}, { timestamps: true });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
