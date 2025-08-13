Object.defineProperty(exports, '__esModule', { value: true });
exports.s3 = exports.vstorageConfig = void 0;
exports.uploadFile = uploadFile;
exports.getFileURL = getFileURL;
exports.deleteFile = deleteFile;
exports.listFiles = listFiles;
exports.uploadUserAvatar = uploadUserAvatar;
exports.uploadAssignmentFile = uploadAssignmentFile;
exports.uploadClassMaterial = uploadClassMaterial;
exports.uploadFeedbackFile = uploadFeedbackFile;
exports.cleanupOldFiles = cleanupOldFiles;
exports.formatFileSize = formatFileSize;
exports.isValidFileType = isValidFileType;
exports.isValidFileSize = isValidFileSize;
// functions/src/services/vstorage.ts - VStorage service for Firebase Functions
// This service handles file storage for assignments (MS Word, PDF, audio, video, etc.)
// User data and configuration are stored in Firestore, not in VStorage
const client_s3_1 = require('@aws-sdk/client-s3');
const s3_request_presigner_1 = require('@aws-sdk/s3-request-presigner');
// VStorage Configuration for Firebase Functions
exports.vstorageConfig = {
  accessKeyId:
    process.env.VSTORAGE_ACCESS_KEY ||
    process.env.VITE_VSTORAGE_ACCESS_KEY ||
    'cb1d2453d51a5936b5eee3be7685d1dc',
  secretAccessKey:
    process.env.VSTORAGE_SECRET_KEY ||
    process.env.VITE_VSTORAGE_SECRET_KEY ||
    '7LbA3yNlG8yIASrTB29HFHs5fhbiCUgARGsiOu0B',
  endpoint:
    process.env.VSTORAGE_ENDPOINT || process.env.VITE_VSTORAGE_ENDPOINT || 'https://s3.vngcloud.vn',
  region: process.env.VSTORAGE_REGION || process.env.VITE_VSTORAGE_REGION || 'sgn',
  bucket: process.env.VSTORAGE_BUCKET || process.env.VITE_VSTORAGE_BUCKET || 'skillup',
  maxFileSize: 10 * 1024 * 1024, // 10MB max file size
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
    'application/x-zip-compressed',
  ],
};
// Validate configuration
if (!exports.vstorageConfig.accessKeyId || !exports.vstorageConfig.secretAccessKey) {
  console.warn(
    'VStorage credentials not configured. Please set VSTORAGE_ACCESS_KEY and VSTORAGE_SECRET_KEY environment variables.'
  );
}
// S3 Client for VNG Cloud
exports.s3 = new client_s3_1.S3Client({
  region: exports.vstorageConfig.region,
  endpoint: exports.vstorageConfig.endpoint,
  credentials: {
    accessKeyId: exports.vstorageConfig.accessKeyId,
    secretAccessKey: exports.vstorageConfig.secretAccessKey,
  },
  forcePathStyle: true, // Required for VNG Cloud S3 compatibility
});
// Upload File
async function uploadFile(key, file, contentType = 'application/octet-stream', metadata) {
  try {
    const command = new client_s3_1.PutObjectCommand({
      Bucket: exports.vstorageConfig.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });
    await exports.s3.send(command);
    // Generate presigned URL for immediate access
    const getCommand = new client_s3_1.GetObjectCommand({
      Bucket: exports.vstorageConfig.bucket,
      Key: key,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(exports.s3, getCommand, {
      expiresIn: 3600,
    }); // 1 hour
    return {
      url,
      key,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
// Get File URL
async function getFileURL(key, expiresIn = 3600) {
  try {
    const command = new client_s3_1.GetObjectCommand({
      Bucket: exports.vstorageConfig.bucket,
      Key: key,
    });
    return await (0, s3_request_presigner_1.getSignedUrl)(exports.s3, command, { expiresIn });
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}
// Delete File
async function deleteFile(key) {
  try {
    const command = new client_s3_1.DeleteObjectCommand({
      Bucket: exports.vstorageConfig.bucket,
      Key: key,
    });
    await exports.s3.send(command);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
// List Files
async function listFiles(prefix = '') {
  try {
    const command = new client_s3_1.ListObjectsV2Command({
      Bucket: exports.vstorageConfig.bucket,
      Prefix: prefix,
    });
    const result = await exports.s3.send(command);
    if (!result.Contents) {
      return [];
    }
    const files = await Promise.all(
      result.Contents.map(async (object) => {
        const key = object.Key;
        const url = await getFileURL(key);
        return {
          key,
          url,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
        };
      })
    );
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}
// Upload User Avatar
async function uploadUserAvatar(userId, file, fileName) {
  const key = `avatars/${userId}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'image/jpeg', {
    userId,
    type: 'avatar',
    originalName: fileName,
  });
  return result.url;
}
// Upload Assignment File
async function uploadAssignmentFile(assignmentId, studentId, file, fileName) {
  const key = `assignments/${assignmentId}/${studentId}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'application/octet-stream', {
    assignmentId,
    studentId,
    type: 'assignment',
    originalName: fileName,
  });
  return result.url;
}
// Upload Class Material
async function uploadClassMaterial(classId, file, fileName, materialType = 'general') {
  const key = `classes/${classId}/materials/${materialType}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'application/octet-stream', {
    classId,
    type: 'material',
    materialType,
    originalName: fileName,
  });
  return result.url;
}
// Upload Feedback File
async function uploadFeedbackFile(submissionId, teacherId, file, fileName) {
  const key = `feedback/${submissionId}/${teacherId}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'application/octet-stream', {
    submissionId,
    teacherId,
    type: 'feedback',
    originalName: fileName,
  });
  return result.url;
}
// Clean up old files
async function cleanupOldFiles(prefix, daysOld = 30) {
  try {
    const files = await listFiles(prefix);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    for (const file of files) {
      if (file.lastModified < cutoffDate) {
        await deleteFile(file.key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    throw error;
  }
}
// Format file size in human readable format
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
// Validate file type
function isValidFileType(fileName) {
  var _a;
  const extension =
    (_a = fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
  const allowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'pdf',
    'txt',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'zip',
  ];
  return allowedExtensions.includes(extension || '');
}
// Validate file size
function isValidFileSize(fileSize) {
  return fileSize <= exports.vstorageConfig.maxFileSize;
}
//# sourceMappingURL=vstorage.js.map
