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

# Attendance & School Fee Enhancements

## Quick Filters
- Attendance defaults: last class + today’s date.
- School Fee defaults: last class + current month.
- Persisted in `localStorage` across sessions.

## Batch Operations
- Attendance: select rows, “Mark all present” (with confirmation).
- School Fee: select rows, “Mark all paid” (date prompt + confirmation).
- Success/error banners report outcome; no backend writes yet.

## UI Consistency
- Standardized buttons:
  - Edit: `#90EE90`
  - Delete: `#FF0000`
  - Export: `#ADD8E6`
  - Save: `#008000`
- Consistent size, padding, and hover effects via `ManagementTableStyles.css`.

## Level Pricing Management
- Levels support optional `monthlyFee`.
- School Fee pre-fills base using selected class’s `levelId → monthlyFee`.
- Manual overrides flagged visually; numeric validation enforced.

## Audit Trail (School Fee)
- Captures `staffId`, `changedBy`, and `updatedAt` on changes.
- Non-editable, shown in the table for admins.
- Staff data sourced from `authService`.

## Export & Printing
- CSV export includes all relevant fields.
- XLSX export adds column widths and attempts to freeze header row.
- Printable A4 bills (two per page) with student and payment details; opens print preview.

## Backward Compatibility
- `monthlyFee` is optional on Level; older data remains valid.
- Missing `xlsx` falls back to CSV.

## Testing
- Vitest unit tests cover filter persistence and fee computation/validation in `tests/`.
- To run tests:
```bash
npx vitest
```

## Error Handling & Performance
- Confirmation dialogs prevent unintended batch changes.
- Status feedback for user clarity.
- Derived lists memoized; operations run in memory and only export on demand.

## Future Save API (Optional)
- Fee and attendance saves can be wired to backend endpoints once collections and rules are finalized (`studentFees` or extended `studentRecords`).
