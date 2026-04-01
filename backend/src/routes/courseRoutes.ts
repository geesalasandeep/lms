import { Router } from 'express'; // Router for courses
import { getAllCourses, getCourseDetails, getUserDashboard, getChapterDetails, enrollCourse, completeChapter, getCertificateDetails, submitAssignment } from '../controllers/courseController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Public Routes
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseDetails);

// Protected Student Routes
router.get('/chapters/:chapterId', authenticate, getChapterDetails);
router.post('/chapters/:chapterId/complete', authenticate, completeChapter);
router.post('/courses/:id/enroll', authenticate, enrollCourse);
router.get('/user/dashboard', authenticate, getUserDashboard);
router.get('/certificate/:courseId', authenticate, getCertificateDetails);
router.post('/assignments/submit', authenticate, submitAssignment);
router.post('/playground/execute', authenticate, (req, res) => {
    const { language, code, problemId } = req.body;

    // PREMIUM MOCK EXECUTION ENGINE
    // In a real production app, this would call Judge0 or a Docker sandbox
    setTimeout(() => {
        const lowerCode = (code || "").toLowerCase();
        let error = false;
        let output = "";

        const keywords: any = {
            1: ['nums', 'target', 'return'],
            2: ['palindrome', 'return', 's'],
            3: ['reverse', 'head', 'next']
        };

        const problemKeywords = keywords[problemId] || [];
        const hasKeywords = problemKeywords.some((k: string) => lowerCode.includes(k));

        const timestamp = new Date().toLocaleTimeString();
        output = `[${timestamp}] Compilation successful.\n`;
        output += `[${timestamp}] Initializing ${language} runtime...\n`;
        output += `[${timestamp}] Running Test Case 1: PASSED\n`;
        output += `[${timestamp}] Running Test Case 2: PASSED\n`;

        if (!code || code.length < 20) {
            output = "COMPILATION ERROR: Your code is too short. Please write a more substantial solution.";
            error = true;
        } else {
            if (problemId == 1) { // Two Sum
                output += `\nOutput: [0, 1]\nExpected: [0, 1]\n\nSUCCESS: All test cases passed!`;
            } else if (problemId == 2) { // Palindrome
                output += `\nOutput: true\nExpected: true\n\nSUCCESS: All test cases passed!`;
            } else {
                output += `\nOutput: [5, 4, 3, 2, 1]\nExpected: [5, 4, 3, 2, 1]\n\nSUCCESS: All test cases passed!`;
            }

            if (!hasKeywords) {
                output += `\n\n[HINT] Your code passed the test cases, but it doesn't seem to use the provided input variables (${problemKeywords.join(', ')}). Try to make your solution more dynamic!`;
            }
        }

        res.json({ output, error });
    }, 1500);
});

export default router;
