const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Define the expected users with their Firebase UIDs
const expectedUsers = [
  {
    name: 'SkillUp Admin',
    email: 'skillup-admin@teacher.skillup',
    password: 'Skillup@123',
    role: 'admin',
    username: 'skillup-admin',
    firebaseUid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222'
  },
  {
    name: 'Jenny Teacher',
    email: 'teacher-jenny@teacher.skillup',
    password: 'Skillup@123',
    role: 'teacher',
    username: 'teacher-jenny',
    firebaseUid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2'
  }
];

async function syncUsers() {
  try {
    console.log('🔄 Starting user synchronization...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Check current users in MongoDB
    console.log('\n📊 Current users in MongoDB:');
    const mongoUsers = await User.find().select('-password');
    mongoUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}): ${user.email} [UID: ${user.firebaseUid}]`);
    });

    // Step 2: Ensure all expected users exist in MongoDB
    console.log('\n🔍 Checking for missing users in MongoDB...');
    for (const expectedUser of expectedUsers) {
      const existingUser = await User.findOne({
        $or: [
          { email: expectedUser.email },
          { firebaseUid: expectedUser.firebaseUid }
        ]
      });

      if (!existingUser) {
        console.log(`❌ Missing user: ${expectedUser.name} (${expectedUser.email})`);
        console.log(`   Creating in MongoDB...`);
        
        const newUser = new User({
          name: expectedUser.name,
          email: expectedUser.email,
          role: expectedUser.role,
          username: expectedUser.username,
          firebaseUid: expectedUser.firebaseUid
        });
        
        await newUser.save();
        console.log(`   ✅ Created: ${expectedUser.name}`);
      } else {
        console.log(`✅ Found: ${expectedUser.name} (${expectedUser.email})`);
        
        // Update user data if needed
        let updated = false;
        if (existingUser.name !== expectedUser.name) {
          existingUser.name = expectedUser.name;
          updated = true;
        }
        if (existingUser.role !== expectedUser.role) {
          existingUser.role = expectedUser.role;
          updated = true;
        }
        if (existingUser.username !== expectedUser.username) {
          existingUser.username = expectedUser.username;
          updated = true;
        }
        if (existingUser.firebaseUid !== expectedUser.firebaseUid) {
          existingUser.firebaseUid = expectedUser.firebaseUid;
          updated = true;
        }
        
        if (updated) {
          await existingUser.save();
          console.log(`   🔄 Updated: ${expectedUser.name}`);
        }
      }
    }

    // Step 3: Check for duplicate users
    console.log('\n🔍 Checking for duplicate users...');
    const allUsers = await User.find();
    const emailCounts = {};
    const uidCounts = {};
    
    allUsers.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
      if (user.firebaseUid) {
        uidCounts[user.firebaseUid] = (uidCounts[user.firebaseUid] || 0) + 1;
      }
    });

    let hasDuplicates = false;
    Object.entries(emailCounts).forEach(([email, count]) => {
      if (count > 1) {
        console.log(`❌ Duplicate email found: ${email} (${count} times)`);
        hasDuplicates = true;
      }
    });

    Object.entries(uidCounts).forEach(([uid, count]) => {
      if (count > 1) {
        console.log(`❌ Duplicate Firebase UID found: ${uid} (${count} times)`);
        hasDuplicates = true;
      }
    });

    if (!hasDuplicates) {
      console.log('✅ No duplicates found');
    }

    // Step 4: Final status report
    console.log('\n📋 Final MongoDB Status:');
    const finalUsers = await User.find().select('-password');
    finalUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}): ${user.email}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Firebase UID: ${user.firebaseUid}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });

    console.log(`\n✅ Synchronization complete!`);
    console.log(`📊 Total users in MongoDB: ${finalUsers.length}`);

    // Step 5: Verify Firebase Auth requirements
    console.log('\n📋 Firebase Auth Requirements:');
    console.log('Make sure these users exist in Firebase Auth:');
    expectedUsers.forEach(user => {
      console.log(`- ${user.name}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error during synchronization:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

syncUsers(); 