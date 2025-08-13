const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Initial users data for hybrid approach
// These users will be created in MongoDB with Firebase UIDs
// You'll need to create these users in Firebase Auth first
const initialUsers = [
  {
    firebaseUid: 'admin-uid-123', // Replace with actual Firebase UID
    name: 'skillup-admin',
    email: 'admin@admin.skillup',
    role: 'admin',
    avatarUrl: 'https://picsum.photos/seed/admin/100/100',
    status: 'active'
  },
  {
    firebaseUid: 'teacher-uid-456', // Replace with actual Firebase UID
    name: 'teacher-jenny',
    email: 'teacher-jenny@teacher.skillup',
    role: 'teacher',
    avatarUrl: 'https://picsum.photos/seed/jenny/100/100',
    status: 'active'
  },
  {
    firebaseUid: 'student-alice-uid-789', // Replace with actual Firebase UID
    name: 'student-alice',
    email: 'student-alice@student.skillup',
    role: 'student',
    avatarUrl: 'https://picsum.photos/seed/alice/100/100',
    status: 'active',
    englishName: 'Alice Johnson',
    gender: 'female'
  },
  {
    firebaseUid: 'student-bob-uid-012', // Replace with actual Firebase UID
    name: 'student-bob',
    email: 'student-bob@student.skillup',
    role: 'student',
    avatarUrl: 'https://picsum.photos/seed/bob/100/100',
    status: 'active',
    englishName: 'Bob Smith',
    gender: 'male'
  }
];

async function seedHybridUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      console.log('Users already exist in database. Skipping seed.');
      console.log('Existing users:', existingUsers.map(u => ({ email: u.email, role: u.role, firebaseUid: u.firebaseUid })));
      return;
    }

    console.log('\n⚠️  IMPORTANT: Before running this script, you need to:');
    console.log('1. Create users in Firebase Auth with the same emails');
    console.log('2. Replace the firebaseUid values in this script with actual Firebase UIDs');
    console.log('3. Then run this script again\n');

    // Create users
    const createdUsers = [];
    for (const userData of initialUsers) {
      try {
        const user = new User(userData);
        await user.save();
        createdUsers.push({
          name: user.name,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid
        });
        console.log(`Created user: ${user.name} (${user.email}) with Firebase UID: ${user.firebaseUid}`);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n✅ Hybrid user seeding completed!');
    console.log('Created users:', createdUsers);
    console.log('\nNext steps:');
    console.log('1. Create these users in Firebase Auth with the same emails');
    console.log('2. Update the firebaseUid values in this script with the actual Firebase UIDs');
    console.log('3. Run this script again to update the MongoDB records');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedHybridUsers(); 