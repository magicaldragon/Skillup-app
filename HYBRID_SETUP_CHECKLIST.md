# 🔧 Hybrid Authentication Setup Checklist

## **Critical Issues Fixed ✅**
- ✅ Fixed Login.tsx to use `hybridAuthService` instead of `authService`
- ✅ Fixed App.tsx to use `hybridAuthService` instead of `authService`
- ✅ Fixed backend route order for Firebase UID lookup
- ✅ All authentication calls now use the correct hybrid service

## **Required Setup Steps**

### **1. Environment Variables**

Create `.env` file in **backend** directory:
```env
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_HOST>/<DB_NAME>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

Create `.env` file in **frontend** directory (if not exists):
```env
VITE_API_URL=http://localhost:3000/api
```

### **2. Firebase Setup**

1. **Keep existing Firebase config** in `services/firebase.ts`
2. **Create users in Firebase Auth Console**:
   - Go to Firebase Console → Authentication → Users
   - Add user manually for each:
     - `admin@admin.skillup` / `Skillup@123`
     - `teacher-jenny@teacher.skillup` / `Skillup@123`
     - `student-alice@student.skillup` / `Skillup123`
     - `student-bob@student.skillup` / `Skillup123`

3. **Get Firebase UIDs**:
   - For each user in Firebase Console, copy the UID
   - Update `backend/scripts/seedHybridUsers.js` with real UIDs

### **3. MongoDB Atlas Setup**

1. **Create MongoDB Atlas Account** (free)
2. **Create M0 Cluster** (free tier)
3. **Get Connection String**
4. **Update `.env` file** with connection string

### **4. Backend Setup**

```bash
cd backend
npm install
npm run seed:hybrid  # After updating Firebase UIDs
npm run dev
```

### **5. Frontend Setup**

```bash
# In root directory
npm install
npm run dev
```

## **Testing the Hybrid Login**

### **Test 1: Backend Connection**
```bash
curl http://localhost:3000/api/test
# Should return: {"success":true,"message":"Backend API is working and connected to MongoDB!"}
```

### **Test 2: MongoDB User Lookup**
```bash
curl http://localhost:3000/api/users/firebase/YOUR_FIREBASE_UID
# Should return user data or 404 if not found
```

### **Test 3: Frontend Login**
1. Open browser to `http://localhost:5173`
2. Try logging in with demo credentials
3. Check browser console for any errors

## **Common Issues & Solutions**

### **Issue 1: "User profile not found"**
**Cause:** Firebase UID doesn't match MongoDB record
**Solution:** 
1. Check Firebase Console for correct UID
2. Update `seedHybridUsers.js` with correct UID
3. Re-run `npm run seed:hybrid`

### **Issue 2: "Network error"**
**Cause:** Backend not running or CORS issue
**Solution:**
1. Ensure backend is running on port 3000
2. Check `VITE_API_URL` in frontend `.env`
3. Verify CORS is enabled in backend

### **Issue 3: "MongoDB connection error"**
**Cause:** Invalid connection string or network access
**Solution:**
1. Check MongoDB Atlas connection string
2. Verify IP whitelist in MongoDB Atlas
3. Check network connectivity

### **Issue 4: "Firebase auth error"**
**Cause:** User doesn't exist in Firebase Auth
**Solution:**
1. Create user in Firebase Console
2. Verify email/password match
3. Check Firebase project configuration

## **Debug Steps**

### **1. Check Backend Logs**
```bash
cd backend
npm run dev
# Look for connection messages and errors
```

### **2. Check Frontend Console**
- Open browser DevTools
- Check Console tab for errors
- Check Network tab for failed requests

### **3. Verify Environment Variables**
```bash
# Backend
echo $MONGODB_URI
echo $JWT_SECRET

# Frontend
echo $VITE_API_URL
```

### **4. Test API Endpoints**
```bash
# Test backend health
curl http://localhost:3000/

# Test MongoDB connection
curl http://localhost:3000/api/test

# Test user lookup (replace with real Firebase UID)
curl http://localhost:3000/api/users/firebase/test-uid
```

## **Expected Flow**

1. **User enters credentials** → Login.tsx
2. **Firebase Auth validates** → Firebase Auth service
3. **Get Firebase UID** → From Firebase response
4. **Lookup user in MongoDB** → `/api/users/firebase/:uid`
5. **Return user data** → With role, permissions, etc.
6. **Store in localStorage** → For session persistence
7. **Redirect to dashboard** → Based on user role

## **Success Indicators**

✅ **Backend starts without errors**
✅ **MongoDB connection successful**
✅ **Firebase Auth works**
✅ **User lookup returns data**
✅ **Login redirects to dashboard**
✅ **User data persists on refresh**

## **Next Steps After Setup**

1. **Test all user roles** (admin, teacher, student)
2. **Verify logout functionality**
3. **Test session persistence**
4. **Migrate application data** (assignments, submissions, etc.)
5. **Deploy to production**

## **Files Modified**

- ✅ `Login.tsx` - Fixed import and service calls
- ✅ `App.tsx` - Fixed import and service calls  
- ✅ `backend/routes/users.js` - Fixed route order
- ✅ `services/hybridAuthService.ts` - Created hybrid service
- ✅ `backend/models/User.js` - Added Firebase UID support
- ✅ `backend/scripts/seedHybridUsers.js` - Created seed script 