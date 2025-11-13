// vstorage.ts - VNG Cloud VStorage integration for SKILLUP
// Uses AWS SDK v3 for S3 compatibility with VNG Cloud

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// --- VNG Cloud VStorage Configuration ---
export const vstorageConfig = {
  accessKeyId: import.meta.env.VITE_VSTORAGE_ACCESS_KEY || "",
  secretAccessKey: import.meta.env.VITE_VSTORAGE_SECRET_KEY || "",
  endpoint: import.meta.env.VITE_VSTORAGE_ENDPOINT || "https://s3.vngcloud.vn",
  region: import.meta.env.VITE_VSTORAGE_REGION || "sgn",
  bucket: import.meta.env.VITE_VSTORAGE_BUCKET || "skillup",
  maxFileSize: 10 * 1024 * 1024, // 10MB max file size
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
  ],
};

// Validate configuration
if (!vstorageConfig.accessKeyId || !vstorageConfig.secretAccessKey) {
  console.warn(
    "VStorage credentials not configured. Please set VITE_VSTORAGE_ACCESS_KEY and VITE_VSTORAGE_SECRET_KEY environment variables.",
  );
}

// --- S3 Client for VNG Cloud ---
export const s3 = new S3Client({
  region: vstorageConfig.region,
  endpoint: vstorageConfig.endpoint,
  credentials: {
    accessKeyId: vstorageConfig.accessKeyId,
    secretAccessKey: vstorageConfig.secretAccessKey,
  },
  forcePathStyle: true, // Required for VNG Cloud S3 compatibility
});

// --- Helper: Upload File ---
export async function uploadFile(
  key: string,
  file: File | Blob,
  contentType = "application/octet-stream",
  metadata?: Record<string, string>,
): Promise<{ url: string; key: string }> {
  try {
    // Validate file size
    if (file.size > vstorageConfig.maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${vstorageConfig.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Validate file type if provided
    if (file instanceof File && !vstorageConfig.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

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
      key,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// --- Helper: Get File URL ---
export async function getFileURL(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
    });

    return await getSignedUrl(s3, command, { expiresIn });
  } catch (error) {
    console.error("Error getting file URL:", error);
    throw error;
  }
}

// --- Helper: Delete File ---
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
    });

    await s3.send(command);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// --- Helper: List Files ---
export async function listFiles(
  prefix: string = "",
): Promise<{ key: string; url: string; size: number; lastModified: Date }[]> {
  try {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: vstorageConfig.bucket,
        Prefix: prefix,
      }),
    );

    const contents = Array.isArray(result.Contents) ? result.Contents : [];

    if (contents.length === 0) {
      console.info(`No files found for prefix: "${prefix}"`);
      return [];
    }

    const files = await Promise.all(
      contents.map(async (object: { Key?: string; Size?: number; LastModified?: Date }) => {
        const key = object.Key;
        if (!key) return null;
        const url = await getFileURL(key);
        return {
          key,
          url,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
        };
      }),
    );

    return files.filter(
      (
        file: { key: string; url: string; size: number; lastModified: Date } | null,
      ): file is {
        key: string;
        url: string;
        size: number;
        lastModified: Date;
      } => file !== null,
    );
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
}

// --- Helper: Upload User Avatar ---
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const key = `avatars/${userId}/${Date.now()}_${file.name}`;
  const result = await uploadFile(key, file, file.type, {
    userId,
    type: "avatar",
    originalName: file.name,
  });
  return result.url;
}

// --- Helper: Upload Assignment File ---
export async function uploadAssignmentFile(
  assignmentId: string,
  studentId: string,
  file: File,
): Promise<string> {
  const key = `assignments/${assignmentId}/${studentId}/${Date.now()}_${file.name}`;
  const result = await uploadFile(key, file, file.type, {
    assignmentId,
    studentId,
    type: "assignment",
    originalName: file.name,
  });
  return result.url;
}

// --- Helper: Upload Class Material ---
export async function uploadClassMaterial(
  classId: string,
  file: File,
  materialType: string = "general",
): Promise<string> {
  const key = `classes/${classId}/materials/${materialType}/${Date.now()}_${file.name}`;
  const result = await uploadFile(key, file, file.type, {
    classId,
    type: "material",
    materialType,
    originalName: file.name,
  });
  return result.url;
}

// --- Helper: Upload Feedback File ---
export async function uploadFeedbackFile(
  submissionId: string,
  teacherId: string,
  file: File,
): Promise<string> {
  const key = `feedback/${submissionId}/${teacherId}/${Date.now()}_${file.name}`;
  const result = await uploadFile(key, file, file.type, {
    submissionId,
    teacherId,
    type: "feedback",
    originalName: file.name,
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
        await deleteFile(file.key);
      }
    }
  } catch (error) {
    console.error("Error cleaning up old files:", error);
    throw error;
  }
}

// --- Helper: Get file size in human readable format ---
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// --- Helper: Validate file type ---
export function isValidFileType(file: File): boolean {
  return vstorageConfig.allowedTypes.includes(file.type);
}

// --- Helper: Validate file size ---
export function isValidFileSize(file: File): boolean {
  return file.size <= vstorageConfig.maxFileSize;
}

// Export S3 client for direct access if needed
