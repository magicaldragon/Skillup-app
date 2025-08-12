// findMongoDB.cjs - Script to help find MongoDB connection string
const fs = require('fs');
const path = require('path');

console.log('🔍 MongoDB Connection String Finder');
console.log('===================================\n');

// Check environment variable
console.log('1. Checking environment variable MONGODB_URI...');
if (process.env.MONGODB_URI) {
  console.log('✅ Found MONGODB_URI in environment');
  console.log('📍 Connection string:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
} else {
  console.log('❌ MONGODB_URI not found in environment');
}

// Check for .env files
console.log('\n2. Checking for .env files...');
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'backend/.env',
  'backend/.env.local'
];

envFiles.forEach(envFile => {
  if (fs.existsSync(envFile)) {
    console.log(`✅ Found ${envFile}`);
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n');
      const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
      if (mongoLine) {
        console.log('📍 MongoDB URI found:', mongoLine.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      }
    } catch (error) {
      console.log(`⚠️  Could not read ${envFile}:`, error.message);
    }
  } else {
    console.log(`❌ ${envFile} not found`);
  }
});

// Check package.json for scripts that might use MongoDB
console.log('\n3. Checking package.json for MongoDB references...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts) {
    Object.entries(packageJson.scripts).forEach(([name, script]) => {
      if (typeof script === 'string' && script.includes('mongodb')) {
        console.log(`📍 Found MongoDB reference in script "${name}":`, script);
      }
    });
  }
} catch (error) {
  console.log('⚠️  Could not read package.json');
}

// Check backend package.json
console.log('\n4. Checking backend/package.json...');
try {
  const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  if (backendPackageJson.scripts) {
    Object.entries(backendPackageJson.scripts).forEach(([name, script]) => {
      if (typeof script === 'string' && script.includes('mongodb')) {
        console.log(`📍 Found MongoDB reference in backend script "${name}":`, script);
      }
    });
  }
} catch (error) {
  console.log('⚠️  Could not read backend/package.json');
}

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. Check your Render dashboard for environment variables');
console.log('2. Check MongoDB Atlas if you\'re using Atlas');
console.log('3. Look for any .env files in your project');
console.log('4. Check your deployment platform settings');
console.log('\n💡 If you find your connection string, set it as:');
console.log('   export MONGODB_URI="your_connection_string"');
console.log('\n🚀 Then run the migration with:');
console.log('   npm run migrate:firestore'); 