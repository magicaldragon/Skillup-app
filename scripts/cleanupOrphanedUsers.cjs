// cleanupOrphanedUsers.cjs - Clean up orphaned Firebase Auth users
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add service account key)
let firebaseInitialized = false;

async function initializeFirebase() {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'skillup-3beaf'
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.log('⚠️  Firebase Admin not initialized (serviceAccountKey.json missing)');
    console.log('   This script will only check MongoDB users');
  }
}

async function checkOrphanedUsers() {
  console.log('🔍 Checking for Orphaned Users');
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
    const usersCollection = db.collection('users');
    
    // Get all users from MongoDB
    const mongoUsers = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${mongoUsers.length} users in MongoDB`);
    
    // Get MongoDB user emails
    const mongoEmails = mongoUsers.map(user => user.email).filter(Boolean);
    console.log('📧 MongoDB user emails:', mongoEmails);
    
    if (firebaseInitialized) {
      try {
        // Get all users from Firebase Auth
        const firebaseUsers = await admin.auth().listUsers();
        console.log(`📊 Found ${firebaseUsers.users.length} users in Firebase Auth`);
        
        // Find orphaned Firebase users (exist in Firebase but not in MongoDB)
        const orphanedUsers = firebaseUsers.users.filter(firebaseUser => {
          return !mongoEmails.includes(firebaseUser.email);
        });
        
        console.log(`\n⚠️  Found ${orphanedUsers.length} orphaned Firebase Auth users:`);
        orphanedUsers.forEach(user => {
          console.log(`   - ${user.email} (UID: ${user.uid})`);
        });
        
        if (orphanedUsers.length > 0) {
          console.log('\n🗑️  To delete orphaned users, run:');
          console.log('   node scripts/deleteOrphanedUsers.cjs');
        }
        
      } catch (error) {
        console.log('❌ Error accessing Firebase Auth:', error.message);
      }
    } else {
      console.log('\n📋 To check Firebase Auth users, add serviceAccountKey.json and run again');
    }
    
    await client.close();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeFirebase()
    .then(() => checkOrphanedUsers())
    .catch(console.error);
}

module.exports = { checkOrphanedUsers }; 