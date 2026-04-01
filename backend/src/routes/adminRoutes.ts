import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { createCourse, createChapter, createAssignment } from '../controllers/adminController';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Ensure upload dir exists
const uploadDir = 'uploads/videos';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});
const upload = multer({ storage });

// Admin Routes (Protected)
router.use(authenticate, authorizeAdmin);

router.post('/courses', createCourse);
router.post('/chapters', upload.single('video'), createChapter);
router.post('/assignments', createAssignment);

export default router;
