// testMigration.cjs - Test migration setup
const { MongoClient } = require('mongodb');

console.log('🔍 Testing Migration Setup');
console.log('==========================\n');

// Test MongoDB connection
async function testMongoDB() {
  console.log('1. Testing MongoDB connection...');

  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not set');
    return false;
  }

  console.log('✅ MONGODB_URI is set');

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful');

    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`);

    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    await client.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Test Firebase Functions API
async function testFirebaseAPI() {
  console.log('\n2. Testing Firebase Functions API...');

  try {
    const response = await fetch('https://us-central1-skillup-3beaf.cloudfunctions.net/api/health');
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Firebase Functions API is working');
      console.log(`📍 API URL: https://us-central1-skillup-3beaf.cloudfunctions.net/api`);
      return true;
    } else {
      console.log('❌ Firebase Functions API test failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Firebase Functions API test failed:', error.message);
    return false;
  }
}

// Test VStorage configuration
function testVStorageConfig() {
  console.log('\n3. Testing VStorage configuration...');

  const requiredVars = [
    'VITE_VSTORAGE_ACCESS_KEY',
    'VITE_VSTORAGE_SECRET_KEY',
    'VITE_VSTORAGE_BUCKET',
  ];

  let allSet = true;
  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is not set`);
      allSet = false;
    }
  });

  return allSet;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting migration tests...\n');

  const results = {
    mongodb: await testMongoDB(),
    firebase: await testFirebaseAPI(),
    vstorage: testVStorageConfig(),
  };

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`MongoDB Connection: ${results.mongodb ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Firebase API: ${results.firebase ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`VStorage Config: ${results.vstorage ? '✅ PASS' : '❌ FAIL'}`);

  if (results.mongodb && results.firebase) {
    console.log('\n🎉 Ready for migration!');
    console.log('\n📋 Next steps:');
    console.log('1. Download service account key from Firebase Console');
    console.log('2. Save as serviceAccountKey.json in project root');
    console.log('3. Run: npm run migrate:firestore');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
