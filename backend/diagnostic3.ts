import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './src/models/Notification';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnstream_lms';

async function run() {
    await mongoose.connect(MONGODB_URI);

    // Explicit string userId
    const strUserId = "69cb4ef193f135fba8cf6478";

    console.log(`Checking string userId: ${strUserId}`);
    const resultsStr = await Notification.find({ userId: strUserId });
    console.log(`Results using string: ${resultsStr.length}`);

    // Explicit ObjectId userId
    const objUserId = new mongoose.Types.ObjectId(strUserId);
    console.log(`Checking ObjectId userId: ${objUserId.toString()}`);
    const resultsObj = await Notification.find({ userId: objUserId });
    console.log(`Results using ObjectId: ${resultsObj.length}`);

    process.exit(0);
}
run();
