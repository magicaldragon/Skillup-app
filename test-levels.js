// Test script to check levels API endpoint
const fetch = require('node-fetch');

async function testLevelsAPI() {
  try {
    console.log('Testing levels API endpoint...');
    
    // Test without authentication first
    const response = await fetch('https://skillup-backend-v6vm.onrender.com/api/levels', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLevelsAPI(); 