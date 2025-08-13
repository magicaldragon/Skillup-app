const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Users with their Firebase UIDs (from your Firebase console)
const existingUsers = [
  {
    name: 'SkillUp Admin',
    email: 'admin@admin.skillup',
    role: 'admin',
    username: 'skillup-admin',
    firebaseUid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222'
  },
  {
    name: 'Jenny Teacher',
    email: 'teacher-jenny@teacher.skillup',
    role: 'teacher',
    username: 'teacher-jenny',
    firebaseUid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2'
  }
];

async function addExistingFirebaseUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Adding existing Firebase users to MongoDB...');
    
    for (const userData of existingUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email },
            { firebaseUid: userData.firebaseUid }
          ]
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists in MongoDB`);
          continue;
        }

        // Create new user
        const user = new User({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          username: userData.username,
          firebaseUid: userData.firebaseUid
        });

        await user.save();
        console.log(`✅ Added ${userData.name} (${userData.role}) to MongoDB`);
        
      } catch (error) {
        console.error(`❌ Error adding ${userData.email}:`, error.message);
      }
    }

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

addExistingFirebaseUsers(); 