# Manual Admin Email Update Guide

Since the automated script requires Firebase service account credentials, here's how to manually update the admin email:

## Option 1: Firebase Console (Recommended)

### 1. Update Firebase Auth
1. Go to [Firebase Console](https://console.firebase.google.com/project/skillup-3beaf/overview)
2. Navigate to **Authentication** → **Users**
3. Find the user with email `skillup-admin@teacher.skillup`
4. Click on the user to edit
5. Change the email to `admin@admin.skillup`
6. Save the changes

### 2. Update Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Navigate to the `users` collection
3. Find the document with email `skillup-admin@teacher.skillup`
4. Edit the document and change the email field to `admin@admin.skillup`
5. Update the `updatedAt` field to the current timestamp
6. Save the document

## Option 2: Using Firebase CLI (if you have access)

```bash
# Update Firebase Auth user
firebase auth:update-user skillup-admin@teacher.skillup --email admin@admin.skillup

# Update Firestore document (you'll need to do this manually in console)
```

## Option 3: Create New Admin User

If the above doesn't work, you can:

1. **Create a new admin user** in Firebase Console:
   - Email: `admin@admin.skillup`
   - Password: `Skillup@123`
   - Display Name: `SkillUp Admin`

2. **Add the user to Firestore**:
   ```json
   {
     "email": "admin@admin.skillup",
     "firebaseUid": "[new-firebase-uid]",
     "name": "SkillUp Admin",
     "role": "admin",
     "status": "active",
     "createdAt": "[timestamp]",
     "updatedAt": "[timestamp]"
   }
   ```

## Verification

After updating:

1. **Test login** with `admin@admin.skillup` / `Skillup@123`
2. **Verify role assignment** - should show as "admin"
3. **Check greeting** - should show English name if available
4. **Test settings** - should be able to edit personal information

## Current Status

✅ **Frontend deployed** with updated settings panel
✅ **Backend updated** with new role assignment logic
✅ **Documentation updated** with new admin email
⏳ **Database update** - needs to be done manually

## Next Steps

1. Update the admin email in Firebase Console
2. Test the new login credentials
3. Verify all functionality works correctly
4. Update any remaining references if needed 