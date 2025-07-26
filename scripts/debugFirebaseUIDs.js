// Debug script to check Firebase UIDs
// Run this in the browser console when logged into your app

console.log('=== Firebase UID Debug Script ===');

// Function to check current Firebase user
function checkCurrentUser() {
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  if (user) {
    console.log('✅ Current Firebase User:');
    console.log('  Email:', user.email);
    console.log('  UID:', user.uid);
    console.log('  Display Name:', user.displayName);
    return user.uid;
  } else {
    console.log('❌ No Firebase user currently logged in');
    return null;
  }
}

// Function to test login and get UID
async function testLoginAndGetUID(email, password) {
  try {
    console.log(`\n🔍 Testing login for: ${email}`);
    
    const auth = firebase.auth();
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('✅ Login successful!');
    console.log('  Email:', user.email);
    console.log('  UID:', user.uid);
    console.log('  Display Name:', user.displayName);
    
    // Sign out after getting UID
    await auth.signOut();
    console.log('  Signed out for testing');
    
    return user.uid;
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    console.log('  Error code:', error.code);
    return null;
  }
}

// Test all demo accounts
async function testAllAccounts() {
  console.log('\n=== Testing All Demo Accounts ===');
  
  const accounts = [
    { email: 'skillup-admin@teacher.skillup', password: 'Skillup@123', name: 'Admin' },
    { email: 'teacher-jenny@teacher.skillup', password: 'Skillup@123', name: 'Teacher Jenny' },
    { email: 'student-alice@student.skillup', password: 'Skillup123', name: 'Student Alice' },
    { email: 'student-bob@student.skillup', password: 'Skillup123', name: 'Student Bob' }
  ];
  
  const results = {};
  
  for (const account of accounts) {
    const uid = await testLoginAndGetUID(account.email, account.password);
    results[account.name] = {
      email: account.email,
      uid: uid,
      success: !!uid
    };
  }
  
  console.log('\n=== Results Summary ===');
  console.table(results);
  
  console.log('\n=== Update Mock Data ===');
  console.log('Copy these UIDs to services/hybridAuthService.ts:');
  
  Object.entries(results).forEach(([name, data]) => {
    if (data.success) {
      console.log(`'${data.uid}': { // ${name}`);
      console.log(`  id: '${data.uid}',`);
      console.log(`  name: '${name}',`);
      console.log(`  email: '${data.email}',`);
      console.log(`  role: '${name.toLowerCase().includes('admin') ? 'admin' : name.toLowerCase().includes('teacher') ? 'teacher' : 'student'}' as const,`);
      console.log(`  status: 'active',`);
      console.log(`  avatarUrl: '',`);
      console.log(`  createdAt: new Date().toISOString(),`);
      console.log(`  updatedAt: new Date().toISOString()`);
      console.log(`},`);
    }
  });
}

// Run the tests
testAllAccounts(); 