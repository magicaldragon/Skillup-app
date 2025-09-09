// Test class creation functionality
// Run this in the browser console when logged in

async function testClassCreation() {
  console.log('🔍 Testing class creation functionality...');
  
  const token = localStorage.getItem('skillup_token');
  if (!token) {
    console.error('❌ No authentication token found');
    return;
  }
  
  const baseUrl = 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';
  
  try {
    // 1. First, test authentication
    console.log('1️⃣ Testing authentication...');
    const authResponse = await fetch(`${baseUrl}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!authResponse.ok) {
      console.error('❌ Authentication failed:', authResponse.status, authResponse.statusText);
      return;
    }
    
    const userProfile = await authResponse.json();
    console.log('✅ Authentication successful:', userProfile);
    console.log('👤 User role:', userProfile.role);
    
    // 2. Fetch levels
    console.log('2️⃣ Fetching levels...');
    const levelsResponse = await fetch(`${baseUrl}/levels`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!levelsResponse.ok) {
      console.error('❌ Levels fetch failed:', levelsResponse.status, levelsResponse.statusText);
      const errorText = await levelsResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const levelsData = await levelsResponse.json();
    console.log('✅ Levels fetched successfully:', levelsData);
    
    let levels = [];
    if (Array.isArray(levelsData)) {
      levels = levelsData;
    } else if (levelsData.success && Array.isArray(levelsData.levels)) {
      levels = levelsData.levels;
    } else {
      console.error('❌ Unexpected levels data format:', levelsData);
      return;
    }
    
    if (levels.length === 0) {
      console.error('❌ No levels available for testing');
      return;
    }
    
    console.log(`📚 Found ${levels.length} levels:`, levels.map(l => l.name));
    
    // 3. Test class creation
    console.log('3️⃣ Testing class creation...');
    const testClassData = {
      levelId: levels[0]._id || levels[0].id,
      startingDate: new Date().toISOString().split('T')[0] // Today's date
    };
    
    console.log('📝 Class creation data:', testClassData);
    
    const createResponse = await fetch(`${baseUrl}/classes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testClassData)
    });
    
    console.log('📡 Class creation response status:', createResponse.status, createResponse.statusText);
    
    const responseData = await createResponse.json();
    console.log('📊 Class creation response data:', responseData);
    
    if (createResponse.ok && responseData.success) {
      console.log('✅ Class creation SUCCESSFUL!');
      console.log(`🎉 New class created: ${responseData.class.classCode}`);
      console.log('📋 Class details:', responseData.class);
    } else {
      console.error('❌ Class creation FAILED');
      console.error(`🚫 Error: ${responseData.message || 'Unknown error'}`);
      
      if (createResponse.status === 403) {
        console.error('🔒 Permission denied. Your role may not have class creation permissions.');
        console.error('Required role: admin or teacher');
        console.error('Your role:', userProfile.role);
      }
    }
    
  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testClassCreation();