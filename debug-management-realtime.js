// SKILLUP Management Panels - Real-time Debug Console Script
// Paste this into your browser console on the SKILLUP dashboard

console.log('🔍 SKILLUP Management Panels - Real-time Debug Console');

// Function to test API endpoints with authentication
async function testManagementAPIs() {
  const token = localStorage.getItem('skillup_token');
  const API_BASE_URL = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';
  
  console.log('🔐 Authentication Check:');
  console.log('- Has token:', !!token);
  console.log('- Token length:', token ? token.length : 0);
  console.log('- Token valid format:', token ? (token.includes('.') && token.length > 100) : false);
  
  if (!token) {
    console.error('❌ No authentication token found. Please log in first.');
    return;
  }
  
  const commonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Test endpoints
  const endpoints = [
    { name: 'Test Endpoint', url: `${API_BASE_URL}/test`, expected: 200 },
    { name: 'Potential Students', url: `${API_BASE_URL}/users?status=potential,contacted`, expected: 200 },
    { name: 'Waiting List', url: `${API_BASE_URL}/users?status=studying`, expected: 200 },
    { name: 'All Users', url: `${API_BASE_URL}/users`, expected: 200 }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🧪 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: endpoint.name === 'Test Endpoint' ? {} : commonHeaders
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success:`, {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          sample: Array.isArray(data) && data.length > 0 ? data[0] : data
        });
      } else {
        const errorText = await response.text();
        console.error(`   ❌ Error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
      }
    } catch (error) {
      console.error(`   💥 Request failed:`, error);
    }
  }
}

// Function to monitor real-time errors
function monitorErrors() {
  console.log('👀 Starting error monitoring...');
  
  // Override console.error to catch and display errors
  const originalError = console.error;
  console.error = function(...args) {
    if (args[0] && args[0].includes && (args[0].includes('users') || args[0].includes('500'))) {
      console.log('🚨 DETECTED MANAGEMENT PANEL ERROR:', args);
    }
    originalError.apply(console, args);
  };
  
  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    return originalFetch(url, options).then(response => {
      if (url.includes('/api/users') && !response.ok) {
        console.log('🚨 DETECTED API ERROR:', {
          url,
          status: response.status,
          statusText: response.statusText,
          options
        });
      }
      return response;
    }).catch(error => {
      if (url.includes('/api/users')) {
        console.log('🚨 DETECTED FETCH ERROR:', {
          url,
          error: error.message,
          options
        });
      }
      throw error;
    });
  };
  
  console.log('✅ Error monitoring active. Will log any management panel errors.');
}

// Function to refresh management panels
function refreshPanels() {
  console.log('🔄 Attempting to refresh management panels...');
  
  // Try to trigger a refresh if the functions are available
  if (window.debugManagementPanels) {
    console.log('Found debug functions, running diagnostics...');
    return window.debugManagementPanels.runDiagnostics();
  } else {
    console.log('Debug functions not found. Try reloading the page and running this script again.');
  }
}

// Auto-run basic checks
console.log('\n🚀 Running automatic checks...');
testManagementAPIs();
monitorErrors();

// Make functions available globally
window.managementDebug = {
  testAPIs: testManagementAPIs,
  monitorErrors: monitorErrors,
  refreshPanels: refreshPanels,
  checkToken: () => {
    const token = localStorage.getItem('skillup_token');
    console.log('Token analysis:', {
      exists: !!token,
      length: token?.length,
      format: token ? (token.startsWith('eyJ') ? 'JWT' : 'Custom') : 'None',
      valid: token ? (token.includes('.') && token.length > 100) : false
    });
  }
};

console.log('\n✅ Debug tools loaded! Available commands:');
console.log('- managementDebug.testAPIs() - Test all API endpoints');
console.log('- managementDebug.monitorErrors() - Start error monitoring'); 
console.log('- managementDebug.refreshPanels() - Refresh management panels');
console.log('- managementDebug.checkToken() - Analyze authentication token');