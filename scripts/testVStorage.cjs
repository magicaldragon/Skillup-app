// testVStorage.cjs - Test VStorage configuration
const https = require('https');

console.log('🧪 Testing VStorage Configuration');
console.log('==================================\n');

// Test Firebase Functions health endpoint
async function testFirebaseFunctions() {
  console.log('📡 Testing Firebase Functions...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'us-central1-skillup-3beaf.cloudfunctions.net',
      port: 443,
      path: '/api/health',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Firebase Functions are responding');
          console.log('📊 Health check response:');
          console.log(`   Status: ${response.status}`);
          console.log(`   Environment: ${response.environment}`);
          console.log(`   Firebase Project: ${response.firebase.projectId}`);
          console.log(`   MongoDB: ${response.mongodb.uri}`);
          console.log(`   VStorage Access Key: ${response.vstorage.accessKey}`);
          console.log(`   VStorage Bucket: ${response.vstorage.bucket}`);
          
          if (response.vstorage.accessKey === 'configured') {
            console.log('\n🎉 VStorage is properly configured!');
          } else {
            console.log('\n⚠️  VStorage credentials not configured');
            console.log('   Please set them in Firebase Console');
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Error testing Firebase Functions:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('❌ Request timeout');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test VStorage connectivity
async function testVStorageConnectivity() {
  console.log('\n🔗 Testing VStorage connectivity...');
  
  // This would test actual VStorage connection
  // For now, we'll just show the configuration
  console.log('📋 VStorage Configuration:');
  console.log('   Endpoint: https://s3.vngcloud.vn');
  console.log('   Region: sgn');
  console.log('   Bucket: skillup');
  console.log('\n💡 To test file uploads:');
  console.log('   1. Go to: https://skillup-3beaf.web.app');
  console.log('   2. Try uploading a file (assignment, avatar, etc.)');
  console.log('   3. Check if it appears in VNG Cloud VStorage');
}

// Main test function
async function runTests() {
  try {
    await testFirebaseFunctions();
    await testVStorageConnectivity();
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Set VStorage credentials in Firebase Console');
    console.log('2. Redeploy functions: npm run firebase:deploy');
    console.log('3. Test file uploads in your app');
    console.log('4. Run data migration: npm run migrate:firestore');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check if Firebase Functions are deployed');
    console.log('   - Verify VStorage credentials are set');
    console.log('   - Check Firebase Console for errors');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFirebaseFunctions, testVStorageConnectivity }; 