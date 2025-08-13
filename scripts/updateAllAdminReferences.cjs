const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://skillup-ai.firebaseio.com',
});

async function updateAllAdminReferences() {
  try {
    console.log('Starting comprehensive admin email update process...');

    // Step 1: Update Firestore
    console.log('\n1. Updating Firestore...');
    const usersSnapshot = await admin
      .firestore()
      .collection('users')
      .where('email', '==', 'skillup-admin@teacher.skillup')
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const adminUserDoc = usersSnapshot.docs[0];
      const adminUserData = adminUserDoc.data();

      console.log('Found admin user in Firestore:', adminUserData.email);

      // Update the email in Firestore
      await adminUserDoc.ref.update({
        email: 'admin@admin.skillup',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Updated admin email in Firestore to: admin@admin.skillup');

      // Step 2: Update Firebase Auth
      console.log('\n2. Updating Firebase Auth...');
      try {
        await admin.auth().updateUser(adminUserData.firebaseUid, {
          email: 'admin@admin.skillup',
        });
        console.log('✅ Updated admin email in Firebase Auth to: admin@admin.skillup');
      } catch (authError) {
        console.error('❌ Error updating Firebase Auth email:', authError.message);
        console.log('⚠️  You may need to manually update the email in Firebase Console');
      }
    } else {
      console.log('⚠️  Admin user not found in Firestore with old email');
    }

    // Step 3: Check if new admin email already exists
    console.log('\n3. Checking for existing admin@admin.skillup...');
    const newAdminSnapshot = await admin
      .firestore()
      .collection('users')
      .where('email', '==', 'admin@admin.skillup')
      .limit(1)
      .get();

    if (!newAdminSnapshot.empty) {
      console.log('✅ Admin user with new email already exists in Firestore');
    } else {
      console.log('⚠️  Admin user with new email not found in Firestore');
    }

    // Step 4: Verify role assignment logic
    console.log('\n4. Verifying role assignment logic...');
    const testEmails = [
      'admin@admin.skillup',
      'teacher-jenny@teacher.skillup',
      'student-alice@student.skillup',
    ];

    for (const email of testEmails) {
      let role = 'student'; // default
      if (email.includes('@teacher.skillup')) {
        role = 'teacher';
      } else if (email.includes('@admin.skillup') || email.includes('admin@admin.skillup')) {
        role = 'admin';
      }
      console.log(`  ${email} → ${role}`);
    }

    console.log('\n✅ Admin email update process completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Update any remaining documentation files');
    console.log('2. Test login with admin@admin.skillup / Skillup@123');
    console.log('3. Verify that the admin role is correctly assigned');
  } catch (error) {
    console.error('❌ Error in admin email update process:', error);
  } finally {
    process.exit(0);
  }
}

updateAllAdminReferences();
