// Debug Authentication Issues Script
// Run this in the browser console after logging in to diagnose authentication problems

console.log('🔍 SKILLUP Authentication Debug Console');
console.log('========================================');

// 1. Check environment configuration
console.log('\n📋 Environment Configuration:');
const envConfig = {
  'API_BASE_URL': import.meta.env.VITE_API_BASE_URL || 'Not set',
  'MODE': import.meta.env.MODE || 'Not set',
  'DEV': import.meta.env.DEV || false,
  'Current Domain': window.location.hostname,
  'Current Protocol': window.location.protocol,
  'Current URL': window.location.href
};
console.table(envConfig);

// 2. Check authentication state
console.log('\n🔐 Authentication State:');
const authState = {
  'Local Storage Token': localStorage.getItem('skillup_token') ? 'Present' : 'Missing',
  'Local Storage User': localStorage.getItem('skillup_user') ? 'Present' : 'Missing',
  'Token Length': localStorage.getItem('skillup_token')?.length || 0,
  'Token Type': localStorage.getItem('skillup_token')?.includes('.') ? 'JWT-like' : 'Base64 Session'
};
console.table(authState);

// 3. Test token validity
const token = localStorage.getItem('skillup_token');
if (token) {
  console.log('\n🔑 Token Analysis:');
  console.log('Token preview:', `${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
  
  try {
    // Try to decode if it's a base64 session token
    const decoded = JSON.parse(atob(token));
    console.log('Session token decoded successfully:', {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp,
      'Is Expired': decoded.exp < Math.floor(Date.now() / 1000),
      'Expires At': new Date(decoded.exp * 1000).toLocaleString()
    });
  } catch (e) {
    console.log('Not a base64 session token, likely Firebase ID token');
  }
}

// 4. Test API endpoints
async function testAPIEndpoints() {
  const baseUrls = [
    'https://us-central1-skillup-3beaf.cloudfunctions.net/api',
    '/api'
  ];
  
  console.log('\n🧪 Testing API Endpoints:');
  
  for (const baseUrl of baseUrls) {
    console.log(`\n📡 Testing with base URL: ${baseUrl}`);
    
    const endpoints = [
      { name: 'Health Check', path: '/health' },
      { name: 'Test Endpoint', path: '/test' },
      { name: 'Profile', path: '/auth/profile' },
      { name: 'Users', path: '/users' },
      { name: 'Classes', path: '/classes' },
      { name: 'Potential Students', path: '/users?status=potential,contacted' },
      { name: 'Waiting List', path: '/users?status=studying' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const endTime = performance.now();
        
        console.log(`${endpoint.name}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          responseTime: `${(endTime - startTime).toFixed(2)}ms`,
          url: response.url
        });
        
        if (!response.ok && response.status !== 404) {
          try {
            const errorText = await response.text();
            console.log(`  Error details:`, errorText);
          } catch (e) {
            console.log(`  Could not read error response`);
          }
        }
      } catch (error) {
        console.log(`${endpoint.name}: FAILED`, error.message);
      }
    }
  }
}

// 5. Test class creation specifically
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
    
    console.log('Levels fetch:', {
      status: levelsResponse.status,
      ok: levelsResponse.ok
    });
    
    if (levelsResponse.ok) {
      const levelsData = await levelsResponse.json();
      console.log('Levels data:', levelsData);
      
      // Try to create a test class if we have levels
      if (levelsData && Array.isArray(levelsData) && levelsData.length > 0) {
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
        
        console.log('Class creation response:', {
          status: createResponse.status,
          ok: createResponse.ok
        });
        
        const responseData = await createResponse.json();
        console.log('Class creation response data:', responseData);
      }
    }
  } catch (error) {
    console.error('Class creation test failed:', error);
  }
}

// 6. Run all tests
async function runAllTests() {
  if (!token) {
    console.error('❌ No authentication token found. Please log in first.');
    return;
  }
  
  await testAPIEndpoints();
  await testClassCreation();
  
  console.log('\n✅ Debug analysis complete!');
  console.log('Check the console output above for any issues.');
}

// Auto-run the tests
runAllTests();