# 🚀 Complete MongoDB Hybrid Authentication Setup Guide

## **✅ What's Been Set Up**

### **1. Hybrid Authentication System**
- ✅ Firebase Auth for login/logout
- ✅ MongoDB Atlas for user data storage
- ✅ Automatic username generation
- ✅ Default password assignment
- ✅ Complete user registration flow

### **2. User Registration Features**
- ✅ **Automatic Username Generation**: `staff-johndoe-1234` or `student-johndoe-1234`
- ✅ **Automatic Email Generation**: `staff-johndoe-1234@teacher.skillup` or `student-johndoe-1234@student.skillup`
- ✅ **Default Passwords**: 
  - Teachers/Admins: `Skillup@123`
  - Students: `Skillup123`
- ✅ **Firebase + MongoDB Integration**: Creates account in both systems
- ✅ **Real-time Credentials Preview**: Shows generated credentials before submission

## **🔧 How to Check Current Accounts in MongoDB**

### **Method 1: Using the Script (Recommended)**
```bash
cd backend
npm run list-users
```

This will show:
- All user details
- Role counts
- Firebase UIDs
- Creation dates

### **Method 2: MongoDB Atlas Dashboard**
1. Go to your MongoDB Atlas dashboard
2. Click **"Browse Collections"** in your Cluster0
3. Navigate to your database (likely `skillup`)
4. Click on the `users` collection
5. View all user documents

### **Method 3: API Endpoint**
```bash
curl http://localhost:3000/api/users
# Requires admin authentication
```

## **📋 Complete Setup Steps**

### **Step 1: Environment Variables**

**Backend `.env` file (example):**
```env
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_HOST>/<DB_NAME>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

**Frontend `.env` file:**
```env
VITE_API_URL=http://localhost:3000/api
```

### **Step 2: Start Backend**
```bash
cd backend
npm install
npm run dev
```

### **Step 3: Start Frontend**
```bash
# In root directory
npm install
npm run dev
```

### **Step 4: Test the System**

1. **Check Current Users:**
   ```bash
   cd backend
   npm run list-users
   ```

2. **Test Login:**
   - Go to `http://localhost:5173`
   - Try logging in with existing credentials

3. **Test User Registration:**
   - Login as admin
   - Go to "Add New Member" panel
   - Fill in the form
   - Check the credentials preview
   - Submit and verify user creation

## **🎯 User Registration Flow**

### **For Teachers/Admins:**
1. **Input**: Full name (e.g., "John Doe")
2. **Generated Username**: `staff-johndoe-1234`
3. **Generated Email**: `staff-johndoe-1234@teacher.skillup`
4. **Default Password**: `Skillup@123`

### **For Students:**
1. **Input**: Full name (e.g., "Jane Smith")
2. **Generated Username**: `student-janesmith-5678`
3. **Generated Email**: `student-janesmith-5678@student.skillup`
4. **Default Password**: `Skillup123`

## **🔍 Testing Commands**

### **1. Check Backend Health**
```bash
curl http://localhost:3000/api/test
# Should return: {"success":true,"message":"Backend API is working and connected to MongoDB!"}
```

### **2. List All Users**
```bash
cd backend
npm run list-users
```

### **3. Check Specific User**
```bash
curl http://localhost:3000/api/users/firebase/YOUR_FIREBASE_UID
```

### **4. Check Email Exists**
```bash
curl http://localhost:3000/api/users/check-email/test@example.com
```

## **📊 Expected Database Structure**

Your MongoDB `users` collection should contain documents like:
```json
{
  "_id": "ObjectId(...)",
  "name": "John Doe",
  "username": "staff-johndoe-1234",
  "email": "staff-johndoe-1234@teacher.skillup",
  "role": "teacher",
  "firebaseUid": "firebase_uid_here",
  "status": "active",
  "phone": "0123456789",
  "englishName": "John",
  "dob": "1990-01-01",
  "gender": "male",
  "note": "New teacher",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## **🚨 Troubleshooting**

### **Issue 1: "User profile not found"**
**Solution:**
1. Check if user exists in Firebase Auth
2. Verify Firebase UID matches MongoDB record
3. Run `npm run list-users` to see current users

### **Issue 2: "Email already exists"**
**Solution:**
1. The system automatically adds timestamps to ensure uniqueness
2. Check if the email is actually in use
3. Use the email check API: `/api/users/check-email/email@example.com`

### **Issue 3: "Firebase auth error"**
**Solution:**
1. Verify Firebase project configuration
2. Check if user exists in Firebase Auth
3. Ensure Firebase Auth is enabled in Firebase Console

### **Issue 4: "MongoDB connection error"**
**Solution:**
1. Check MongoDB Atlas connection string
2. Verify IP whitelist in MongoDB Atlas
3. Ensure cluster is running

## **✅ Success Indicators**

- ✅ Backend starts without errors
- ✅ MongoDB connection successful
- ✅ User registration works
- ✅ Generated credentials are unique
- ✅ Users can log in immediately after registration
- ✅ User data persists in MongoDB
- ✅ Firebase Auth integration works

## **🎉 What You Can Do Now**

1. **Add New Members**: Use the "Add New Member" panel
2. **View All Users**: Run `npm run list-users`
3. **Test Login**: Use generated credentials
4. **Manage Users**: Through the admin interface
5. **Scale Up**: Add more users as needed

## **📈 Next Steps**

1. **Test with Real Users**: Add actual teachers and students
2. **Customize Passwords**: Modify default password generation if needed
3. **Add More Fields**: Extend user profile as needed
4. **Deploy to Production**: Move to production MongoDB Atlas cluster
5. **Add Email Notifications**: Send credentials to new users

Your MongoDB hybrid authentication system is now fully functional! 🎉 