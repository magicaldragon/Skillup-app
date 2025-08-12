# 🔐 VStorage Setup Guide for Firebase

## 📋 Current Status

✅ **Backend**: Firebase Functions (https://us-central1-skillup-3beaf.cloudfunctions.net/api)  
✅ **Frontend**: Firebase Hosting (https://skillup-3beaf.web.app)  
✅ **Database**: MongoDB analyzed (ready for migration to Firestore)  
⚠️ **VStorage**: Credentials need to be configured  

## 🚀 Setting Up VStorage in Firebase Console

### Step 1: Get VStorage Credentials from Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your service** (the one that has VStorage credentials)
3. **Click on the service** → **Environment** tab
4. **Copy these values**:
   - `VITE_VSTORAGE_ACCESS_KEY`
   - `VITE_VSTORAGE_SECRET_KEY`

### Step 2: Set Credentials in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/project/skillup-3beaf/functions/config
2. **Click "Add environment variable"**
3. **Add these variables**:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_VSTORAGE_ACCESS_KEY` | `your_access_key_from_render` | VNG Cloud access key |
| `VITE_VSTORAGE_SECRET_KEY` | `your_secret_key_from_render` | VNG Cloud secret key |
| `VITE_VSTORAGE_BUCKET` | `skillup` | VNG Cloud bucket name |
| `VITE_VSTORAGE_ENDPOINT` | `https://s3.vngcloud.vn` | VNG Cloud endpoint |
| `VITE_VSTORAGE_REGION` | `sgn` | VNG Cloud region |

### Step 3: Deploy Updated Functions

After setting the environment variables, redeploy the functions:

```bash
npm run firebase:deploy
```

## 🔍 Why Firebase Console Environment Variables?

### ✅ **Advantages:**
- **Security**: Encrypted storage by Google
- **Access Control**: Only authorized team members
- **Audit Trail**: All changes are logged
- **No Code Exposure**: Credentials never in code
- **Easy Rotation**: Update without redeploying
- **Environment Separation**: Different values per environment

### ❌ **Why Not Hardcoding:**
- Security risk if code exposed
- Difficult credential rotation
- No audit trail
- Visible in version control

## 🧪 Testing VStorage Integration

After setup, test file uploads:

1. **Go to your app**: https://skillup-3beaf.web.app
2. **Try uploading a file** (assignment, avatar, etc.)
3. **Check Firebase Console** for any errors
4. **Verify file appears in VNG Cloud VStorage**

## 📊 Migration Progress

| Component | Status | URL |
|-----------|--------|-----|
| **Backend API** | ✅ Deployed | https://us-central1-skillup-3beaf.cloudfunctions.net/api |
| **Frontend** | ✅ Deployed | https://skillup-3beaf.web.app |
| **Database** | ⚠️ Ready for migration | MongoDB → Firestore |
| **File Storage** | ⚠️ Needs credentials | VNG Cloud VStorage |
| **Authentication** | ✅ Firebase Auth | Integrated |

## 🎯 Next Steps After VStorage Setup

1. **Download serviceAccountKey.json** from Firebase Console
2. **Run data migration**: `npm run migrate:firestore`
3. **Verify migration**: `npm run migrate:verify`
4. **Test all functionality**
5. **Decommission Render backend**

## 💰 Cost Comparison

| Service | Before (Render) | After (Firebase) | Savings |
|---------|----------------|------------------|---------|
| **Backend** | $7/month | $0.31/month | $6.69/month |
| **Database** | $7/month | $0.00/month | $7.00/month |
| **Storage** | $0/month | $0/month | $0.00/month |
| **Total** | **$14/month** | **$0.31/month** | **$13.69/month (97.8%)** |

## 🚨 Important Notes

1. **VStorage credentials are sensitive** - never commit to Git
2. **Firebase Console is the secure way** to manage environment variables
3. **Your MongoDB data is safe** - migration is non-destructive
4. **You can rollback** to Render if needed

---

**Ready to complete the migration?** Set up VStorage credentials and run the data migration! 