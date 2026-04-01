import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnstream_lms';

async function run() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();

    console.log('Raw DB NOTIFICATIONS:');
    const notifs = await db.collection('notifications').find({}).toArray();
    console.log(notifs.slice(0, 3)); // just show first 3

    const count = await db.collection('notifications').countDocuments({ userId: "69cb4ef193f135fba8cf6478" });
    const countObj = await db.collection('notifications').countDocuments({ userId: new (require('mongodb')).ObjectId("69cb4ef193f135fba8cf6478") });

    console.log(`Raw count string: ${count}`);
    console.log(`Raw count ObjectId: ${countObj}`);

    await client.close();
    process.exit(0);
}
run();
