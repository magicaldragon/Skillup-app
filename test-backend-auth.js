// Test Backend Authentication - Run this to debug authentication issues
// This script tests the backend authentication directly

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  // This will use the default service account from the environment
  admin.initializeApp();
}

async function testBackendAuth() {
  console.log('🔍 Testing Backend Authentication');
  console.log('==================================');
  
  try {
    // Test Firestore connection
    console.log('\n1. Testing Firestore Connection...');
    const db = admin.firestore();
    const testDoc = await db.collection('users').limit(1).get();
    console.log('✅ Firestore connection successful');
    console.log(`   Found ${testDoc.size} user(s) in database`);
    
    // Test admin users
    console.log('\n2. Checking Admin Users...');
    const adminUsers = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    console.log(`✅ Found ${adminUsers.size} admin user(s):`);
    adminUsers.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.email} (ID: ${doc.id})`);
      console.log(`     Role: ${data.role}`);
      console.log(`     Firebase UID: ${data.firebaseUid || 'Not set'}`);
    });
    
    // Test session token creation (example)
    console.log('\n3. Testing Session Token Format...');
    const now = Math.floor(Date.now() / 1000);
    const exampleSessionData = {
      uid: 'test-uid',
      email: 'admin@example.com',
      userId: 'test-user-id',
      role: 'admin',
      exp: now + 3600 // 1 hour from now
    };
    
    const sessionToken = Buffer.from(JSON.stringify(exampleSessionData)).toString('base64');
    console.log('✅ Example session token created:');
    console.log(`   Length: ${sessionToken.length} characters`);
    console.log(`   Format: Base64 encoded JSON`);
    console.log(`   Preview: ${sessionToken.substring(0, 50)}...`);
    
    // Test token decoding
    console.log('\n4. Testing Token Decoding...');
    const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    console.log('✅ Token decoded successfully:');
    console.log('   ', decoded);
    
    console.log('\n✅ All backend authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Backend authentication test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the test
testBackendAuth().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});