import { Request, Response } from 'express';
import Course from '../models/Course';
import Chapter from '../models/Chapter';
import Assignment from '../models/Assignment';

export const createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, thumbnailUrl, price } = req.body;
        const instructorId = (req as any).user.userId;

        const course = new Course({ title, description, thumbnailUrl, price, instructorId });
        await course.save();

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
    }
};

export const createChapter = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId, title, order, durationMinutes } = req.body;
        const videoUrl = req.file ? `/uploads/videos/${req.file.filename}` : '';

        const chapter = new Chapter({ courseId, title, order, videoUrl, durationMinutes });
        await chapter.save();

        res.status(201).json(chapter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create chapter' });
    }
};

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chapterId, questions, passingScore } = req.body;

        const assignment = new Assignment({ chapterId, questions, passingScore });
        await assignment.save();

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create assignment' });
    }
};
