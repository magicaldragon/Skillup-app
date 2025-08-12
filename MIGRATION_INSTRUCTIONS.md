# 🚀 Firebase Migration Instructions

## 📋 Current Status

✅ **Firebase Functions**: Deployed and working
✅ **Firebase Hosting**: Deployed and live  
✅ **MongoDB Data**: Analyzed and ready for migration
✅ **VStorage**: Configured (keeping your cost-effective solution)

## 🔧 Required Setup

### 1. Download Firebase Service Account Key

1. **Go to Firebase Console**: https://console.firebase.google.com/project/skillup-3beaf
2. **Navigate to**: Project Settings → Service Accounts
3. **Click**: "Generate new private key"
4. **Save as**: `serviceAccountKey.json` in your project root
5. **⚠️ Important**: Never commit this file to Git (it's already in .gitignore)

### 2. Set VStorage Credentials (Optional)

If you want to use VStorage for file uploads, add these to your `.env` file:

```env
VITE_VSTORAGE_ACCESS_KEY=your_vng_cloud_access_key
VITE_VSTORAGE_SECRET_KEY=your_vng_cloud_secret_key
VITE_VSTORAGE_BUCKET=skillup
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
# Ensure MongoDB URI is set
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

## 📞 Support

If you encounter any issues:
1. Check Firebase Console for errors
2. Review migration logs
3. Verify service account permissions
4. Test with Firebase Emulator locally

---

**Ready to migrate?** Download the service account key and run `npm run migrate:firestore`! 