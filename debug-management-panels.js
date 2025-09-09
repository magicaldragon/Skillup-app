// Debug script to test management panel API calls
// Run this in the browser console on the SKILLUP admin dashboard

console.log('🔍 SKILLUP Management Panels Debug Script');

// 1. Check environment variables
console.log('📊 Environment Variables:');
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('Dev:', import.meta.env.DEV);

// 2. Check authentication token
const token = localStorage.getItem('skillup_token');
console.log('🔐 Authentication:');
console.log('Has token:', !!token);
console.log('Token prefix:', token ? token.substring(0, 20) + '...' : 'none');

// 3. Test API base URL resolution
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
console.log('🌐 Resolved API Base URL:', API_BASE_URL);

// 4. Test basic connectivity
async function testConnectivity() {
  console.log('🧪 Testing API Connectivity...');
  
  try {
    const testUrl = `${API_BASE_URL}/test`;
    console.log('Testing URL:', testUrl);
    
    const response = await fetch(testUrl);
    const data = await response.json();
    console.log('✅ Test endpoint response:', data);
  } catch (error) {
    console.error('❌ Test endpoint failed:', error);
  }
}

// 5. Test potential students API
async function testPotentialStudentsAPI() {
  console.log('🎓 Testing Potential Students API...');
  
  if (!token) {
    console.error('❌ No authentication token found');
    return;
  }
  
  try {
    const url = `${API_BASE_URL}/users?status=potential,contacted`;
    console.log('API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
    } else {
      const data = await response.json();
      console.log('✅ Potential Students Data:', {
        count: Array.isArray(data) ? data.length : 'not array',
        sample: Array.isArray(data) && data.length > 0 ? data[0] : 'no data',
        fullData: data
      });
    }
  } catch (error) {
    console.error('❌ Potential Students API failed:', error);
  }
}

// 6. Test waiting list API
async function testWaitingListAPI() {
  console.log('⏳ Testing Waiting List API...');
  
  if (!token) {
    console.error('❌ No authentication token found');
    return;
  }
  
  try {
    const url = `${API_BASE_URL}/users?status=studying`;
    console.log('API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
    } else {
      const data = await response.json();
      console.log('✅ Waiting List Data:', {
        count: Array.isArray(data) ? data.length : 'not array',
        sample: Array.isArray(data) && data.length > 0 ? data[0] : 'no data',
        fullData: data
      });
    }
  } catch (error) {
    console.error('❌ Waiting List API failed:', error);
  }
}

// 7. Test all users API (for debugging)
async function testAllUsersAPI() {
  console.log('👥 Testing All Users API...');
  
  if (!token) {
    console.error('❌ No authentication token found');
    return;
  }
  
  try {
    const url = `${API_BASE_URL}/users`;
    console.log('API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
    } else {
      const data = await response.json();
      console.log('✅ All Users Data:', {
        count: Array.isArray(data) ? data.length : 'not array',
        statuses: Array.isArray(data) ? [...new Set(data.map(u => u.status))] : 'no data',
        sample: Array.isArray(data) && data.length > 0 ? data[0] : 'no data'
      });
    }
  } catch (error) {
    console.error('❌ All Users API failed:', error);
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('🚀 Starting diagnostics...');
  await testConnectivity();
  await testAllUsersAPI();
  await testPotentialStudentsAPI();
  await testWaitingListAPI();
  console.log('✅ Diagnostics complete!');
}

// Export functions for manual testing
window.debugManagementPanels = {
  runDiagnostics,
  testConnectivity,
  testPotentialStudentsAPI,
  testWaitingListAPI,
  testAllUsersAPI
};

console.log('🎯 Debug functions available on window.debugManagementPanels');
console.log('Run: debugManagementPanels.runDiagnostics()');