// Test script to check if the management panels API is working
// Copy and paste this into your browser console

const API_BASE_URL = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

async function testAPI() {
  const token = localStorage.getItem('skillup_token');
  console.log('🔍 Testing API with token:', token ? `${token.substring(0, 10)}...` : 'No token found');
  
  if (!token) {
    console.error('❌ No token found. Please log in first.');
    return;
  }

  try {
    // Test Potential Students API
    console.log('🧪 Testing Potential Students API...');
    const potentialResponse = await fetch(`${API_BASE_URL}/users?status=potential,contacted`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Potential Students Response:', {
      status: potentialResponse.status,
      statusText: potentialResponse.statusText,
      ok: potentialResponse.ok
    });
    
    if (potentialResponse.ok) {
      const potentialData = await potentialResponse.json();
      console.log('✅ Potential Students Data:', {
        count: Array.isArray(potentialData) ? potentialData.length : 'Not an array',
        data: potentialData
      });
    } else {
      const errorText = await potentialResponse.text();
      console.error('❌ Potential Students Error:', errorText);
    }

    // Test Waiting List API
    console.log('🧪 Testing Waiting List API...');
    const waitingResponse = await fetch(`${API_BASE_URL}/users?status=studying`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Waiting List Response:', {
      status: waitingResponse.status,
      statusText: waitingResponse.statusText,
      ok: waitingResponse.ok
    });
    
    if (waitingResponse.ok) {
      const waitingData = await waitingResponse.json();
      console.log('✅ Waiting List Data:', {
        count: Array.isArray(waitingData) ? waitingData.length : 'Not an array',
        data: waitingData
      });
    } else {
      const errorText = await waitingResponse.text();
      console.error('❌ Waiting List Error:', errorText);
    }

    // Test Records API
    console.log('🧪 Testing Records API...');
    const recordsResponse = await fetch(`${API_BASE_URL}/users?status=off,alumni`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Records Response:', {
      status: recordsResponse.status,
      statusText: recordsResponse.statusText,
      ok: recordsResponse.ok
    });
    
    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      console.log('✅ Records Data:', {
        count: Array.isArray(recordsData) ? recordsData.length : 'Not an array',
        data: recordsData
      });
    } else {
      const errorText = await recordsResponse.text();
      console.error('❌ Records Error:', errorText);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testAPI();