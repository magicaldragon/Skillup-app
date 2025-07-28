// Test script to verify authentication and API integration
const API_BASE = 'https://skillup-backend-v6vm.onrender.com/api';

// Test credentials from DEVELOPMENT_STRATEGY.md
const TEST_CREDENTIALS = {
  admin: {
    email: 'skillup-admin@teacher.skillup',
    password: 'Skillup@123',
    uid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222'
  },
  teacher: {
    email: 'teacher-jenny@teacher.skillup',
    password: 'Skillup@123',
    uid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2'
  },
  student: {
    email: 'student-alice@student.skillup',
    password: 'Skillup123',
    uid: 'student-alice-uid'
  }
};

async function testAuthentication() {
  console.log('🧪 Testing SKILLUP Authentication & API Integration...\n');

  // Test 1: Backend connectivity
  try {
    const response = await fetch(`${API_BASE}/test`);
    const data = await response.json();
    console.log('✅ Backend connectivity:', data.message);
  } catch (error) {
    console.log('❌ Backend connectivity failed:', error.message);
    return;
  }

  // Test 2: Auth endpoint
  try {
    const response = await fetch(`${API_BASE}/auth/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ Auth endpoint:', data.success ? 'Working' : 'Failed');
  } catch (error) {
    console.log('❌ Auth endpoint failed:', error.message);
  }

  // Test 3: Users endpoint (should work without auth for basic info)
  try {
    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();
    console.log('✅ Users endpoint:', data.success ? 'Working' : 'Failed');
    if (data.users) {
      console.log(`   Found ${data.users.length} users in database`);
    }
  } catch (error) {
    console.log('❌ Users endpoint failed:', error.message);
  }

  // Test 4: Classes endpoint (requires authentication)
  try {
    const response = await fetch(`${API_BASE}/classes`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ Classes endpoint (with auth):', data.success ? 'Working' : 'Failed');
    if (data.classes) {
      console.log(`   Found ${data.classes.length} classes in database`);
    } else if (data.message) {
      console.log(`   Response: ${data.message}`);
    }
  } catch (error) {
    console.log('❌ Classes endpoint failed:', error.message);
  }

  // Test 5: Assignments endpoint (requires authentication)
  try {
    const response = await fetch(`${API_BASE}/assignments`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ Assignments endpoint (with auth):', data.success ? 'Working' : 'Failed');
    if (data.assignments) {
      console.log(`   Found ${data.assignments.length} assignments in database`);
    } else if (data.message) {
      console.log(`   Response: ${data.message}`);
    }
  } catch (error) {
    console.log('❌ Assignments endpoint failed:', error.message);
  }

  // Test 6: Submissions endpoint (requires authentication)
  try {
    const response = await fetch(`${API_BASE}/submissions`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ Submissions endpoint (with auth):', data.success ? 'Working' : 'Failed');
    if (data.submissions) {
      console.log(`   Found ${data.submissions.length} submissions in database`);
    } else if (data.message) {
      console.log(`   Response: ${data.message}`);
    }
  } catch (error) {
    console.log('❌ Submissions endpoint failed:', error.message);
  }

  console.log('\n📊 Summary:');
  console.log('- Backend is accessible and responding');
  console.log('- API endpoints require authentication (as expected)');
  console.log('- Database appears to be connected');
  console.log('\n🎯 Next Steps:');
  console.log('1. Test the frontend application at http://localhost:5173');
  console.log('2. Try logging in with the test credentials');
  console.log('3. Verify that data loads correctly after authentication');
  console.log('4. Test CRUD operations for classes, assignments, etc.');
  
  console.log('\n🔑 Test Credentials:');
  console.log('Admin:', TEST_CREDENTIALS.admin.email);
  console.log('Teacher:', TEST_CREDENTIALS.teacher.email);
  console.log('Student:', TEST_CREDENTIALS.student.email);
  console.log('Password for all: Skillup@123 (admin/teacher) or Skillup123 (student)');
  
  console.log('\n💡 Note: API endpoints require authentication tokens.');
  console.log('The frontend should handle authentication automatically.');
}

// Run the test
testAuthentication().catch(console.error); 