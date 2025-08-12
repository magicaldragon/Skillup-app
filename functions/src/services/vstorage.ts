// functions/src/services/vstorage.ts - VStorage service for Firebase Functions
// This service handles file storage for assignments (MS Word, PDF, audio, video, etc.)
// User data and configuration are stored in Firestore, not in VStorage
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// VStorage Configuration for Firebase Functions
export const vstorageConfig = {
  accessKeyId: process.env.VSTORAGE_ACCESS_KEY || process.env.VITE_VSTORAGE_ACCESS_KEY || 'cb1d2453d51a5936b5eee3be7685d1dc',
  secretAccessKey: process.env.VSTORAGE_SECRET_KEY || process.env.VITE_VSTORAGE_SECRET_KEY || '7LbA3yNlG8yIASrTB29HFHs5fhbiCUgARGsiOu0B',
  endpoint: process.env.VSTORAGE_ENDPOINT || process.env.VITE_VSTORAGE_ENDPOINT || 'https://s3.vngcloud.vn',
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
    'application/x-zip-compressed'
  ]
};

// Validate configuration
if (!vstorageConfig.accessKeyId || !vstorageConfig.secretAccessKey) {
  console.warn('VStorage credentials not configured. Please set VSTORAGE_ACCESS_KEY and VSTORAGE_SECRET_KEY environment variables.');
}

// S3 Client for VNG Cloud
export const s3 = new S3Client({
  region: vstorageConfig.region,
  endpoint: vstorageConfig.endpoint,
  credentials: {
    accessKeyId: vstorageConfig.accessKeyId,
    secretAccessKey: vstorageConfig.secretAccessKey,
  },
  forcePathStyle: true, // Required for VNG Cloud S3 compatibility
});

// Upload File
export async function uploadFile(
  key: string, 
  file: Buffer, 
  contentType = 'application/octet-stream',
  metadata?: Record<string, string>
): Promise<{ url: string; key: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3.send(command);
    
    // Generate presigned URL for immediate access
    const getCommand = new GetObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
    });
    
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 }); // 1 hour
    
    return {
      url,
      key
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Get File URL
export async function getFileURL(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
    });
    
    return await getSignedUrl(s3, command, { expiresIn });
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

// Delete File
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
    });
    
    await s3.send(command);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// List Files
export async function listFiles(prefix: string = ''): Promise<{ key: string; url: string; size: number; lastModified: Date }[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: vstorageConfig.bucket,
      Prefix: prefix,
    });
    
    const result = await s3.send(command);
    
    if (!result.Contents) {
      return [];
    }
    
    const files = await Promise.all(
      result.Contents.map(async (object: any) => {
        const key = object.Key!;
        const url = await getFileURL(key);
        
        return {
          key,
          url,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date()
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
export async function uploadUserAvatar(userId: string, file: Buffer, fileName: string): Promise<string> {
  const key = `avatars/${userId}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'image/jpeg', {
    userId,
    type: 'avatar',
    originalName: fileName
  });
  return result.url;
}

// Upload Assignment File
export async function uploadAssignmentFile(
  assignmentId: string, 
  studentId: string, 
  file: Buffer,
  fileName: string
): Promise<string> {
  const key = `assignments/${assignmentId}/${studentId}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'application/octet-stream', {
    assignmentId,
    studentId,
    type: 'assignment',
    originalName: fileName
  });
  return result.url;
}

// Upload Class Material
export async function uploadClassMaterial(
  classId: string, 
  file: Buffer,
  fileName: string,
  materialType: string = 'general'
): Promise<string> {
  const key = `classes/${classId}/materials/${materialType}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'application/octet-stream', {
    classId,
    type: 'material',
    materialType,
    originalName: fileName
  });
  return result.url;
}

// Upload Feedback File
export async function uploadFeedbackFile(
  submissionId: string, 
  teacherId: string, 
  file: Buffer,
  fileName: string
): Promise<string> {
  const key = `feedback/${submissionId}/${teacherId}/${Date.now()}_${fileName}`;
  const result = await uploadFile(key, file, 'application/octet-stream', {
    submissionId,
    teacherId,
    type: 'feedback',
    originalName: fileName
  });
  return result.url;
}

// Clean up old files
export async function cleanupOldFiles(prefix: string, daysOld: number = 30): Promise<void> {
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
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate file type
export function isValidFileType(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'zip'];
  return allowedExtensions.includes(extension || '');
}

// Validate file size
export function isValidFileSize(fileSize: number): boolean {
  return fileSize <= vstorageConfig.maxFileSize;
} 