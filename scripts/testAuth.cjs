// testAuth.cjs - Test authentication flow with Firebase Functions
const { execSync } = require('node:child_process');

console.log('🧪 Testing Firebase Functions Authentication...');
console.log('📋 Project: skillup-3beaf');

// Test health endpoint
console.log('\n1️⃣ Testing health endpoint...');
try {
  const healthResponse = execSync('curl -s "https://us-central1-skillup-3beaf.cloudfunctions.net/api/health"', { encoding: 'utf8' });
  console.log('✅ Health endpoint working:', JSON.parse(healthResponse).status);
} catch (error) {
  console.log('❌ Health endpoint failed:', error.message);
}

// Test test endpoint
console.log('\n2️⃣ Testing test endpoint...');
try {
  const testResponse = execSync('curl -s "https://us-central1-skillup-3beaf.cloudfunctions.net/api/test"', { encoding: 'utf8' });
  console.log('✅ Test endpoint working:', JSON.parse(testResponse).status);
} catch (error) {
  console.log('❌ Test endpoint failed:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('=====================');
console.log('1. Create admin user in Firebase Auth with email: admin@admin.skillup');
console.log('2. Test login with the frontend application');
console.log('3. Verify role assignment works correctly');
console.log('\n🔧 To create admin user, run:');
console.log('   firebase auth:import users.json --project skillup-3beaf');
console.log('\n📝 Create users.json with:');
console.log('   [{"email":"admin@admin.skillup","passwordHash":"<bcrypt_hash>","salt":"<salt>"}]');
console.log('\n💡 Or use Firebase Console to create user manually'); 