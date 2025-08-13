# Manual Admin Account Setup Guide

## 🎯 **Simple Solution: Create New Admin Account**

Since the current admin account has `@teacher.skillup` domain causing role confusion, let's create a fresh admin account with the correct domain.

## 📋 **Option 1: Run the Sync Script (Recommended)**

### Prerequisites:
1. Make sure you have the Firebase service account key file: `serviceAccountKey.json`
2. Place it in the root directory of your project

### Steps:
1. **Navigate to scripts directory:**
   ```bash
   cd scripts
   ```

2. **Run the sync script:**
   ```bash
   node syncAllUsersToFirestore.js
   ```

### What this script does:
- ✅ Creates new admin account: `admin@admin.skillup`
- ✅ Syncs ALL existing Firebase Auth users to Firestore
- ✅ Fixes role assignments based on email domains
- ✅ Updates existing users with correct roles
- ✅ Provides detailed summary of all changes

## 📋 **Option 2: Manual Firebase Console Setup**

### Step 1: Create Admin User in Firebase Auth
1. Go to [Firebase Console](https://console.firebase.google.com/project/skillup-3beaf/authentication/users)
2. Click **"Add User"**
3. Enter:
   - **Email:** `admin@admin.skillup`
   - **Password:** `Skillup@123`
   - **Display Name:** `SkillUp Admin`
4. Click **"Add user"**

### Step 2: Create User Document in Firestore
1. Go to [Firestore Database](https://console.firebase.google.com/project/skillup-3beaf/firestore/data)
2. Navigate to `users` collection
3. Click **"Start collection"** (if users collection doesn't exist)
4. **Document ID:** Use the Firebase Auth UID (copy from Auth console)
5. **Fields:**
   ```json
   {
     "firebaseUid": "[UID from Auth]",
     "email": "admin@admin.skillup",
     "name": "SkillUp Admin",
     "englishName": "Admin",
     "username": "admin",
     "role": "admin",
     "status": "active",
     "createdAt": "[timestamp]",
     "updatedAt": "[timestamp]"
   }
   ```

## 🎯 **Expected Results**

After running the script or manual setup:

### ✅ **New Admin Account:**
- **Email:** `admin@admin.skillup`
- **Password:** `Skillup@123`
- **Role:** `admin`
- **Status:** `active`

### ✅ **Role Assignment Logic:**
- `@admin.skillup` → `admin` role
- `@teacher.skillup` → `teacher` role
- `@staff.skillup` → `staff` role
- `@student.skillup` → `student` role

## 🔍 **Verification Steps**

1. **Login with new credentials:**
   - Email: `admin@admin.skillup`
   - Password: `Skillup@123`

2. **Check role assignment:**
   - Should see "admin" role in dashboard
   - Should have access to admin debug panel

3. **Test functionality:**
   - Settings panel should work
   - All admin features should be accessible

## 🚨 **Important Notes**

- The old `skillup-admin@teacher.skillup` account will still exist but won't cause confusion
- The new admin account will have the correct role assignment
- All existing users will be synced to Firestore automatically
- Role assignments will be corrected based on email domains

## 🆘 **Troubleshooting**

### If script fails:
1. Check that `serviceAccountKey.json` exists in root directory
2. Verify Firebase project permissions
3. Check console for specific error messages

### If login fails:
1. Verify user was created in Firebase Auth
2. Check Firestore document exists
3. Ensure role field is set to "admin"

**This approach is much simpler and more reliable than trying to fix the existing account!** 🎉 