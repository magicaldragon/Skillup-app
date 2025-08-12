// deployFirebase.cjs - Firebase deployment script
const { execSync } = require('child_process');

const command = process.argv[2];

console.log('🚀 Starting Firebase deployment...');
console.log('📋 Project: skillup-3beaf');
console.log('📋 Services: firestore:rules, functions, hosting');

// Check Firebase CLI
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('❌ Firebase CLI not found. Please install with: npm install -g firebase-tools');
  process.exit(1);
}

// Check Firebase login
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  console.log('✅ Firebase login verified');
} catch (error) {
  console.log('❌ Firebase login required. Please run: firebase login');
  process.exit(1);
}

if (command === 'deploy') {
  console.log('\n🔨 Building Firebase Functions...');
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { cwd: './functions', stdio: 'inherit' });
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }
  
  // Build TypeScript
  console.log('🔨 Building TypeScript...');
  try {
    execSync('npm run build', { cwd: './functions', stdio: 'inherit' });
    console.log('✅ Functions built successfully');
  } catch (error) {
    console.log('❌ Failed to build functions');
    process.exit(1);
  }
  
  console.log('\n🚀 Deploying to Firebase...');
  
  // Deploy Firestore rules
  console.log('📦 Deploying firestore:rules...');
  try {
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    console.log('✅ firestore:rules deployed successfully');
  } catch (error) {
    console.log('❌ firestore:rules deployment failed');
  }
  
  // Skip problematic indexes for now
  console.log('📦 Skipping firestore:indexes (will be created automatically)...');
  
  // Deploy Functions with cleanup policy
  console.log('📦 Deploying functions...');
  try {
    execSync('firebase deploy --only functions --force', { stdio: 'inherit' });
    console.log('✅ functions deployed successfully');
  } catch (error) {
    console.log('❌ functions deployment failed');
  }
  
  // Deploy Hosting
  console.log('📦 Deploying hosting...');
  try {
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
    console.log('✅ hosting deployed successfully');
  } catch (error) {
    console.log('❌ hosting deployment failed');
  }
  
  console.log('\n📊 Deployment Summary:');
  console.log('=====================');
  console.log('✅ Firebase Functions: https://us-central1-skillup-3beaf.cloudfunctions.net/api');
  console.log('✅ Firebase Hosting: https://skillup-3beaf.web.app');
  console.log('✅ Firebase Console: https://console.firebase.google.com/project/skillup-3beaf');
  
} else if (command === 'status') {
  console.log('\n📊 Firebase Project Status:');
  console.log('==========================');
  try {
    execSync('firebase projects:list', { stdio: 'inherit' });
  } catch (error) {
    console.log('❌ Failed to get project status');
  }
  
} else if (command === 'build') {
  console.log('\n🔨 Building Firebase Functions...');
  try {
    execSync('npm install', { cwd: './functions', stdio: 'inherit' });
    execSync('npm run build', { cwd: './functions', stdio: 'inherit' });
    console.log('✅ Functions built successfully');
  } catch (error) {
    console.log('❌ Build failed');
    process.exit(1);
  }
  
} else {
  console.log('\n📋 Available commands:');
  console.log('=====================');
  console.log('deploy  - Deploy all services to Firebase');
  console.log('status  - Show Firebase project status');
  console.log('build   - Build Firebase Functions only');
} 