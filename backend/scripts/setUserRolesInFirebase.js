const admin = require('firebase-admin');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const User = require('../models/User');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || path.join(__dirname, '../../serviceAccountKey.json');

if (!admin.apps.length && fs.existsSync(serviceAccountPath)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
  console.log('✅ Firebase Admin initialized');
} else if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account file not found. Exiting.');
  process.exit(1);
}

async function setRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all users who are admin, teacher, or staff
    const users = await User.find({ role: { $in: ['admin', 'teacher', 'staff'] } });
    console.log(`Found ${users.length} admin/teacher/staff users.`);

    for (const user of users) {
      if (!user.firebaseUid) {
        console.warn(`⚠️  User ${user.email} has no firebaseUid, skipping.`);
        continue;
      }
      try {
        await admin.auth().setCustomUserClaims(user.firebaseUid, { role: user.role });
        console.log(`✅ Set role '${user.role}' for ${user.email} (${user.firebaseUid}) in Firebase.`);
      } catch (err) {
        console.error(`❌ Failed to set role for ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setRoles();