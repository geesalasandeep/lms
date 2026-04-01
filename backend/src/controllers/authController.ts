import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_key_change_in_prod';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {

        const { name, email, password, mobile, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            mobile,
            role: role || 'Student'
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile } = req.body;
        let user = await User.findOne({ mobile });
        if (!user) {
            // Auto-register if user doesn't exist, or just return error. Let's auto-register for seamless experience
            user = new User({ mobile, email: `${mobile}@placeholder.com`, name: `User ${mobile}` });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[SIMULATED SMS to ${mobile}]: Your OTP is ${otp}`);

        user.otp = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();

        res.json({ message: 'OTP sent successfully (Check console locally)' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, otp } = req.body;
        const user = await User.findOne({ mobile, otp, otpExpiresAt: { $gt: new Date() } });

        if (!user) {
            res.status(401).json({ error: 'Invalid or expired OTP' });
            return;
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'OTP verification failed' });
    }
};
