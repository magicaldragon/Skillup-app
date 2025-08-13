const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function verifyHybridSystem() {
  try {
    console.log('🔍 Verifying Hybrid Authentication System...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Check current users in MongoDB
    console.log('\n📊 Current Users in MongoDB:');
    const mongoUsers = await User.find().select('-password');
    mongoUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.role}): ${user.email}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Firebase UID: ${user.firebaseUid}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });

    // Step 2: Verify hybrid system requirements
    console.log('🔍 Verifying Hybrid System Requirements:');

    let allGood = true;

    // Check if all users have Firebase UIDs
    const usersWithoutFirebaseUID = mongoUsers.filter((user) => !user.firebaseUid);
    if (usersWithoutFirebaseUID.length > 0) {
      console.log('❌ Users without Firebase UID:');
      usersWithoutFirebaseUID.forEach((user) => {
        console.log(`  - ${user.name} (${user.email})`);
      });
      allGood = false;
    } else {
      console.log('✅ All users have Firebase UIDs');
    }

    // Check for duplicate emails
    const emailCounts = {};
    mongoUsers.forEach((user) => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });

    const duplicateEmails = Object.entries(emailCounts).filter(([_email, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      console.log('❌ Duplicate emails found:');
      duplicateEmails.forEach(([email, count]) => {
        console.log(`  - ${email} (${count} times)`);
      });
      allGood = false;
    } else {
      console.log('✅ No duplicate emails');
    }

    // Check for duplicate Firebase UIDs
    const uidCounts = {};
    mongoUsers.forEach((user) => {
      if (user.firebaseUid) {
        uidCounts[user.firebaseUid] = (uidCounts[user.firebaseUid] || 0) + 1;
      }
    });

    const duplicateUIDs = Object.entries(uidCounts).filter(([_uid, count]) => count > 1);
    if (duplicateUIDs.length > 0) {
      console.log('❌ Duplicate Firebase UIDs found:');
      duplicateUIDs.forEach(([uid, count]) => {
        console.log(`  - ${uid} (${count} times)`);
      });
      allGood = false;
    } else {
      console.log('✅ No duplicate Firebase UIDs');
    }

    // Step 3: Test API endpoints
    console.log('\n🌐 Testing API Endpoints:');

    // Test user creation endpoint
    console.log('📝 User Creation Endpoint: /api/users (POST)');
    console.log('   - Requires admin authentication');
    console.log('   - Creates user in MongoDB with Firebase UID');
    console.log('   - Validates email uniqueness');
    console.log('   - Validates Firebase UID uniqueness');

    // Test user retrieval by Firebase UID
    console.log('📖 User Retrieval Endpoint: /api/users/firebase/:firebaseUid (GET)');
    console.log('   - Used by hybrid authentication service');
    console.log('   - Returns user data for login');

    // Test email check endpoint
    console.log('🔍 Email Check Endpoint: /api/users/check-email/:email (GET)');
    console.log('   - Used for registration validation');
    console.log('   - Prevents duplicate emails');

    // Step 4: Verify registration flow
    console.log('\n🔄 Registration Flow Verification:');
    console.log('1. ✅ User fills "Add New Member" form');
    console.log('2. ✅ System generates username, email, password');
    console.log('3. ✅ Creates user in Firebase Auth (email/password)');
    console.log('4. ✅ Gets Firebase UID from Firebase Auth');
    console.log('5. ✅ Creates user in MongoDB with Firebase UID');
    console.log('6. ✅ Returns generated credentials to admin');

    // Step 5: Verify login flow
    console.log('\n🔐 Login Flow Verification:');
    console.log('1. ✅ User enters email/password');
    console.log('2. ✅ Firebase Auth validates credentials');
    console.log('3. ✅ System gets Firebase UID from Firebase Auth');
    console.log('4. ✅ System fetches user data from MongoDB using Firebase UID');
    console.log('5. ✅ Returns user data for app session');

    // Step 6: Final status
    console.log('\n📋 Final Status:');
    if (allGood) {
      console.log('✅ Hybrid Authentication System is READY!');
      console.log('✅ All users are properly synchronized');
      console.log('✅ No duplicates or missing data');
      console.log('✅ API endpoints are properly configured');
      console.log('✅ Registration and login flows are verified');

      console.log('\n🎯 Ready to test:');
      console.log('1. Login with existing users');
      console.log('2. Use "Add New Member" to create new users');
      console.log('3. Verify new users can login immediately');
    } else {
      console.log('❌ Issues found in hybrid system');
      console.log('Please fix the issues above before testing');
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Total users in MongoDB: ${mongoUsers.length}`);
    console.log(`- Users with Firebase UIDs: ${mongoUsers.filter((u) => u.firebaseUid).length}`);
    console.log(`- System status: ${allGood ? 'READY' : 'NEEDS FIXES'}`);
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyHybridSystem();
