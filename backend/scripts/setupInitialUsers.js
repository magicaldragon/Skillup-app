const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const initialUsers = [
  {
    name: 'SkillUp Admin',
    email: 'skillup-admin@teacher.skillup',
    password: 'Skillup@123',
    role: 'admin',
    username: 'skillup-admin'
  },
  {
    name: 'Jenny Teacher',
    email: 'teacher-jenny@teacher.skillup',
    password: 'Skillup@123',
    role: 'teacher',
    username: 'teacher-jenny'
  },
  {
    name: 'Alice Student',
    email: 'student-alice@student.skillup',
    password: 'Skillup123',
    role: 'student',
    username: 'student-alice'
  },
  {
    name: 'Bob Student',
    email: 'student-bob@student.skillup',
    password: 'Skillup123',
    role: 'student',
    username: 'student-bob'
  }
];

async function setupInitialUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Setting up initial users...');
    console.log('⚠️  IMPORTANT: You need to create these users in Firebase Auth first!');
    console.log('\n📝 Steps to complete setup:');
    console.log('1. Go to Firebase Console > Authentication > Users');
    console.log('2. Click "Add User" for each user below:');
    
    initialUsers.forEach((user, index) => {
      console.log(`\n   ${index + 1}. ${user.name} (${user.role})`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Password: ${user.password}`);
      console.log(`      Copy the Firebase UID after creating this user`);
    });

    console.log('\n3. After creating users in Firebase, run this script again with the UIDs');
    console.log('4. Or use the "Add New Member" feature in the app to create users automatically');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

setupInitialUsers(); 