const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://skillup-ai.firebaseio.com',
});

async function updateAdminEmail() {
  try {
    console.log('Starting admin email update process...');

    // Find the admin user in Firestore
    const usersSnapshot = await admin
      .firestore()
      .collection('users')
      .where('email', '==', 'skillup-admin@teacher.skillup')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('Admin user not found in Firestore');
      return;
    }

    const adminUserDoc = usersSnapshot.docs[0];
    const adminUserData = adminUserDoc.data();

    console.log('Found admin user:', adminUserData.email);

    // Update the email in Firestore
    await adminUserDoc.ref.update({
      email: 'admin@admin.skillup',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Updated admin email in Firestore to: admin@admin.skillup');

    // Update the email in Firebase Auth
    try {
      await admin.auth().updateUser(adminUserData.firebaseUid, {
        email: 'admin@admin.skillup',
      });
      console.log('Updated admin email in Firebase Auth to: admin@admin.skillup');
    } catch (authError) {
      console.error('Error updating Firebase Auth email:', authError.message);
      console.log('You may need to manually update the email in Firebase Console');
    }

    console.log('Admin email update completed successfully!');
  } catch (error) {
    console.error('Error updating admin email:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminEmail();
