import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';
import Course from './src/models/Course';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnstream_lms';

async function run() {
    await mongoose.connect(MONGODB_URI);

    console.log('--- ALL USERS ---');
    const users = await User.find({}, 'email role enrolledCourses');
    console.log(JSON.stringify(users, null, 2));

    console.log('--- ALL COURSES ---');
    const courses = await Course.find({}, 'title');
    console.log(JSON.stringify(courses, null, 2));

    if (courses.length > 0) {
        const testCourseId = courses[0]._id.toString();
        console.log(`\nTesting query for course ${testCourseId}:`);
        const query1 = { role: 'Student', 'enrolledCourses.courseId': testCourseId };
        const res1 = await User.find(query1);
        console.log('Query with string ID returned:', res1.length, 'students');

        const query2 = { role: 'Student', 'enrolledCourses.courseId': new mongoose.Types.ObjectId(testCourseId) };
        const res2 = await User.find(query2);
        console.log('Query with ObjectId returned:', res2.length, 'students');
    }

    process.exit(0);
}
run();
