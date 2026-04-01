import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

async function run() {
    const userId = "69cb4ef193f135fba8cf6478"; // 5674839304@placeholder.com
    const secret = process.env.JWT_SECRET || 'supersecretkey_change_in_prod';

    const token = jwt.sign({ id: userId, role: 'Student' }, secret, { expiresIn: '1d' });

    console.log('Testing GET /api/notifications with generated token');

    try {
        const res = await fetch('http://localhost:3000/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
    process.exit(0);
}
run();
