import { Request, Response } from 'express';
import Course from '../models/Course';
import Chapter from '../models/Chapter';
import User from '../models/User';
import { sendEmail } from '../utils/mailer';

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const courses = await Course.find().populate('instructorId', 'name');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

export const getCourseDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId).populate('instructorId', 'name');
        if (!course) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        const chapters = await Chapter.find({ courseId }).sort({ order: 1 });
        res.json({ course, chapters });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course details' });
    }
};

export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const user = await User.findById(userId).populate({
            path: 'enrolledCourses.courseId',
            select: 'title thumbnailUrl'
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const enrolled = user.enrolledCourses.length;
        let totalProgress = 0;
        user.enrolledCourses.forEach(ec => totalProgress += ec.progress);

        const averageProgress = enrolled > 0 ? (totalProgress / enrolled) : 0;

        res.json({
            activeCoursesCount: enrolled,
            averageProgress: Math.round(averageProgress),
            enrolledCourses: user.enrolledCourses
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

import Assignment from '../models/Assignment';

export const getChapterDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const chapterId = req.params.chapterId;
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            res.status(404).json({ error: 'Chapter not found' });
            return;
        }

        const user = await User.findById((req as any).user.userId);
        const isEnrolled = user?.enrolledCourses.some(c => c.courseId.toString() === chapter.courseId.toString());

        if (!isEnrolled && user?.role !== 'Admin') {
            res.status(403).json({ error: 'You must enroll in this course to access chapters.' });
            return;
        }

        const assignment = await Assignment.findOne({ chapterId });
        res.json({ chapter, assignment });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter details' });
    }
};

export const enrollCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.id;
        const userId = (req as any).user.userId;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }





        const alreadyEnrolled = user.enrolledCourses.some(c => c.courseId.toString() === courseId);
        if (alreadyEnrolled) {
            res.status(400).json({ error: 'Already enrolled' });
            return;
        }

        user.enrolledCourses.push({
            courseId: courseId as any,
            progress: 0,
            unlockedChapters: []
        });

        await user.save();

        // Send welcome email
        const courseInfo = await Course.findById(courseId);
        if (courseInfo) {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome to ${courseInfo.title}!</h2>
                    <p>Hi ${user.name},</p>
                    <p>You have successfully enrolled in <strong>${courseInfo.title}</strong>.</p>
                    <p>You can access your course materials from your student dashboard.</p>
                    <br/>
                    <p>Happy Learning!</p>
                    <p><strong>LMS Antigravity Team</strong></p>
                </div>
            `;
            // We don't await this so the response isn't delayed
            sendEmail(user.email, `Enrollment Confirmed: ${courseInfo.title}`, emailHtml).catch(console.error);
        }


        res.status(200).json({ message: 'Successfully enrolled' });
    } catch (error) {

        res.status(500).json({ error: 'Failed to enroll in course' });
    }
};

export const completeChapter = async (req: Request, res: Response): Promise<void> => {
    try {
        const chapterId = req.params.chapterId;
        const userId = (req as any).user.userId;

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            res.status(404).json({ error: 'Chapter not found' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Find the enrolled course
        const enrolledCourse = user.enrolledCourses.find(c => c.courseId.toString() === chapter.courseId.toString());
        if (!enrolledCourse) {
            res.status(403).json({ error: 'User is not enrolled in this course' });
            return;
        }

        // Add chapter to unlockedChapters if not there
        if (!enrolledCourse.unlockedChapters.some(id => id.toString() === chapterId)) {
            enrolledCourse.unlockedChapters.push(chapter._id as any);
        }

        // Calculate progress
        const totalChapters = await Chapter.countDocuments({ courseId: chapter.courseId });
        if (totalChapters > 0) {
            const completedCount = enrolledCourse.unlockedChapters.length;
            enrolledCourse.progress = Math.round((completedCount / totalChapters) * 100);

            if (enrolledCourse.progress >= 100 && !enrolledCourse.completedAt) {
                enrolledCourse.completedAt = new Date();
                enrolledCourse.progress = 100;
            }
        }

        await user.save();
        res.status(200).json({ message: 'Chapter completed successfully', progress: enrolledCourse.progress });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete chapter' });
    }
};

export const submitAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assignmentId, answers } = req.body;
        const userId = (req as any).user.userId;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            res.status(404).json({ error: 'Assignment not found' });
            return;
        }

        const chapter = await Chapter.findById(assignment.chapterId);
        if (!chapter) {
            res.status(404).json({ error: 'Associated chapter not found' });
            return;
        }

        let correctCount = 0;
        const totalQuestions = assignment.questions.length;

        assignment.questions.forEach((q, index) => {
            const userAnswerIndex = answers[index];
            if (userAnswerIndex !== undefined && q.options[userAnswerIndex]?.isCorrect) {
                correctCount++;
            }
        });

        const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const passed = scorePercentage >= (assignment.passingScore || 40);

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const enrolledCourse = user.enrolledCourses.find(c => c.courseId.toString() === chapter.courseId.toString());
        if (!enrolledCourse) {
            res.status(403).json({ error: 'Not enrolled in this course' });
            return;
        }

        if (passed) {
            // Unlock next chapter or mark current as fully passed
            if (!enrolledCourse.unlockedChapters.some(id => id.toString() === chapter._id.toString())) {
                enrolledCourse.unlockedChapters.push(chapter._id as any);
            }

            // Calculate progress
            const totalChapters = await Chapter.countDocuments({ courseId: chapter.courseId });
            enrolledCourse.progress = Math.round((enrolledCourse.unlockedChapters.length / totalChapters) * 100);

            if (enrolledCourse.progress >= 100 && !enrolledCourse.completedAt) {
                enrolledCourse.completedAt = new Date();
            }
            await user.save();
        }

        res.json({
            score: scorePercentage,
            correctCount,
            totalQuestions,
            passed,
            message: passed ? 'Congratulations! You passed the assessment.' : 'You did not reach the passing score. Please try again.'
        });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
};

export const getCertificateDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.courseId;
        const userId = (req as any).user.userId;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const enrolledCourse = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
        if (!enrolledCourse || enrolledCourse.progress < 100) {
            res.status(403).json({ error: 'Certificate not available yet.' });
            return;
        }

        const course = await Course.findById(courseId).populate('instructorId', 'name');
        if (!course) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        res.json({
            userName: user.name,
            courseTitle: course.title,
            instructorName: (course.instructorId as any)?.name || 'Instructor',
            completedAt: enrolledCourse.completedAt || new Date()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch certificate details' });
    }
};
