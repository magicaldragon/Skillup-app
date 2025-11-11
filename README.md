# SKILLUP - Educational Management System

## 🚀 **Latest Update: Automatic Deployment Enabled**
- ✅ VStorage configured and ready
- ✅ Firebase Functions deployed
- ✅ GitHub Actions automatic deployment setup
- ✅ Ready for management features development

## 📋 **Current Status**
- **Frontend**: Firebase Hosting (https://skillup-3beaf.web.app)
- **Backend**: Firebase Functions (https://us-central1-skillup-3beaf.cloudfunctions.net/api)
- **Database**: Firestore (fully migrated from MongoDB)
- **Storage**: VNG Cloud VStorage (configured)
- **Authentication**: Firebase Auth
- **Deployment**: Automatic via GitHub Actions

## 🛠️ **Development Workflow**
```bash
# Make changes
git add .
git commit -m "Your commit message"
git push origin main
# 🚀 Automatic deployment happens!
```

## 📊 **Management Features**
- User Management
- Class Management  
- Level Management
- Student Records
- Potential Students
- Reports & Analytics
- Settings

## 🔐 **Firebase Deployment Test**
Testing professional deployment with official Firebase GitHub Action...

---
*Last updated: Testing professional Firebase deployment*

## Login Reliability and Error Handling

- The login flow authenticates with Firebase and then verifies via `POST ${API_BASE_URL}/auth/firebase-login`.
- A backend connectivity check (`GET ${API_BASE_URL}/test`) runs before login. If unreachable, login shows “Server unavailable. Please try again later.”.
- The backend verification call uses short retries for transient network errors; on repeated failure, it reports “Network error - please check your connection.”.
- The service worker no longer intercepts `/api/auth/*` requests to avoid interference with authentication.
