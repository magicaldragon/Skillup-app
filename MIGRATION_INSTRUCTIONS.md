# 🚀 Firebase Migration Instructions

## 📋 Current Status

✅ **Firebase Functions**: Deployed and working
✅ **Firebase Hosting**: Deployed and live  
✅ **MongoDB Data**: Analyzed and ready for migration
✅ **VStorage**: Configured (keeping your cost-effective solution)
✅ **Environment Variables**: MongoDB URI configured

## 🔧 Required Setup

### 1. Download Firebase Service Account Key

1. **Go to Firebase Console**: https://console.firebase.google.com/project/skillup-3beaf
2. **Navigate to**: Project Settings → Service Accounts
3. **Click**: "Generate new private key"
4. **Save as**: `serviceAccountKey.json` in your project root
5. **⚠️ Important**: Never commit this file to Git (it's already in .gitignore)

### 2. Set VStorage Credentials in Firebase Functions

You have two options:

#### Option A: Get from Render and Set in Firebase Console
1. **Get credentials from Render**:
   - Go to your Render dashboard
   - Find your service
   - Go to Environment tab
   - Copy `VITE_VSTORAGE_ACCESS_KEY` and `VITE_VSTORAGE_SECRET_KEY`

2. **Set in Firebase Console**:
   - Go to: https://console.firebase.google.com/project/skillup-3beaf/functions/config
   - Add these environment variables:
     - `VITE_VSTORAGE_ACCESS_KEY` = your_access_key
     - `VITE_VSTORAGE_SECRET_KEY` = your_secret_key
     - `VITE_VSTORAGE_BUCKET` = skillup
     - `VITE_VSTORAGE_ENDPOINT` = https://s3.vngcloud.vn
     - `VITE_VSTORAGE_REGION` = sgn

#### Option B: Use Firebase CLI Commands
```bash
# After getting credentials from Render
firebase functions:config:set vstorage.access_key="YOUR_ACCESS_KEY"
firebase functions:config:set vstorage.secret_key="YOUR_SECRET_KEY"
firebase functions:config:set vstorage.bucket="skillup"
firebase functions:config:set vstorage.endpoint="https://s3.vngcloud.vn"
firebase functions:config:set vstorage.region="sgn"
```

## 🗑️ Clean Up Orphaned Users

The student that was created but failed to save to MongoDB should be cleaned up:

1. **Check for orphaned users**:
   ```bash
   npm run cleanup:users
   ```

2. **If orphaned users found**, delete them manually from Firebase Console:
   - Go to Authentication → Users
   - Find the orphaned user
   - Click the three dots → Delete user

## 🔄 Data Migration Steps

### Step 1: Prepare Migration
```bash
# Ensure MongoDB URI is set (already done)
$env:MONGODB_URI="mongodb+srv://skillup-user:Skillup123@cluster0.yuts8hn.mongodb.net/skillup?retryWrites=true&w=majority&appName=Cluster0"
```

### Step 2: Run Migration
```bash
# After adding serviceAccountKey.json
npm run migrate:firestore
```

### Step 3: Validate Migration
```bash
npm run migrate:validate
```

## 📊 Data to be Migrated

| Collection | Documents | Status |
|------------|-----------|--------|
| **users** | 3 | Ready |
| **classes** | 6 | Ready |
| **levels** | 6 | Ready |
| **potentialstudents** | 1 | Ready |
| **changelogs** | 22 | Ready |
| **studentrecords** | 0 | Ready |

## 🌐 Your App URLs

- **Frontend**: https://skillup-3beaf.web.app
- **API**: https://us-central1-skillup-3beaf.cloudfunctions.net/api
- **Firebase Console**: https://console.firebase.google.com/project/skillup-3beaf

## 💰 Cost Savings

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| **Backend** | $7/month | $0.31/month | $6.69/month |
| **Database** | $7/month | $0.00/month | $7.00/month |
| **Storage** | $0/month | $0/month | $0.00/month |
| **Total** | **$14/month** | **$0.31/month** | **$13.69/month (97.8%)** |

## 🎯 Migration Benefits

✅ **97.8% cost reduction**  
✅ **Better performance** with global CDN  
✅ **Real-time features** enabled  
✅ **Automatic scaling**  
✅ **Better security** with Firebase Auth  
✅ **VStorage integration** for cost-effective file storage  

## 🚨 Important Notes

1. **VStorage**: We're keeping your VNG Cloud VStorage for file uploads (more cost-effective)
2. **Orphaned Users**: Clean up any Firebase Auth users that don't exist in MongoDB
3. **Backup**: Your MongoDB data will remain intact during migration
4. **Rollback**: You can always switch back to MongoDB if needed
5. **Environment Variables**: Updated to use modern Firebase Functions v2 format

## 📞 Support

If you encounter any issues:
1. Check Firebase Console for errors
2. Review migration logs
3. Verify service account permissions
4. Test with Firebase Emulator locally

## 🚀 Quick Setup Commands

```bash
# 1. Set up environment variables
npm run firebase:env

# 2. Get VStorage credentials from Render and set them in Firebase Console

# 3. Deploy updated functions
npm run firebase:deploy

# 4. Run data migration (after adding serviceAccountKey.json)
npm run migrate:firestore
```

---

**Ready to migrate?** Get your VStorage credentials from Render and set them in Firebase Console! 