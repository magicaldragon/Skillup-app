# SKILLUP Authentication Migration Guide

## Overview
This guide covers the migration from Firebase Authentication to MongoDB + JWT authentication for the SKILLUP application.

## What's Been Migrated

### ✅ Completed
1. **Backend Authentication System**
   - MongoDB User model with password hashing
   - JWT-based authentication
   - Login/logout API endpoints
   - User management API endpoints

2. **Frontend Authentication Service**
   - New `authService.ts` replacing Firebase auth
   - JWT token management
   - Local storage for persistence

3. **Login Component**
   - Updated to use MongoDB backend
   - Demo credentials display
   - Error handling

4. **App Component**
   - Updated authentication flow
   - Removed Firebase dependencies

### 🔄 In Progress
- Data migration (assignments, submissions, classes, etc.)
- Dashboard data fetching from MongoDB

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 2. Seed Initial Users

```bash
cd backend
npm run seed
```

This will create the following users:
- **Admin**: admin@admin.skillup / Skillup@123
- **Teacher**: teacher-jenny@teacher.skillup / Skillup@123
- **Student 1**: student-alice@student.skillup / Skillup123
- **Student 2**: student-bob@student.skillup / Skillup123

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

### 4. Frontend Setup

Update your frontend environment variables (if needed):
```env
VITE_API_URL=http://localhost:3000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Migration Status

### ✅ Firebase → MongoDB
- [x] User authentication
- [x] User management
- [x] Password hashing
- [x] JWT tokens
- [x] Login/logout flow

### 🔄 Still Using Firebase (To Be Migrated)
- [ ] Assignments data
- [ ] Submissions data
- [ ] Classes data
- [ ] Audit logs
- [ ] File storage (VStorage is ready)

## Testing

1. Start the backend server
2. Run the seed script to create users
3. Open the frontend application
4. Try logging in with the demo credentials
5. Verify that authentication works correctly

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your `MONGODB_URI` in `.env`
   - Ensure MongoDB is running/accessible

2. **JWT Token Issues**
   - Verify `JWT_SECRET` is set in `.env`
   - Check token expiration (24h default)

3. **CORS Issues**
   - Backend has CORS enabled for all origins
   - Check if frontend URL matches backend CORS settings

4. **User Not Found**
   - Run the seed script to create initial users
   - Check if email/password match the seeded data

## Next Steps

1. **Data Migration**: Move assignments, submissions, and classes to MongoDB
2. **API Integration**: Update frontend to use MongoDB APIs instead of Firebase
3. **File Storage**: Complete VStorage integration for file uploads
4. **Testing**: Comprehensive testing of all features
5. **Deployment**: Deploy to Render with MongoDB Atlas

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Admin-only endpoints are properly protected
- Input validation is implemented
- Error messages don't expose sensitive information 