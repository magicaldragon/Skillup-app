# SKILLUP Management Panels - Diagnostic & Setup Guide

## 🔧 Issues Identified & Fixed

### 1. **API URL Configuration Fixed**
- **Problem**: Panels were using `/api` fallback instead of full Firebase Functions URL
- **Fix**: Updated both panels to use full Firebase Functions URL as fallback
- **Files**: `PotentialStudentsPanel.tsx`, `WaitingListPanel.tsx`

### 2. **Enhanced Authentication & Error Handling**
- **Problem**: Weak token validation and generic error messages
- **Fix**: Added comprehensive token validation and specific error handling
- **Features**:
  - Token format validation
  - 401/403 specific error handling
  - Automatic token cleanup on authentication failure
  - Enhanced logging for debugging

### 3. **Improved API Request Headers**
- **Problem**: Missing Content-Type headers
- **Fix**: Added proper headers for all API requests
- **Headers**: `Authorization: Bearer {token}`, `Content-Type: application/json`

## 🧪 Manual Setup & Verification Steps

### Step 1: Check Environment Variables
1. Open your browser and navigate to the SKILLUP admin dashboard
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this command to check environment:
```javascript
console.log('Environment check:', {
  'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
  'MODE': import.meta.env.MODE,
  'Current URL': window.location.href
});
```

### Step 2: Test Authentication Token
1. In the console, run:
```javascript
const token = localStorage.getItem('skillup_token');
console.log('Token check:', {
  'Has token': !!token,
  'Token length': token ? token.length : 0,
  'Token format valid': token ? token.includes('.') && token.length > 100 : false,
  'Token prefix': token ? token.substring(0, 20) + '...' : 'none'
});
```

### Step 3: Test API Connectivity
1. Copy and paste the debug script from `debug-management-panels.js` into console
2. Run: `debugManagementPanels.runDiagnostics()`
3. Check the output for any API errors

### Step 4: Check Firebase Functions Status
1. Visit: https://us-central1-skillup-3beaf.cloudfunctions.net/api/test
2. Should return: `{"status":"connected","timestamp":"...","message":"Backend is reachable"}`

### Step 5: Verify User Data in Database
If you need to check if users exist in the database:

1. **Check via API** (in browser console):
```javascript
fetch('https://us-central1-skillup-3beaf.cloudfunctions.net/api/users', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('skillup_token')}` }
})
.then(r => r.json())
.then(users => {
  console.log('All users:', users.length);
  console.log('Status breakdown:', users.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {}));
});
```

## 🔍 Troubleshooting Common Issues

### Issue: "No authentication token found"
**Solutions**:
1. Log out and log back in
2. Clear browser cache and localStorage
3. Check if the login process is working correctly

### Issue: "Authentication failed" (401 error)
**Solutions**:
1. Token has expired - log in again
2. Firebase Auth configuration issue
3. Backend authentication middleware issue

### Issue: "Access denied" (403 error)
**Solutions**:
1. User role doesn't have permission
2. Check user role in database: should be `admin`, `teacher`, or `staff`

### Issue: "Failed to fetch" or Network errors
**Solutions**:
1. Check internet connection
2. Verify Firebase Functions are deployed and running
3. Check CORS configuration in Firebase Functions

### Issue: Empty data returned
**Solutions**:
1. No users with required status in database
2. Check database for users with status `potential`, `contacted`, or `studying`
3. Use "Sync Existing Students" button in Potential Students panel

## 🛠️ Manual Database Setup (if needed)

If you need to manually create test data:

### Create Test Potential Students:
```javascript
// Run this in Firebase Console > Firestore
// Add to 'users' collection:
{
  name: "Test Student 1",
  email: "teststudent1@student.skillup",
  role: "student",
  status: "potential",
  gender: "male",
  parentName: "Test Parent",
  parentPhone: "0123456789",
  studentCode: "STU-001",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Create Test Waiting List Students:
```javascript
// Add to 'users' collection:
{
  name: "Test Student 2",
  email: "teststudent2@student.skillup", 
  role: "student",
  status: "studying",
  gender: "female",
  parentName: "Test Parent 2",
  parentPhone: "0987654321",
  studentCode: "STU-002",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## 📋 Final Verification Checklist

- [ ] Environment variables are correctly set
- [ ] Authentication token is valid and not expired
- [ ] Firebase Functions are accessible and responding
- [ ] User has appropriate role (admin/teacher/staff)
- [ ] Test data exists in database with correct statuses
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows successful API calls (200 status)

## 🆘 If Issues Persist

If you still encounter issues after following this guide, please:

1. Share the console output from running the diagnostic script
2. Check the Network tab in DevTools for failed requests
3. Verify your user role in the Firebase Console
4. Ensure Firebase Functions are properly deployed and configured

The enhanced error handling will now provide much clearer error messages to help identify specific issues.