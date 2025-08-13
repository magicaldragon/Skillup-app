const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://skillup-ai.firebaseio.com"
});

async function createAdminAccount() {
  try {
    console.log('Creating new admin account...');
    
    const adminData = {
      email: 'admin@admin.skillup',
      password: 'Skillup@123',
      displayName: 'SkillUp Admin',
      name: 'SkillUp Admin',
      englishName: 'Admin',
      role: 'admin',
      username: 'admin',
      status: 'active'
    };
    
    // Step 1: Create user in Firebase Auth
    console.log('1. Creating user in Firebase Auth...');
    const userRecord = await admin.auth().createUser({
      email: adminData.email,
      password: adminData.password,
      displayName: adminData.displayName
    });
    
    console.log('✅ Firebase Auth user created:', userRecord.uid);
    
    // Step 2: Create user document in Firestore
    console.log('2. Creating user document in Firestore...');
    const userDoc = await admin.firestore().collection('users').add({
      firebaseUid: userRecord.uid,
      email: adminData.email,
      name: adminData.name,
      englishName: adminData.englishName,
      username: adminData.username,
      role: adminData.role,
      status: adminData.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Firestore user document created:', userDoc.id);
    
    // Step 3: Verify the user
    console.log('3. Verifying user creation...');
    const verifyUser = await admin.firestore()
      .collection('users')
      .where('firebaseUid', '==', userRecord.uid)
      .limit(1)
      .get();
    
    if (!verifyUser.empty) {
      const userData = verifyUser.docs[0].data();
      console.log('✅ User verification successful:');
      console.log('   - Email:', userData.email);
      console.log('   - Role:', userData.role);
      console.log('   - Name:', userData.name);
      console.log('   - Username:', userData.username);
    }
    
    console.log('\n🎉 Admin account created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@admin.skillup');
    console.log('   Password: Skillup@123');
    console.log('   Role: admin');
    
    console.log('\n🔗 Firebase Console Links:');
    console.log('   Auth: https://console.firebase.google.com/project/skillup-3beaf/authentication/users');
    console.log('   Firestore: https://console.firebase.google.com/project/skillup-3beaf/firestore/data');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  Admin account already exists!');
      console.log('   You can use the existing account or delete it first.');
    }
  } finally {
    process.exit(0);
  }
}

createAdminAccount(); 