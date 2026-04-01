import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './src/models/Notification';
import User from './src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnstream_lms';

async function run() {
    await mongoose.connect(MONGODB_URI);

    console.log('--- ALL NOTIFICATIONS ---');
    const notifs = await Notification.find({});
    console.log(`Total notifications in DB: ${notifs.length}`);
    if (notifs.length > 0) {
        console.log(JSON.stringify(notifs, null, 2));
    }

    process.exit(0);
}
run();
