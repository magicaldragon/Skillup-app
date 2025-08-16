// testLevels.js - Test script to verify levels functionality
const fetch = require('node-fetch');

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/skillup-xxxxx/us-central1/api';

async function testLevelsFunctionality() {
  console.log('🧪 Testing Levels Functionality...\n');

  try {
    // Test 1: Fetch existing levels
    console.log('1️⃣ Testing: Fetch existing levels');
    const levelsResponse = await fetch(`${API_BASE_URL}/levels`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // This will be handled by Firebase Auth
      },
    });

    if (levelsResponse.ok) {
      const levelsData = await levelsResponse.json();
      console.log('✅ Levels fetched successfully');
      console.log(`📊 Found ${levelsData.levels?.length || 0} levels in database`);
      
      if (levelsData.levels && levelsData.levels.length > 0) {
        console.log('📋 Current levels:');
        levelsData.levels.forEach((level, index) => {
          console.log(`   ${index + 1}. ${level.name} (${level.code})`);
        });
      }
    } else {
      console.log('❌ Failed to fetch levels:', levelsResponse.status);
    }

    // Test 2: Create a new test level
    console.log('\n2️⃣ Testing: Create new level');
    const newLevelData = {
      name: 'TEST LEVEL',
      code: 'TEST',
      description: 'Test level for verification',
      isActive: true,
      order: 999,
    };

    const createResponse = await fetch(`${API_BASE_URL}/levels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify(newLevelData),
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Test level created successfully');
      console.log('📝 Created level ID:', createData.level?.id);
      
      // Test 3: Verify the new level appears in the list
      console.log('\n3️⃣ Testing: Verify new level in list');
      const verifyResponse = await fetch(`${API_BASE_URL}/levels`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const testLevel = verifyData.levels?.find(l => l.name === 'TEST LEVEL');
        if (testLevel) {
          console.log('✅ Test level found in database');
          console.log('📋 Test level details:', {
            id: testLevel.id,
            name: testLevel.name,
            code: testLevel.code,
            description: testLevel.description,
          });
        } else {
          console.log('❌ Test level not found in database');
        }
      }
    } else {
      console.log('❌ Failed to create test level:', createResponse.status);
      const errorData = await createResponse.json().catch(() => ({}));
      console.log('Error details:', errorData);
    }

    console.log('\n🎉 Levels functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testLevelsFunctionality(); 