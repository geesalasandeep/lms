import { Router } from 'express';
import { register, login, sendOtp, verifyOtp } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

export default router;
