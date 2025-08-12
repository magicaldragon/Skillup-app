// deployFirebase.cjs - Firebase deployment script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  projectId: 'skillup-3beaf',
  functionsDir: 'functions',
  buildCommands: {
    functions: 'npm run build',
    frontend: 'npm run build'
  },
  deployOrder: [
    'firestore:rules',
    'firestore:indexes', 
    'functions',
    'hosting'
  ]
};

// Helper function to run commands
function runCommand(command, cwd = process.cwd()) {
  console.log(`\n🚀 Running: ${command}`);
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return { success: true, output };
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Helper function to check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to check if user is logged in
function checkFirebaseLogin() {
  try {
    const output = execSync('firebase projects:list', { stdio: 'pipe', encoding: 'utf8' });
    return output.includes(config.projectId);
  } catch (error) {
    return false;
  }
}

// Helper function to build functions
function buildFunctions() {
  console.log('\n🔨 Building Firebase Functions...');
  
  const functionsPath = path.join(process.cwd(), config.functionsDir);
  
  // Check if functions directory exists
  if (!fs.existsSync(functionsPath)) {
    console.error(`❌ Functions directory not found: ${functionsPath}`);
    return { success: false, error: 'Functions directory not found' };
  }
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  const installResult = runCommand('npm install', functionsPath);
  if (!installResult.success) {
    return installResult;
  }
  
  // Build functions
  console.log('🔨 Building TypeScript...');
  const buildResult = runCommand(config.buildCommands.functions, functionsPath);
  if (!buildResult.success) {
    return buildResult;
  }
  
  console.log('✅ Functions built successfully');
  return { success: true };
}

// Helper function to deploy Firebase services
function deployFirebase() {
  console.log('\n🚀 Deploying to Firebase...');
  
  const results = {
    total: config.deployOrder.length,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (const service of config.deployOrder) {
    console.log(`\n📦 Deploying ${service}...`);
    
    let command;
    switch (service) {
      case 'firestore:rules':
        command = 'firebase deploy --only firestore:rules';
        break;
      case 'firestore:indexes':
        command = 'firebase deploy --only firestore:indexes';
        break;
      case 'functions':
        command = 'firebase deploy --only functions';
        break;
      case 'hosting':
        command = 'firebase deploy --only hosting';
        break;
      default:
        command = `firebase deploy --only ${service}`;
    }
    
    const result = runCommand(command);
    
    if (result.success) {
      results.successful++;
      console.log(`✅ ${service} deployed successfully`);
    } else {
      results.failed++;
      results.errors.push({ service, error: result.error });
      console.log(`❌ ${service} deployment failed`);
    }
  }
  
  return results;
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting Firebase deployment...');
  console.log(`📋 Project: ${config.projectId}`);
  console.log(`📋 Services: ${config.deployOrder.join(', ')}`);
  
  // Check Firebase CLI
  console.log('\n🔍 Checking Firebase CLI...');
  if (!checkFirebaseCLI()) {
    console.error('❌ Firebase CLI is not installed');
    console.log('Please install it with: npm install -g firebase-tools');
    process.exit(1);
  }
  console.log('✅ Firebase CLI is installed');
  
  // Check Firebase login
  console.log('\n🔍 Checking Firebase login...');
  if (!checkFirebaseLogin()) {
    console.error('❌ Not logged in to Firebase or project access denied');
    console.log('Please login with: firebase login');
    console.log('And ensure you have access to the project');
    process.exit(1);
  }
  console.log('✅ Firebase login verified');
  
  // Build functions
  const buildResult = buildFunctions();
  if (!buildResult.success) {
    console.error('❌ Functions build failed:', buildResult.error);
    process.exit(1);
  }
  
  // Deploy to Firebase
  const deployResults = deployFirebase();
  
  // Print summary
  console.log('\n📊 Deployment Summary:');
  console.log('=====================');
  console.log(`Total Services: ${deployResults.total}`);
  console.log(`Successful: ${deployResults.successful}`);
  console.log(`Failed: ${deployResults.failed}`);
  
  if (deployResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    deployResults.errors.forEach(error => {
      console.log(`  - ${error.service}: ${error.error}`);
    });
  }
  
  if (deployResults.failed === 0) {
    console.log('\n🎉 Deployment completed successfully!');
    console.log(`🌐 Your app is now live at: https://${config.projectId}.web.app`);
    console.log(`🔧 Functions are available at: https://us-central1-${config.projectId}.cloudfunctions.net`);
  } else {
    console.log('\n⚠️  Deployment completed with errors. Please review the errors above.');
    process.exit(1);
  }
}

// Helper function to show deployment status
function showStatus() {
  console.log('\n📊 Checking deployment status...');
  
  try {
    const output = execSync('firebase projects:list', { encoding: 'utf8' });
    console.log('Current Firebase projects:');
    console.log(output);
  } catch (error) {
    console.error('❌ Failed to get project status:', error.message);
  }
}

// Helper function to clean up
function cleanup() {
  console.log('\n🧹 Cleaning up build artifacts...');
  
  const functionsPath = path.join(process.cwd(), config.functionsDir);
  const libPath = path.join(functionsPath, 'lib');
  
  if (fs.existsSync(libPath)) {
    try {
      fs.rmSync(libPath, { recursive: true, force: true });
      console.log('✅ Cleaned up functions build artifacts');
    } catch (error) {
      console.log('⚠️  Could not clean up build artifacts:', error.message);
    }
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'deploy':
      deploy()
        .then(() => cleanup())
        .then(() => {
          console.log('\n🎉 Deployment process completed!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('\n❌ Deployment process failed:', error);
          process.exit(1);
        });
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'build':
      buildFunctions()
        .then((result) => {
          if (result.success) {
            console.log('\n✅ Build completed successfully!');
            process.exit(0);
          } else {
            console.log('\n❌ Build failed:', result.error);
            process.exit(1);
          }
        });
      break;
      
    default:
      console.log('Usage: node deployFirebase.cjs [command]');
      console.log('Commands:');
      console.log('  deploy  - Deploy to Firebase');
      console.log('  status  - Show deployment status');
      console.log('  build   - Build functions only');
      break;
  }
}

module.exports = { deploy, buildFunctions, showStatus, cleanup }; 