// vstorage.config.ts
// Firebase Storage configuration for SKILLUP
// This file contains non-sensitive configuration for Firebase Storage

export const vstorageConfig = {
  // Firebase Storage bucket name (from your Firebase project)
  bucket: 'skillup-3beaf.appspot.com',
  
  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Allowed file types for upload
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed'
  ],
  
  // Storage paths for different file types
  paths: {
    avatars: 'avatars',
    assignments: 'assignments',
    classMaterials: 'classes',
    submissions: 'submissions',
    temp: 'temp'
  },
  
  // Cleanup settings
  cleanup: {
    tempFilesDays: 7, // Delete temp files after 7 days
    oldAvatarsDays: 30, // Keep old avatars for 30 days
    maxFilesPerUser: 100 // Maximum files per user
  }
};

// Note: Firebase credentials are handled through the Firebase SDK
// and should be configured in your Firebase project settings