// VStorage (VNG Cloud S3) integration for SKILLUP
// Uses AWS SDK v3 for S3 compatibility
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// --- VStorage (VNG Cloud S3) Config ---
export const vstorageConfig = {
  accessKeyId: 'f859f5c6b54f5306bd7ed5cbc7c23240',
  secretAccessKey: 't3zLotqNc9M2A1XZ0dt90M7vtXFuN8Csg0zXTIBW',
  endpoint: 'https://s3.vngcloud.vn', // Default endpoint for VNG Cloud S3
  region: 'sgn', // Use your actual region if different
  bucket: 'skillup', // Set your actual bucket name here
};

// --- S3 Client ---
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
export async function uploadFile(key: string, file: Blob | Buffer | Uint8Array, contentType = 'application/octet-stream') {
  const command = new PutObjectCommand({
    Bucket: vstorageConfig.bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  return s3.send(command);
}

// --- Helper: Get File (returns a presigned URL or stream) ---
export async function getFile(key: string) {
  const command = new GetObjectCommand({
    Bucket: vstorageConfig.bucket,
    Key: key,
  });
  return s3.send(command);
}

// --- Helper: List Files ---
export async function listFiles(prefix = '') {
  const command = new ListObjectsV2Command({
    Bucket: vstorageConfig.bucket,
    Prefix: prefix,
  });
  return s3.send(command);
}
