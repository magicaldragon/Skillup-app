// Test script to verify backend API endpoints
const API_BASE = 'https://skillup-backend-v6vm.onrender.com/api';

async function testAPI() {
  console.log('Testing SKILLUP Backend API...\n');

  // Test 1: Basic connectivity
  try {
    const response = await fetch(`${API_BASE}/test`);
    const data = await response.json();
    console.log('✅ Basic connectivity:', data.message);
  } catch (error) {
    console.log('❌ Basic connectivity failed:', error.message);
  }

  // Test 2: CORS test
  try {
    const response = await fetch(`${API_BASE}/cors-test`);
    const data = await response.json();
    console.log('✅ CORS test:', data.message);
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }

  // Test 3: Classes endpoint
  try {
    const response = await fetch(`${API_BASE}/classes`);
    const data = await response.json();
    console.log('✅ Classes endpoint:', data.success ? 'Working' : 'Failed');
    if (data.classes) {
      console.log(`   Found ${data.classes.length} classes`);
    }
  } catch (error) {
    console.log('❌ Classes endpoint failed:', error.message);
  }

  // Test 4: Assignments endpoint
  try {
    const response = await fetch(`${API_BASE}/assignments`);
    const data = await response.json();
    console.log('✅ Assignments endpoint:', data.success ? 'Working' : 'Failed');
    if (data.assignments) {
      console.log(`   Found ${data.assignments.length} assignments`);
    }
  } catch (error) {
    console.log('❌ Assignments endpoint failed:', error.message);
  }

  // Test 5: Submissions endpoint
  try {
    const response = await fetch(`${API_BASE}/submissions`);
    const data = await response.json();
    console.log('✅ Submissions endpoint:', data.success ? 'Working' : 'Failed');
    if (data.submissions) {
      console.log(`   Found ${data.submissions.length} submissions`);
    }
  } catch (error) {
    console.log('❌ Submissions endpoint failed:', error.message);
  }

  console.log('\n🎉 API testing complete!');
}

// Run the test
testAPI().catch(console.error); 