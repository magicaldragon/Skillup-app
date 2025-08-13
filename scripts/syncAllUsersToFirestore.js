const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://skillup-ai.firebaseio.com"
});

async function syncAllUsersToFirestore() {
  try {
    console.log('🔄 Starting comprehensive user sync process...\n');
    
    // Step 1: Create new admin account
    console.log('1️⃣ Creating new admin account...');
    try {
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
      
      const userRecord = await admin.auth().createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.displayName
      });
      
      console.log('✅ New admin account created:', userRecord.uid);
      
      // Create admin document in Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
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
      
      console.log('✅ Admin document created in Firestore');
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Admin account already exists, skipping creation');
      } else {
        console.error('❌ Error creating admin account:', error.message);
      }
    }
    
    // Step 2: Get all users from Firebase Auth
    console.log('\n2️⃣ Fetching all users from Firebase Auth...');
    const listUsersResult = await admin.auth().listUsers();
    const firebaseUsers = listUsersResult.users;
    
    console.log(`📊 Found ${firebaseUsers.length} users in Firebase Auth`);
    
    // Step 3: Sync each user to Firestore
    console.log('\n3️⃣ Syncing users to Firestore...');
    const syncResults = [];
    
    for (const firebaseUser of firebaseUsers) {
      try {
        console.log(`\n🔄 Processing: ${firebaseUser.email}`);
        
        // Check if user already exists in Firestore
        const existingUserQuery = await admin.firestore()
          .collection('users')
          .where('firebaseUid', '==', firebaseUser.uid)
          .limit(1)
          .get();
        
        if (existingUserQuery.empty) {
          // User doesn't exist in Firestore, create them
          let role = 'student'; // default
          if (firebaseUser.email?.includes('@teacher.skillup')) {
            role = 'teacher';
          } else if (firebaseUser.email?.includes('@admin.skillup')) {
            role = 'admin';
          } else if (firebaseUser.email?.includes('@staff.skillup')) {
            role = 'staff';
          }
          
          const newUserData = {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown',
            englishName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown',
            username: firebaseUser.email?.split('@')[0] || 'user',
            role: role,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          const userDoc = await admin.firestore().collection('users').add(newUserData);
          
          syncResults.push({
            email: firebaseUser.email,
            action: 'created',
            userId: userDoc.id,
            role: role
          });
          
          console.log(`✅ Created user in Firestore: ${firebaseUser.email} (${role})`);
        } else {
          // User exists, update if needed
          const existingUser = existingUserQuery.docs[0];
          const existingData = existingUser.data();
          
          // Update role based on email domain
          let newRole = existingData.role;
          if (firebaseUser.email?.includes('@admin.skillup')) {
            newRole = 'admin';
          } else if (firebaseUser.email?.includes('@teacher.skillup')) {
            newRole = 'teacher';
          } else if (firebaseUser.email?.includes('@staff.skillup')) {
            newRole = 'staff';
          }
          
          const updates = {};
          if (newRole !== existingData.role) {
            updates.role = newRole;
            console.log(`🔄 Updating role: ${existingData.role} → ${newRole}`);
          }
          if (!existingData.firebaseUid) {
            updates.firebaseUid = firebaseUser.uid;
          }
          if (firebaseUser.displayName && firebaseUser.displayName !== existingData.name) {
            updates.name = firebaseUser.displayName;
            updates.englishName = firebaseUser.displayName;
          }
          
          if (Object.keys(updates).length > 0) {
            updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            await existingUser.ref.update(updates);
            
            syncResults.push({
              email: firebaseUser.email,
              action: 'updated',
              userId: existingUser.id,
              changes: Object.keys(updates)
            });
            
            console.log(`✅ Updated existing user: ${firebaseUser.email}`);
          } else {
            syncResults.push({
              email: firebaseUser.email,
              action: 'already_synced',
              userId: existingUser.id
            });
            
            console.log(`✅ User already synced: ${firebaseUser.email}`);
          }
        }
      } catch (userError) {
        console.error(`❌ Error syncing user ${firebaseUser.email}:`, userError.message);
        syncResults.push({
          email: firebaseUser.email,
          action: 'error',
          error: userError.message
        });
      }
    }
    
    // Step 4: Summary
    console.log('\n📋 Sync Summary:');
    console.log(`Total users processed: ${firebaseUsers.length}`);
    
    const created = syncResults.filter(r => r.action === 'created').length;
    const updated = syncResults.filter(r => r.action === 'updated').length;
    const alreadySynced = syncResults.filter(r => r.action === 'already_synced').length;
    const errors = syncResults.filter(r => r.action === 'error').length;
    
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`✅ Already synced: ${alreadySynced}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Step 5: Show admin accounts
    console.log('\n👑 Admin Accounts:');
    const adminUsers = syncResults.filter(r => 
      r.email?.includes('@admin.skillup') || 
      (r.role && r.role === 'admin')
    );
    
    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.action})`);
      });
    } else {
      console.log('   No admin accounts found');
    }
    
    console.log('\n🎉 User sync completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Login with admin@admin.skillup / Skillup@123');
    console.log('2. Verify admin role is correctly assigned');
    console.log('3. Test all functionality');
    
  } catch (error) {
    console.error('❌ Error in user sync process:', error);
  } finally {
    process.exit(0);
  }
}

syncAllUsersToFirestore(); 