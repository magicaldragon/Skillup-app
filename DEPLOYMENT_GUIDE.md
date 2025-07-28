# SKILLUP Frontend Deployment Guide

## 🚀 Deploy to Render (Recommended)

Since your backend is already on Render, let's deploy the frontend there too for a unified platform experience.

### Option 1: Deploy via Render Dashboard

1. **Go to Render Dashboard**:
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Static Site"

2. **Configure the Service**:
   - **Name**: `skillup-frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variable**: 
     - Key: `VITE_API_BASE_URL`
     - Value: `https://skillup-backend-v6vm.onrender.com/api`

3. **Connect Repository**:
   - Connect your GitHub repository
   - Render will automatically detect it's a Vite project

### Option 2: Deploy via Render CLI

1. **Install Render CLI**:
   ```bash
   npm install -g @render/cli
   ```

2. **Login to Render**:
   ```bash
   render login
   ```

3. **Deploy using render.yaml**:
   ```bash
   render deploy
   ```

## 🔧 Manual Deployment Steps

### 1. Build the Project
```bash
npm run build
```

### 2. Test the Build
```bash
npm run preview
```

### 3. Deploy to Render
- Upload the `dist` folder to Render
- Or use the Render dashboard to connect your repository

## 🌐 Alternative Deployment Options

### Vercel (If you want to try it)
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`
3. Configure environment variables in Vercel dashboard

### Netlify
1. Connect GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable: `VITE_API_BASE_URL=https://skillup-backend-v6vm.onrender.com/api`

## 🔍 Post-Deployment Verification

### 1. Test Authentication
- Visit the deployed URL
- Try logging in with test credentials:
  - Admin: `skillup-admin@teacher.skillup` / `Skillup@123`
  - Teacher: `teacher-jenny@teacher.skillup` / `Skillup@123`
  - Student: `student-alice@student.skillup` / `Skillup123`

### 2. Test API Integration
- Verify data loads after login
- Test CRUD operations for classes
- Check error handling and loading states

### 3. Test Responsive Design
- Test on mobile devices
- Verify sidebar navigation works
- Check all user roles (admin, teacher, student)

## 🛠️ Environment Configuration

### Development
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production (Render)
```bash
# Environment variable in Render dashboard
VITE_API_BASE_URL=https://skillup-backend-v6vm.onrender.com/api
```

## 📊 Monitoring & Analytics

### Render Analytics
- View deployment logs in Render dashboard
- Monitor build status and performance

### Error Tracking
- Check browser console for errors
- Monitor API failures and user experience

## 🎯 Success Criteria

✅ **Deployment Complete** when:
- Frontend is accessible at Render URL
- Authentication works with test credentials
- API integration loads real data
- All user roles function correctly
- Responsive design works on mobile
- Error handling displays user-friendly messages

## 🚨 Troubleshooting

### Common Issues:
1. **CORS Errors**: Backend is configured for Render domains
2. **Authentication Failures**: Check Firebase configuration
3. **API Timeouts**: Backend cold starts on Render (normal)
4. **Build Failures**: Check TypeScript errors and dependencies

### Debug Commands:
```bash
# Check build locally
npm run build

# Test production build
npm run preview

# Check environment variables
echo $VITE_API_BASE_URL
```

## 🏗️ Architecture Benefits

**Why Render for Both:**
- ✅ Single platform management
- ✅ Unified deployment workflow
- ✅ Cost-effective (free tier for both)
- ✅ Familiar tooling and interface
- ✅ Good performance for full-stack apps

---

**Ready to deploy to Render!** 🚀

The application is fully integrated and ready for production deployment on Render. 