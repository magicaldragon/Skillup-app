// vstorage.ts - Firebase Storage integration for SKILLUP
// Uses Firebase Storage for file uploads and management

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  StorageReference,
  UploadResult
} from 'firebase/storage';
import { app } from './firebase';

// Initialize Firebase Storage
const storage = getStorage(app);

// --- Firebase Storage Configuration ---
export const storageConfig = {
  bucket: 'skillup-3beaf.appspot.com', // Your Firebase Storage bucket
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

// --- Helper: Upload File ---
export async function uploadFile(
  path: string, 
  file: File | Blob, 
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<{ url: string; path: string }> {
  try {
    // Validate file size
    if (file.size > storageConfig.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${storageConfig.maxFileSize / (1024 * 1024)}MB`);
    }

    // Validate file type if provided
    if (file instanceof File && !storageConfig.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Upload file
    const uploadResult: UploadResult = await uploadBytes(storageRef, file, metadata);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      url: downloadURL,
      path: uploadResult.ref.fullPath
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// --- Helper: Get File URL ---
export async function getFileURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

// --- Helper: Delete File ---
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// --- Helper: List Files ---
export async function listFiles(prefix: string = ''): Promise<{ name: string; url: string; size: number; lastModified: Date }[]> {
  try {
    const storageRef = ref(storage, prefix);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        // Note: Firebase Storage doesn't provide file metadata in listAll
        // You might need to store metadata in Firestore for better file management
        return {
          name: item.name,
          url,
          size: 0, // Would need custom metadata storage
          lastModified: new Date() // Would need custom metadata storage
        };
      })
    );
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

// --- Helper: Upload User Avatar ---
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const path = `avatars/${userId}/${Date.now()}_${file.name}`;
  const result = await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      userId,
      type: 'avatar',
      originalName: file.name
    }
  });
  return result.url;
}

// --- Helper: Upload Assignment File ---
export async function uploadAssignmentFile(
  assignmentId: string, 
  studentId: string, 
  file: File
): Promise<string> {
  const path = `assignments/${assignmentId}/${studentId}/${Date.now()}_${file.name}`;
  const result = await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      assignmentId,
      studentId,
      type: 'assignment',
      originalName: file.name
    }
  });
  return result.url;
}

// --- Helper: Upload Class Material ---
export async function uploadClassMaterial(
  classId: string, 
  file: File, 
  materialType: string = 'general'
): Promise<string> {
  const path = `classes/${classId}/materials/${materialType}/${Date.now()}_${file.name}`;
  const result = await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      classId,
      type: 'material',
      materialType,
      originalName: file.name
    }
  });
  return result.url;
}

// --- Helper: Clean up old files ---
export async function cleanupOldFiles(prefix: string, daysOld: number = 30): Promise<void> {
  try {
    const files = await listFiles(prefix);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    for (const file of files) {
      if (file.lastModified < cutoffDate) {
        await deleteFile(file.name);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    throw error;
  }
}

// --- Helper: Get file size in human readable format ---
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- Helper: Validate file type ---
export function isValidFileType(file: File): boolean {
  return storageConfig.allowedTypes.includes(file.type);
}

// --- Helper: Validate file size ---
export function isValidFileSize(file: File): boolean {
  return file.size <= storageConfig.maxFileSize;
}

// Export storage instance for direct access if needed
export { storage };
