# Firebase Setup Guide

## Quick Fix for Login Issues

### Option 1: Create Accounts Manually (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `skillup-3beaf`

2. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Users" tab

3. **Add Users Manually**
   - Click "Add User" button
   - Create these accounts:

   **Admin Account:**
   - Email: `admin@admin.skillup`
   - Password: `Skillup@123`
   - Display Name: `SkillUp Admin`

   **Teacher Account:**
   - Email: `teacher-jenny@teacher.skillup`
   - Password: `Skillup@123`
   - Display Name: `Jenny Teacher`

   **Student Accounts:**
   - Email: `student-alice@student.skillup`
   - Password: `Skillup123`
   - Display Name: `Alice Student`

   - Email: `student-bob@student.skillup`
   - Password: `Skillup123`
   - Display Name: `Bob Student`

4. **Test Login**
   - Go back to your app
   - Try logging in with any of these accounts
   - The app will automatically create user profiles

### Option 2: Use Existing Accounts

If you already have accounts in Firebase:

1. **Check Existing UIDs**
   - Go to Firebase Console > Authentication > Users
   - Note the UIDs of your existing accounts

2. **Update Mock Data**
   - Edit `services/hybridAuthService.ts`
   - Update the `MOCK_USERS` object with the correct UIDs

### Option 3: Automatic Fallback (Current Setup)

The current code now has a fallback system:
- If a Firebase account exists but isn't in the mock data
- It will automatically create a user profile based on the email
- Role is determined by email pattern (admin/teacher/student)

## Testing

After creating the accounts:

1. **Start the app:**
   ```bash
   cd C:\Users\ADMIN\SKILLUP
   npm run dev
   ```

2. **Test login with:**
   - Admin: `admin@admin.skillup` / `Skillup@123`
   - Teacher: `teacher-jenny@teacher.skillup` / `Skillup@123`
   - Students: `student-alice@student.skillup` / `Skillup123`

3. **Check browser console** for any error messages

## Troubleshooting

- **"Invalid credentials"**: Account doesn't exist in Firebase Auth
- **"User profile not found"**: Account exists but UID doesn't match mock data
- **Network errors**: Check Firebase configuration

## Next Steps

Once login works:
1. Test all features (dashboard, assignments, etc.)
2. Create real student accounts as needed
3. Deploy to production when ready 