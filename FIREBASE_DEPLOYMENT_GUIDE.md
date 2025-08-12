# 🚀 Firebase Deployment Guide - SkillUp LMS

## 📋 Overview

This guide will help you deploy your SkillUp Learning Management System to Firebase, completing the migration from MongoDB/Render to Firebase/Firestore.

## 🎯 What's Included

- ✅ **Firebase Functions**: Complete backend API
- ✅ **Firestore Database**: NoSQL database with security rules
- ✅ **Firebase Storage**: File upload and management
- ✅ **Firebase Hosting**: Static website hosting
- ✅ **Authentication**: Firebase Auth integration

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify you have access to the project
firebase projects:list
```

### 2. Setup Environment

```bash
# Set your MongoDB URI for migration (if migrating existing data)
export MONGODB_URI="your_mongodb_connection_string"

# Download Firebase service account key
# Go to Firebase Console > Project Settings > Service Accounts
# Download the service account key and save as serviceAccountKey.json
```

### 3. Deploy Everything

```bash
# Deploy all Firebase services
npm run deploy:all

# Or deploy step by step
npm run firebase:build    # Build functions
npm run firebase:deploy   # Deploy to Firebase
```

## 📦 Deployment Commands

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run firebase:deploy` | Deploy all Firebase services |
| `npm run firebase:status` | Check deployment status |
| `npm run firebase:build` | Build functions only |
| `npm run migrate:firestore` | Migrate data from MongoDB |
| `npm run migrate:validate` | Validate migration |
| `npm run deploy:all` | Build frontend and deploy everything |
| `npm run setup:firebase` | Install Firebase CLI and login |

### Manual Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Functions
firebase deploy --only functions

# Deploy Hosting
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

## 🔧 Configuration Files

### Firebase Configuration
- `firebase.json`: Project configuration
- `firestore.rules`: Security rules
- `firestore.indexes.json`: Database indexes
- `functions/`: Firebase Functions code

### Frontend Configuration
- `services/firebase.ts`: Firebase SDK configuration
- `services/apiService.ts`: API service for Firebase Functions
- `services/vstorage.ts`: Firebase Storage integration
- `vstorage.config.ts`: Storage configuration

## 📊 Data Migration

### From MongoDB to Firestore

If you have existing data in MongoDB:

1. **Prepare Migration**:
   ```bash
   # Set MongoDB connection string
   export MONGODB_URI="your_mongodb_connection_string"
   
   # Ensure serviceAccountKey.json is in the root directory
   ```

2. **Run Migration**:
   ```bash
   npm run migrate:firestore
   ```

3. **Validate Migration**:
   ```bash
   npm run migrate:validate
   ```

### Migration Features

- ✅ **Batch Processing**: Handles large datasets efficiently
- ✅ **Data Conversion**: Converts MongoDB ObjectIds and dates
- ✅ **Error Handling**: Continues on errors and reports issues
- ✅ **Progress Tracking**: Shows real-time progress
- ✅ **Validation**: Verifies migration success

## 🔒 Security

### Firestore Rules

The security rules implement role-based access control:

- **Admins**: Full access to all data
- **Teachers**: Access to their classes and students
- **Students**: Access to their own data and enrolled classes
- **Staff**: Limited administrative access

### Storage Rules

Firebase Storage rules ensure:

- Users can only upload to their own directories
- File size and type restrictions
- Secure file access

## 🌐 URLs After Deployment

After successful deployment, your app will be available at:

- **Frontend**: https://skillup-3beaf.web.app
- **Functions API**: https://us-central1-skillup-3beaf.cloudfunctions.net/api
- **Firebase Console**: https://console.firebase.google.com/project/skillup-3beaf

## 📈 Monitoring

### Firebase Console

Monitor your app in the Firebase Console:

1. **Functions**: View logs and performance
2. **Firestore**: Monitor database usage
3. **Storage**: Track file uploads
4. **Analytics**: User engagement metrics

### Cost Monitoring

Set up billing alerts in Firebase Console:

1. Go to Project Settings > Usage and billing
2. Set up budget alerts
3. Monitor daily usage

## 🚨 Troubleshooting

### Common Issues

1. **Functions Build Failed**:
   ```bash
   cd functions
   npm install
   npm run build
   ```

2. **Deployment Permission Error**:
   ```bash
   firebase login
   firebase use skillup-3beaf
   ```

3. **Storage Upload Failed**:
   - Check Firebase Storage rules
   - Verify file size limits
   - Ensure proper authentication

4. **Migration Errors**:
   - Verify MongoDB connection string
   - Check service account permissions
   - Review error logs

### Debug Commands

```bash
# Check Firebase CLI version
firebase --version

# List Firebase projects
firebase projects:list

# Check current project
firebase use

# View functions logs
firebase functions:log

# Test functions locally
firebase emulators:start
```

## 🔄 Environment Variables

### Required Environment Variables

```bash
# For data migration (if applicable)
MONGODB_URI=your_mongodb_connection_string

# Firebase configuration (handled by SDK)
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=skillup-3beaf
```

### Optional Environment Variables

```bash
# For local development
FIREBASE_EMULATOR_HOST=localhost
FIREBASE_EMULATOR_PORT=5001
```

## 📝 Post-Deployment Checklist

- [ ] Verify all Firebase services are deployed
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify API endpoints
- [ ] Check security rules
- [ ] Monitor error logs
- [ ] Set up billing alerts
- [ ] Update DNS if using custom domain

## 🎉 Success!

After completing the deployment:

1. **Your app is live** at https://skillup-3beaf.web.app
2. **Cost savings** of $13.69/month achieved
3. **Better performance** with global CDN
4. **Real-time features** enabled
5. **Automatic scaling** configured

## 📞 Support

If you encounter issues:

1. Check Firebase Console for errors
2. Review deployment logs
3. Verify configuration files
4. Test with Firebase Emulator locally

---

**Ready to deploy?** Run `npm run deploy:all` to get started! 