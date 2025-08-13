// Test script to verify login process functionality
// Run this in the browser console or as a Node.js script

const testLoginProcess = async () => {
  console.log('🧪 Starting login process test...');

  const testResults = {
    firebaseConfig: false,
    authService: false,
    tokenStorage: false,
    profileFetch: false,
    logout: false,
  };

  try {
    // Test 1: Check Firebase configuration
    console.log('1️⃣ Testing Firebase configuration...');
    if (typeof firebase !== 'undefined' && firebase.auth) {
      testResults.firebaseConfig = true;
      console.log('✅ Firebase configuration valid');
    } else {
      console.log('❌ Firebase configuration invalid');
    }

    // Test 2: Check authService availability
    console.log('2️⃣ Testing authService availability...');
    if (typeof authService !== 'undefined') {
      testResults.authService = true;
      console.log('✅ authService available');
    } else {
      console.log('❌ authService not available');
    }

    // Test 3: Check localStorage state
    console.log('3️⃣ Testing localStorage state...');
    const token = localStorage.getItem('skillup_token');
    const user = localStorage.getItem('skillup_user');

    if (token && user) {
      testResults.tokenStorage = true;
      console.log('✅ Authentication tokens found in localStorage');
      console.log('Token preview:', `${token.substring(0, 20)}...`);
      console.log('User data:', JSON.parse(user));
    } else {
      console.log('ℹ️ No authentication tokens found (user not logged in)');
    }

    // Test 4: Test profile fetch if authenticated
    if (token) {
      console.log('4️⃣ Testing profile fetch...');
      try {
        const profile = await authService.getProfile();
        if (profile) {
          testResults.profileFetch = true;
          console.log('✅ Profile fetch successful:', profile);
        } else {
          console.log('❌ Profile fetch failed');
        }
      } catch (error) {
        console.log('❌ Profile fetch error:', error.message);
      }
    }

    // Test 5: Test logout functionality
    console.log('5️⃣ Testing logout functionality...');
    try {
      await authService.logout();
      const tokenAfterLogout = localStorage.getItem('skillup_token');
      const userAfterLogout = localStorage.getItem('skillup_user');

      if (!tokenAfterLogout && !userAfterLogout) {
        testResults.logout = true;
        console.log('✅ Logout successful - localStorage cleared');
      } else {
        console.log('❌ Logout failed - localStorage not cleared');
      }
    } catch (error) {
      console.log('❌ Logout error:', error.message);
    }
  } catch (error) {
    console.error('Test execution error:', error);
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Login process is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }

  return testResults;
};

// Export for Node.js or make available globally for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testLoginProcess };
} else {
  window.testLoginProcess = testLoginProcess;
}

console.log('🧪 Login process test script loaded. Run testLoginProcess() to start testing.');
