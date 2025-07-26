const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
// You'll need to download your Firebase service account key
// Go to Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const demoUsers = [
  {
    email: 'skillup-admin@teacher.skillup',
    password: 'Skillup@123',
    displayName: 'SkillUp Admin',
    uid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222'
  },
  {
    email: 'teacher-jenny@teacher.skillup',
    password: 'Skillup@123',
    displayName: 'Jenny Teacher',
    uid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2'
  },
  {
    email: 'student-alice@student.skillup',
    password: 'Skillup123',
    displayName: 'Alice Student',
    uid: 'student-alice-uid'
  },
  {
    email: 'student-bob@student.skillup',
    password: 'Skillup123',
    displayName: 'Bob Student',
    uid: 'student-bob-uid'
  }
];

async function createFirebaseAccounts() {
  console.log('Creating Firebase Auth accounts...');
  
  for (const user of demoUsers) {
    try {
      // Check if user already exists
      try {
        const existingUser = await admin.auth().getUserByEmail(user.email);
        console.log(`✅ User ${user.email} already exists (UID: ${existingUser.uid})`);
        continue;
      } catch (error) {
        // User doesn't exist, create it
      }
      
      // Create user with custom UID
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        uid: user.uid
      });
      
      console.log(`✅ Created user: ${user.email} (UID: ${userRecord.uid})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error.message);
    }
  }
  
  console.log('\nFirebase account creation completed!');
  process.exit(0);
}

createFirebaseAccounts(); 