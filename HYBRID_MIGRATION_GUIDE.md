# SKILLUP Hybrid Authentication Guide
## Firebase Auth + MongoDB Atlas

## Overview
This guide covers the hybrid approach using **Firebase Authentication** (free, unlimited) + **MongoDB Atlas** (free tier) for data storage, avoiding Firestore's limitations and international payment issues.

## Why This Approach?

### ✅ **Benefits:**
- **Firebase Auth**: Free, unlimited users, no payment issues
- **MongoDB Atlas**: Free tier, no international payment restrictions
- **Best of both worlds**: Firebase's excellent auth + MongoDB's flexible data storage
- **Cost-effective**: Both services have generous free tiers
- **Scalable**: Can upgrade MongoDB Atlas when needed

### ❌ **Firestore Limitations:**
- 1GB storage limit
- 50,000 reads/day limit
- 20,000 writes/day limit
- Requires international payment for upgrades

## Architecture

```
Frontend → Firebase Auth (Login/Logout) → MongoDB Atlas (User Data)
```

1. **Authentication**: Firebase Auth handles login/logout
2. **User Data**: MongoDB stores user profiles, roles, etc.
3. **Application Data**: MongoDB stores assignments, submissions, classes, etc.

## Setup Instructions

### 1. Firebase Setup (Keep Existing)

Your Firebase config is already set up. Keep using it for authentication:

```typescript
// services/firebase.ts (example)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "skillup-3beaf.firebaseapp.com",
  projectId: "skillup-3beaf",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 2. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account** (free)
2. **Create Cluster** (M0 - Free tier)
3. **Get Connection String**
4. **Create `.env` file**:

```env
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_HOST>/<DB_NAME>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 3. Create Users in Firebase Auth

Go to Firebase Console → Authentication → Users and create:

1. **Admin**: `skillup-admin@teacher.skillup` / `Skillup@123`
2. **Teacher**: `teacher-jenny@teacher.skillup` / `Skillup@123`
3. **Student 1**: `student-alice@student.skillup` / `Skillup123`
4. **Student 2**: `student-bob@student.skillup` / `Skillup123`

### 4. Get Firebase UIDs

For each user in Firebase Console, copy the UID and update the seed script:

```javascript
// backend/scripts/seedHybridUsers.js
const initialUsers = [
  {
    firebaseUid: 'actual-firebase-uid-here', // Replace with real UID
    name: 'skillup-admin',
    email: 'skillup-admin@teacher.skillup',
    // ...
  }
];
```

### 5. Install Backend Dependencies

```bash
cd backend
npm install
```

### 6. Seed Users

```bash
npm run seed:hybrid
```

### 7. Start Backend

```bash
npm run dev
```

## API Endpoints

### Authentication (Firebase + MongoDB)
- `POST /api/auth/login` - Firebase login + MongoDB user data
- `POST /api/auth/logout` - Firebase logout
- `GET /api/auth/profile` - Get MongoDB user profile

### Users
- `GET /api/users/firebase/:firebaseUid` - Get user by Firebase UID
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

## Frontend Integration

### Use Hybrid Auth Service

```typescript
// Instead of pure MongoDB auth
import { hybridAuthService } from './services/hybridAuthService';

// Login
const response = await hybridAuthService.login(email, password);

// Get current user
const user = hybridAuthService.getCurrentUser();

// Logout
await hybridAuthService.logout();
```

### Update Login Component

```typescript
// Login.tsx
import { hybridAuthService } from './services/hybridAuthService';

const handleLogin = async (email: string, password: string) => {
  const response = await hybridAuthService.login(email, password);
  if (response.success) {
    // User logged in successfully
  }
};
```

## Migration Steps

### 1. Keep Firebase Auth
- ✅ Already working
- ✅ No changes needed

### 2. Migrate User Data to MongoDB
- ✅ User model updated
- ✅ Firebase UID linking
- ✅ Seed script ready

### 3. Migrate Application Data
- 🔄 Assignments → MongoDB
- 🔄 Submissions → MongoDB
- 🔄 Classes → MongoDB
- 🔄 Audit logs → MongoDB

### 4. Update Frontend
- 🔄 Use hybrid auth service
- 🔄 Update data fetching to MongoDB APIs

## Cost Comparison

### Firebase (Current)
- **Auth**: Free ✅
- **Firestore**: $25/month after free tier ❌
- **Total**: $25/month

### Hybrid Approach
- **Firebase Auth**: Free ✅
- **MongoDB Atlas**: Free (M0 tier) ✅
- **Total**: $0/month ✅

### MongoDB Atlas Free Tier Limits
- **Storage**: 512MB (shared)
- **Connections**: 500
- **No payment required** ✅

## Security Benefits

### Firebase Auth
- ✅ Built-in security features
- ✅ Password reset, email verification
- ✅ Multi-factor authentication
- ✅ OAuth providers (Google, Facebook, etc.)

### MongoDB Atlas
- ✅ Built-in encryption
- ✅ Network access controls
- ✅ Database user management
- ✅ Audit logging

## Troubleshooting

### Common Issues

1. **Firebase UID Not Found**
   - Check if user exists in Firebase Auth
   - Verify UID in MongoDB matches Firebase UID

2. **MongoDB Connection Error**
   - Check connection string
   - Verify network access in MongoDB Atlas

3. **Authentication Failed**
   - Check Firebase Auth configuration
   - Verify user exists in both Firebase and MongoDB

## Next Steps

1. **Test the hybrid approach** with existing Firebase users
2. **Migrate application data** (assignments, submissions, classes)
3. **Update frontend components** to use MongoDB APIs
4. **Deploy to production** with MongoDB Atlas

## Benefits Summary

- ✅ **No international payment issues**
- ✅ **Free tier for both services**
- ✅ **Better scalability**
- ✅ **More flexible data storage**
- ✅ **Keep existing Firebase Auth**
- ✅ **Easy migration path** 