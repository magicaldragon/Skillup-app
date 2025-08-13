const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function quickAddUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Add admin user
    const adminUser = new User({
      name: 'SkillUp Admin',
      email: 'admin@admin.skillup',
      role: 'admin',
      username: 'skillup-admin',
      firebaseUid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222'
    });
    await adminUser.save();
    console.log('✅ Added admin user');

    // Add teacher user
    const teacherUser = new User({
      name: 'Jenny Teacher',
      email: 'teacher-jenny@teacher.skillup',
      role: 'teacher',
      username: 'teacher-jenny',
      firebaseUid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2'
    });
    await teacherUser.save();
    console.log('✅ Added teacher user');

    console.log('\n📊 Current users in MongoDB:');
    const allUsers = await User.find().select('-password');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}): ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

quickAddUsers(); 