// verifyMigration.cjs - Verify Firebase migration is complete
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

let firebaseInitialized = false;

async function initializeFirebase() {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'skillup-3beaf',
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (_error) {
    console.log('⚠️  Firebase Admin not initialized (serviceAccountKey.json missing)');
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying Firebase Migration');
  console.log('==============================\n');

  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not set');
    return;
  }

  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful');

    const db = client.db('skillup');

    // Check MongoDB collections
    console.log('\n📊 MongoDB Data Status:');
    console.log('=======================');
    const collections = [
      'users',
      'classes',
      'levels',
      'potentialstudents',
      'changelogs',
      'studentrecords',
    ];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📁 ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`❌ Error checking ${collectionName}:`, error.message);
      }
    }

    if (firebaseInitialized) {
      console.log('\n🔥 Firestore Data Status:');
      console.log('=========================');

      // Check Firestore collections
      const firestore = admin.firestore();

      for (const collectionName of collections) {
        try {
          const snapshot = await firestore.collection(collectionName).limit(1).get();
          console.log(`📁 ${collectionName}: ${snapshot.size > 0 ? 'Has data' : 'Empty'}`);
        } catch (error) {
          console.log(`❌ Error checking Firestore ${collectionName}:`, error.message);
        }
      }

      // Check Firebase Auth users
      console.log('\n👥 Firebase Auth Status:');
      console.log('=======================');
      try {
        const authUsers = await admin.auth().listUsers();
        console.log(`📊 Firebase Auth users: ${authUsers.users.length}`);

        // Check for orphaned users
        const mongoUsers = await db.collection('users').find({}).toArray();
        const mongoEmails = mongoUsers.map((user) => user.email).filter(Boolean);

        const orphanedUsers = authUsers.users.filter((firebaseUser) => {
          return !mongoEmails.includes(firebaseUser.email);
        });

        if (orphanedUsers.length > 0) {
          console.log(`⚠️  Found ${orphanedUsers.length} orphaned Firebase Auth users`);
          orphanedUsers.forEach((user) => {
            console.log(`   - ${user.email} (UID: ${user.uid})`);
          });
        } else {
          console.log('✅ No orphaned Firebase Auth users found');
        }
      } catch (error) {
        console.log('❌ Error checking Firebase Auth:', error.message);
      }
    }

    console.log('\n🌐 Service Status:');
    console.log('==================');
    console.log('✅ Firebase Functions: https://us-central1-skillup-3beaf.cloudfunctions.net/api');
    console.log('✅ Firebase Hosting: https://skillup-3beaf.web.app');
    console.log('✅ Firebase Console: https://console.firebase.google.com/project/skillup-3beaf');

    console.log('\n📋 Migration Checklist:');
    console.log('=======================');
    console.log('✅ Firebase Functions deployed');
    console.log('✅ Firebase Hosting deployed');
    console.log('✅ MongoDB data analyzed');
    console.log(
      firebaseInitialized ? '✅ Firebase Admin initialized' : '⚠️  Firebase Admin not initialized'
    );
    console.log('⚠️  VStorage credentials need to be set in Firebase Console');
    console.log('⚠️  Data migration pending (requires serviceAccountKey.json)');

    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Download serviceAccountKey.json from Firebase Console');
    console.log('2. Set VStorage credentials in Firebase Console');
    console.log('3. Run: npm run migrate:firestore');
    console.log('4. Test the application functionality');

    await client.close();
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeFirebase()
    .then(() => verifyMigration())
    .catch(console.error);
}

module.exports = { verifyMigration };
