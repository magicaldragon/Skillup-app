const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
if (!admin.apps.length && fs.existsSync(serviceAccountPath)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
  console.log('✅ Firebase Admin initialized');
} else if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account file not found. Exiting.');
  process.exit(1);
}

async function fetchAllFirebaseUsers() {
  const allUsers = [];
  let nextPageToken;
  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    allUsers.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return allUsers;
}

async function syncUsers() {
  try {
    console.log('🔄 Starting user synchronization...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Fetch all users from Firebase Auth
    const firebaseUsers = await fetchAllFirebaseUsers();
    console.log(`📋 Found ${firebaseUsers.length} users in Firebase Auth.`);

    // Step 2: Sync each Firebase user to MongoDB
    for (const fbUser of firebaseUsers) {
      const email = fbUser.email;
      const firebaseUid = fbUser.uid;
      const displayName = fbUser.displayName || '';
      const username = (email && email.split('@')[0]) || firebaseUid;
      const role = (fbUser.customClaims && fbUser.customClaims.role) || 'student';
      const name = displayName || username;

      let mongoUser = await User.findOne({ firebaseUid });
      if (!mongoUser) {
        mongoUser = await User.findOne({ email });
      }
      if (!mongoUser) {
        // Create new user
        const newUser = new User({
          name,
          email,
          role,
          firebaseUid,
          status: 'active',
        });
        await newUser.save();
        console.log(`✅ Created user: ${name} (${email}) [${role}]`);
      } else {
        // Update user if info changed
        let updated = false;
        if (mongoUser.name !== name) { mongoUser.name = name; updated = true; }
        if (mongoUser.email !== email) { mongoUser.email = email; updated = true; }
        if (mongoUser.role !== role) { mongoUser.role = role; updated = true; }
        if (mongoUser.firebaseUid !== firebaseUid) { mongoUser.firebaseUid = firebaseUid; updated = true; }
        if (mongoUser.status !== 'active') { mongoUser.status = 'active'; updated = true; }
        if (updated) {
          await mongoUser.save();
          console.log(`🔄 Updated user: ${name} (${email}) [${role}]`);
        } else {
          console.log(`✔️  User up-to-date: ${name} (${email}) [${role}]`);
        }
      }
    }

    // Step 3: Optionally, deactivate MongoDB users not in Firebase Auth
    const firebaseUids = new Set(firebaseUsers.map(u => u.uid));
    const allMongoUsers = await User.find();
    for (const user of allMongoUsers) {
      if (user.firebaseUid && !firebaseUids.has(user.firebaseUid)) {
        user.status = 'off'; // Use 'off' instead of 'inactive'
        await user.save();
        console.log(`⚠️  Marked user as off (not in Firebase): ${user.name} (${user.email})`);
      }
    }

    console.log('✅ Synchronization complete!');
    const finalUsers = await User.find();
    console.log(`📊 Total users in MongoDB: ${finalUsers.length}`);
  } catch (error) {
    console.error('❌ Error during synchronization:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

syncUsers(); 