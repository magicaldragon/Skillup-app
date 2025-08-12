// setupFirebaseEnv.cjs - Setup Firebase environment variables
const { execSync } = require('child_process');

console.log('🔧 Firebase Environment Variables Setup');
console.log('=======================================\n');

console.log('📋 Required Environment Variables:');
console.log('==================================');
console.log('1. MONGODB_URI - Your MongoDB connection string');
console.log('2. VITE_VSTORAGE_ACCESS_KEY - VNG Cloud access key');
console.log('3. VITE_VSTORAGE_SECRET_KEY - VNG Cloud secret key');
console.log('4. VITE_VSTORAGE_BUCKET - VNG Cloud bucket name (default: skillup)');
console.log('5. VITE_VSTORAGE_ENDPOINT - VNG Cloud endpoint (default: https://s3.vngcloud.vn)');
console.log('6. VITE_VSTORAGE_REGION - VNG Cloud region (default: sgn)');
console.log('\n');

console.log('🚀 Setting up Firebase environment variables...\n');

try {
  // Set MongoDB URI
  console.log('📊 Setting MONGODB_URI...');
  execSync('firebase functions:config:set mongodb.uri="mongodb+srv://skillup-user:Skillup123@cluster0.yuts8hn.mongodb.net/skillup?retryWrites=true&w=majority&appName=Cluster0"', { stdio: 'inherit' });
  
  console.log('\n✅ MONGODB_URI set successfully!');
  
  console.log('\n📝 Next steps:');
  console.log('==============');
  console.log('1. Get your VStorage credentials from Render:');
  console.log('   - Go to your Render dashboard');
  console.log('   - Find your service');
  console.log('   - Go to Environment tab');
  console.log('   - Copy VITE_VSTORAGE_ACCESS_KEY and VITE_VSTORAGE_SECRET_KEY');
  console.log('\n2. Set VStorage credentials in Firebase:');
  console.log('   firebase functions:config:set vstorage.access_key="YOUR_ACCESS_KEY"');
  console.log('   firebase functions:config:set vstorage.secret_key="YOUR_SECRET_KEY"');
  console.log('   firebase functions:config:set vstorage.bucket="skillup"');
  console.log('   firebase functions:config:set vstorage.endpoint="https://s3.vngcloud.vn"');
  console.log('   firebase functions:config:set vstorage.region="sgn"');
  console.log('\n3. Deploy the updated functions:');
  console.log('   npm run firebase:deploy');
  
} catch (error) {
  console.log('❌ Error setting environment variables:', error.message);
  console.log('\n💡 Alternative: Set them manually in Firebase Console');
  console.log('1. Go to: https://console.firebase.google.com/project/skillup-3beaf/functions/config');
  console.log('2. Add the environment variables manually');
} 