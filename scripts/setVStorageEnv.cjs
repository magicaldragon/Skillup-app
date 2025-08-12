// setVStorageEnv.cjs - Set VStorage environment variables via Firebase CLI
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Setting VStorage Environment Variables');
console.log('=========================================\n');

console.log('📋 This script will help you set VStorage credentials in Firebase Functions');
console.log('You will need your VStorage access key and secret key from Render.\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setVStorageEnvironment() {
  try {
    console.log('🚀 Step 1: Setting VStorage credentials...\n');
    
    // Get credentials from user
    const accessKey = await askQuestion('Enter your VStorage Access Key: ');
    const secretKey = await askQuestion('Enter your VStorage Secret Key: ');
    
    if (!accessKey || !secretKey) {
      console.log('❌ Access key and secret key are required');
      rl.close();
      return;
    }
    
    console.log('\n📦 Setting environment variables...');
    
    // Set environment variables using Firebase CLI
    const commands = [
      `firebase functions:config:set vstorage.access_key="${accessKey}"`,
      `firebase functions:config:set vstorage.secret_key="${secretKey}"`,
      `firebase functions:config:set vstorage.bucket="skillup"`,
      `firebase functions:config:set vstorage.endpoint="https://s3.vngcloud.vn"`,
      `firebase functions:config:set vstorage.region="sgn"`
    ];
    
    for (const command of commands) {
      console.log(`\n🚀 Running: ${command}`);
      try {
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Success');
      } catch (error) {
        console.log('❌ Failed:', error.message);
      }
    }
    
    console.log('\n🎉 Environment variables set successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the updated functions: npm run firebase:deploy');
    console.log('2. Test the configuration: npm run test:vstorage');
    console.log('3. Run data migration: npm run migrate:firestore');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  setVStorageEnvironment();
}

module.exports = { setVStorageEnvironment }; 