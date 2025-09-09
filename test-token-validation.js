// SKILLUP Token Validation and Class Creation Test Script
// Run this in browser console after logging in as admin

console.log('🔍 SKILLUP Token Validation & Class Creation Test');
console.log('=================================================');

// 1. Check token format and validity
const token = localStorage.getItem('skillup_token');
if (!token) {
  console.error('❌ No token found. Please log in first.');
  throw new Error('No authentication token');
}

console.log('\n🔑 Token Analysis:');
console.log('Token length:', token.length);
console.log('Token preview:', `${token.substring(0, 20)}...${token.substring(token.length - 10)}`);

// Check if it's a session token (base64) or JWT token
let tokenType = 'Unknown';
let tokenData = null;

try {
  // Try to decode as base64 session token
  tokenData = JSON.parse(atob(token));
  tokenType = 'Base64 Session Token';
  console.log('✅ Session token decoded successfully:', {
    uid: tokenData.uid,
    email: tokenData.email,
    role: tokenData.role,
    userId: tokenData.userId,
    exp: tokenData.exp,
    'Is Expired': tokenData.exp < Math.floor(Date.now() / 1000),
    'Expires At': new Date(tokenData.exp * 1000).toLocaleString()
  });
} catch (e) {
  if (token.includes('.')) {
    tokenType = 'JWT Token';
    console.log('✅ Detected JWT token format');
  } else {
    console.log('❓ Unknown token format');
  }
}

console.log('Token Type:', tokenType);

// 2. Test Authentication with Backend
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication:');
  
  const endpoints = [
    { name: 'Profile', url: '/auth/profile' },
    { name: 'Permissions', url: '/auth/permissions' },
    { name: 'Users', url: '/users' },
    { name: 'Levels', url: '/levels' },
    { name: 'Classes', url: '/classes' }
  ];
  
  const baseUrl = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${endpoint.name}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`${endpoint.name}: FAILED - ${error.message}`);
    }
  }
}

// 3. Test Potential Students Panel API
async function testPotentialStudents() {
  console.log('\n👥 Testing Potential Students API:');
  
  // Simulate the same validation logic as PotentialStudentsPanel
  if (token.length < 50) {
    console.error('❌ Token validation failed (length < 50)');
    return;
  }
  
  console.log('✅ Token validation passed');
  
  const apiUrl = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/users?status=potential,contacted';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Data:', {
        type: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A'
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

// 4. Test Waiting List Panel API
async function testWaitingList() {
  console.log('\n⏳ Testing Waiting List API:');
  
  // Simulate the same validation logic as WaitingListPanel
  if (token.length < 50) {
    console.error('❌ Token validation failed (length < 50)');
    return;
  }
  
  console.log('✅ Token validation passed');
  
  const apiUrl = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api/users?status=studying';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Data:', {
        type: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A'
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

// 5. Test Class Creation
async function testClassCreation() {
  console.log('\n🏫 Testing Class Creation:');
  
  const baseUrl = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';
  
  // First, get levels
  try {
    const levelsResponse = await fetch(`${baseUrl}/levels`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Levels fetch result:', {
      status: levelsResponse.status,
      ok: levelsResponse.ok
    });
    
    if (!levelsResponse.ok) {
      const errorText = await levelsResponse.text();
      console.log('❌ Levels fetch failed:', errorText);
      return;
    }
    
    const levelsData = await levelsResponse.json();
    console.log('Levels data:', {
      type: typeof levelsData,
      isArray: Array.isArray(levelsData),
      length: Array.isArray(levelsData) ? levelsData.length : 'N/A'
    });
    
    // Test class creation if we have levels
    if (Array.isArray(levelsData) && levelsData.length > 0) {
      const testClassData = {
        levelId: levelsData[0]._id || levelsData[0].id,
        startingDate: new Date().toISOString().split('T')[0]
      };
      
      console.log('Attempting to create test class with data:', testClassData);
      
      const createResponse = await fetch(`${baseUrl}/classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testClassData)
      });
      
      console.log('Class creation result:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        ok: createResponse.ok
      });
      
      const responseData = await createResponse.json();
      console.log('Class creation response:', responseData);
      
      if (createResponse.ok && responseData.success) {
        console.log('✅ Class created successfully!', responseData.class);
      } else {
        console.log('❌ Class creation failed:', responseData.message);
      }
    } else {
      console.log('❌ No levels available for testing');
    }
  } catch (error) {
    console.error('❌ Class creation test failed:', error);
  }
}

// 6. Run all tests
async function runAllTests() {
  await testAuthentication();
  await testPotentialStudents();
  await testWaitingList();
  await testClassCreation();
  
  console.log('\n✅ All tests completed!');
  console.log('Check the results above for any issues.');
  console.log('\nIf you see 401 errors, the token validation fixes may need more time to deploy.');
  console.log('If you see other errors, please share this output for debugging.');
}

// Auto-run all tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});