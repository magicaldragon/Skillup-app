const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Initial users data (migrated from Firebase/constants)
const initialUsers = [
  {
    name: 'skillup-admin',
    email: 'skillup-admin@teacher.skillup',
    password: 'Skillup@123', // Will be hashed by the model
    role: 'admin',
    avatarUrl: 'https://picsum.photos/seed/admin/100/100',
    status: 'active'
  },
  {
    name: 'teacher-jenny',
    email: 'teacher-jenny@teacher.skillup',
    password: 'Skillup@123',
    role: 'teacher',
    avatarUrl: 'https://picsum.photos/seed/jenny/100/100',
    status: 'active'
  },
  {
    name: 'student-alice',
    email: 'student-alice@student.skillup',
    password: 'Skillup123',
    role: 'student',
    avatarUrl: 'https://picsum.photos/seed/alice/100/100',
    status: 'active',
    englishName: 'Alice Johnson',
    gender: 'female'
  },
  {
    name: 'student-bob',
    email: 'student-bob@student.skillup',
    password: 'Skillup123',
    role: 'student',
    avatarUrl: 'https://picsum.photos/seed/bob/100/100',
    status: 'active',
    englishName: 'Bob Smith',
    gender: 'male'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Check if users already exist
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      console.log('Users already exist in database. Skipping seed.');
      console.log('Existing users:', existingUsers.map(u => ({ email: u.email, role: u.role })));
      return;
    }

    // Create users
    const createdUsers = [];
    for (const userData of initialUsers) {
      try {
        const user = new User(userData);
        await user.save();
        createdUsers.push({
          name: user.name,
          email: user.email,
          role: user.role
        });
        console.log(`Created user: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n✅ User seeding completed!');
    console.log('Created users:', createdUsers);
    console.log('\nLogin credentials:');
    console.log('Admin: skillup-admin@teacher.skillup / Skillup@123');
    console.log('Teacher: teacher-jenny@teacher.skillup / Skillup@123');
    console.log('Student 1: student-alice@student.skillup / Skillup123');
    console.log('Student 2: student-bob@student.skillup / Skillup123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedUsers(); 