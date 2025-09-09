// COMPREHENSIVE AUTHENTICATION DIAGNOSTICS & FIXES
// This script addresses the specific authentication issues with Potential Students, Waiting List, and Class Creation

console.log('🔧 SKILLUP Authentication Issues - COMPREHENSIVE FIX');
console.log('==================================================');

// STEP 1: Check token format and validation
const token = localStorage.getItem('skillup_token');

if (!token) {
  console.error('❌ No authentication token found!');
  console.log('📋 Fix: Please log out and log back in to get a fresh token');
} else {
  console.log('✅ Token found');
  console.log(`📏 Token length: ${token.length} characters`);
  
  // Check token format
  let tokenType = 'Unknown';
  let tokenData = null;
  let isValidFormat = false;
  
  try {
    // Try to decode as base64 session token
    tokenData = JSON.parse(atob(token));
    tokenType = 'Base64 Session Token';
    isValidFormat = true;
    
    console.log('🎯 Token Type: Base64 Session Token');
    console.log('📊 Token Data:', {
      uid: tokenData.uid,
      email: tokenData.email,
      role: tokenData.role,
      userId: tokenData.userId,
      exp: tokenData.exp,
      'Is Expired': tokenData.exp < Math.floor(Date.now() / 1000),
      'Expires At': new Date(tokenData.exp * 1000).toLocaleString()
    });
    
    // Check if token is expired
    if (tokenData.exp < Math.floor(Date.now() / 1000)) {
      console.error('❌ TOKEN IS EXPIRED!');
      console.log('📋 Fix: Please log out and log back in to get a fresh token');
    }
    
  } catch (e) {
    if (token.includes('.')) {
      tokenType = 'JWT Token';
      isValidFormat = true;
      console.log('🎯 Token Type: JWT Token (Firebase ID Token)');
    } else {
      console.error('❌ Unknown token format!');
      console.log('📋 Fix: Clear localStorage and log in again');
    }
  }
  
  // STEP 2: Test current validation logic (should pass with length >= 50)
  console.log('\n🧪 Testing Current Validation Logic:');
  if (token.length >= 50) {
    console.log('✅ Token passes length validation (>= 50 characters)');
  } else {
    console.error('❌ Token fails length validation');
    console.log('📋 This means the token is too short and will be rejected');
  }
}

// STEP 3: Test API endpoints with current token
async function testAllEndpoints() {
  console.log('\n🌐 Testing API Endpoints:');
  
  const endpoints = [
    {
      name: 'Backend Health Check',
      url: 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/health',
      needsAuth: false
    },
    {
      name: 'Potential Students API',
      url: 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/users?status=potential,contacted',
      needsAuth: true
    },
    {
      name: 'Waiting List API', 
      url: 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/users?status=studying',
      needsAuth: true
    },
    {
      name: 'Levels API (for class creation)',
      url: 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/levels',
      needsAuth: true
    },
    {
      name: 'Classes API',
      url: 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/classes',
      needsAuth: true
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (endpoint.needsAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: headers
      });
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS - Data type: ${typeof data}, Length: ${Array.isArray(data) ? data.length : 'N/A'}`);
        
        if (endpoint.name.includes('Potential Students') && Array.isArray(data)) {
          console.log(`   📊 Found ${data.length} potential students`);
        } else if (endpoint.name.includes('Waiting List') && Array.isArray(data)) {
          console.log(`   📊 Found ${data.length} waiting list students`);
        } else if (endpoint.name.includes('Levels') && Array.isArray(data)) {
          console.log(`   📊 Found ${data.length} levels available for class creation`);
        } else if (endpoint.name.includes('Classes') && Array.isArray(data)) {
          console.log(`   📊 Found ${data.length} classes`);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ FAILED - Error: ${errorText}`);
        
        if (response.status === 401) {
          console.log('   🔧 This is an authentication error - token is invalid or expired');
        } else if (response.status === 403) {
          console.log('   🔧 This is a permission error - user role may be insufficient');
        } else if (response.status === 500) {
          console.log('   🔧 This is a server error - backend issue');
        }
      }
    } catch (error) {
      console.error(`❌ Network Error: ${error.message}`);
    }
  }
}

