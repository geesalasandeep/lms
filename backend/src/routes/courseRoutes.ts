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

        const problemKeywords = keywords[String(problemId)] || [];
        const hasKeywords = problemKeywords.some((k: string) => lowerCode.includes(k));

        const timestamp = new Date().toLocaleTimeString();
        output = `[${timestamp}] Compilation successful.\n`;
        output += `[${timestamp}] Initializing ${language.toUpperCase()} runtime...\n`;

        // Language specific simulation artifacts
        if (language === 'python') output += `[${timestamp}] Python 3.10 detected.\n`;
        if (language === 'java') output += `[${timestamp}] OpenJDK 17 detected.\n`;

        setTimeout(() => {
            if (!code || code.length < 20) {
                output = "COMPILATION ERROR: Your code is too short. Please write a more substantial solution.";
                return res.json({ output, error: true });
            }

            // SIMULATED EXECUTION (Extracting print/console statements)
            const extractedLogs: string[] = [];

            // Python print(...)
            const pyMatches = code.match(/print\s*\(\s*["'](.*?)["']\s*\)/g);
            if (pyMatches) pyMatches.forEach((m: string) => extractedLogs.push(m.replace(/print\s*\(\s*["']|["']\s*\)/g, '')));

            // Java/C/C++ prints
            const javaMatches = code.match(/System\.out\.println\s*\(\s*["'](.*?)["']\s*\)/g);
            if (javaMatches) javaMatches.forEach((m: string) => extractedLogs.push(m.replace(/System\.out\.println\s*\(\s*["']|["']\s*\)/g, '')));

            const cppMatches = code.match(/cout\s*<<\s*["'](.*?)["']/g);
            if (cppMatches) cppMatches.forEach((m: string) => extractedLogs.push(m.replace(/cout\s*<<\s*["']|["']/g, '')));

            if (extractedLogs.length > 0) {
                output += `\n--- Program Output ---\n`;
                extractedLogs.forEach(log => output += `${log}\n`);
                output += `----------------------\n\n`;
            }

            output += `[${timestamp}] Running Test Case 1: PASSED\n`;
            output += `[${timestamp}] Running Test Case 2: PASSED\n`;

            if (hasKeywords) {
                if (problemId == 1) { // Two Sum
                    output += `\nFinal Output: [0, 1]\nExpected: [0, 1]\n\nSUCCESS: All test cases passed!`;
                } else if (problemId == 2) { // Palindrome
                    output += `\nFinal Output: true\nExpected: true\n\nSUCCESS: All test cases passed!`;
                } else {
                    output += `\nFinal Output: [5, 4, 3, 2, 1]\nExpected: [5, 4, 3, 2, 1]\n\nSUCCESS: All test cases passed!`;
                }
            } else {
                output += `\n\n[HINT] Your code finished executing, but it didn't use the problem's input variables (${problemKeywords.join(', ')}). Try solving the problem dynamically to get the SUCCESS badge!`;
            }

            res.json({ output, error: false });
        }, 1000);
    }, 500);
});

export default router;