// STEP 4: Test class creation specifically
async function testClassCreation() {
  console.log('\n🏫 Testing Class Creation Process:');
  
  if (!token) {
    console.error('❌ Cannot test class creation without authentication token');
    return;
  }
  
  try {
    // First get levels
    console.log('1️⃣ Fetching available levels...');
    const levelsResponse = await fetch('https://us-central1-skillup-3beaf.cloudfunctions.net/api/levels', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!levelsResponse.ok) {
      console.error(`❌ Failed to fetch levels: ${levelsResponse.status} ${levelsResponse.statusText}`);
      const errorText = await levelsResponse.text();
      console.error(`   Error details: ${errorText}`);
      return;
    }
    
    const levels = await levelsResponse.json();
    console.log(`✅ Found ${Array.isArray(levels) ? levels.length : 0} levels`);
    
    if (!Array.isArray(levels) || levels.length === 0) {
      console.error('❌ No levels available for class creation');
      return;
    }
    
    // Try to create a test class
    console.log('2️⃣ Attempting to create test class...');
    const testClassData = {
      levelId: levels[0]._id || levels[0].id,
      startingDate: new Date().toISOString().split('T')[0] // Today's date
    };
    
    console.log(`   Using level: ${levels[0].name} (ID: ${testClassData.levelId})`);
    console.log(`   Starting date: ${testClassData.startingDate}`);
    
    const createResponse = await fetch('https://us-central1-skillup-3beaf.cloudfunctions.net/api/classes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testClassData)
    });
    
    console.log(`📡 Class creation response: ${createResponse.status} ${createResponse.statusText}`);
    
    const responseData = await createResponse.json();
    console.log('📊 Response data:', responseData);
    
    if (createResponse.ok && responseData.success) {
      console.log('✅ Class creation SUCCESSFUL!');
      console.log(`   New class: ${responseData.class.classCode}`);
    } else {
      console.error('❌ Class creation FAILED');
      console.error(`   Error: ${responseData.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`❌ Class creation test failed: ${error.message}`);
  }
}

// STEP 5: Provide specific fixes
function provideFixes() {
  console.log('\n🔧 SPECIFIC FIXES TO TRY:');
  console.log('========================');
  
  console.log('1️⃣ IMMEDIATE FIXES:');
  console.log('   • Clear browser cache (Ctrl+F5)');
  console.log('   • Log out completely and log back in');
  console.log('   • Clear localStorage: localStorage.clear()');
  
  console.log('\n2️⃣ IF ISSUES PERSIST:');
  console.log('   • Check if you have admin role permissions');
  console.log('   • Verify the Firebase Functions are deployed');
  console.log('   • Check browser Network tab for actual HTTP errors');
  
  console.log('\n3️⃣ TOKEN ISSUES:');
  if (token && token.length < 50) {
    console.log('   • TOKEN TOO SHORT - Log in again to get fresh token');
  }
  if (tokenData && tokenData.exp < Math.floor(Date.now() / 1000)) {
    console.log('   • TOKEN EXPIRED - Log in again to get fresh token');
  }
  if (tokenData && tokenData.role !== 'admin') {
    console.log('   • INSUFFICIENT ROLE - You need admin permissions');
  }
  
  console.log('\n4️⃣ IF STILL NOT WORKING:');
  console.log('   • Run this command in console: localStorage.removeItem("skillup_token")');
  console.log('   • Log out and log in again');
  console.log('   • Check that your user account has admin role in Firestore');
}

// Run all tests
async function runComprehensiveDiagnostics() {
  await testAllEndpoints();
  await testClassCreation();
  provideFixes();
  
  console.log('\n🏁 COMPREHENSIVE DIAGNOSTICS COMPLETE');
  console.log('=====================================');
  console.log('If all tests show SUCCESS ✅, the authentication issues should be resolved.');
  console.log('If you see FAILED ❌ results, follow the specific fixes provided above.');
}

// Auto-run the comprehensive diagnostics
runComprehensiveDiagnostics();