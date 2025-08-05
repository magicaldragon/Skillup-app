// vstorage.ts - All vstorage functions are under construction.
// See vstorage.config.ts for credentials/settings.

// VStorage (VNG Cloud S3) integration for SKILLUP
// Uses AWS SDK v3 for S3 compatibility
// import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// --- VStorage (VNG Cloud S3) Config ---
export const vstorageConfig = {
  accessKeyId: import.meta.env.VITE_VSTORAGE_ACCESS_KEY || '',
  secretAccessKey: import.meta.env.VITE_VSTORAGE_SECRET_KEY || '',
  endpoint: import.meta.env.VITE_VSTORAGE_ENDPOINT || 'https://s3.vngcloud.vn',
  region: import.meta.env.VITE_VSTORAGE_REGION || 'sgn',
  bucket: import.meta.env.VITE_VSTORAGE_BUCKET || 'skillup',
};

// Validate configuration
if (!vstorageConfig.accessKeyId || !vstorageConfig.secretAccessKey) {
  console.warn('VStorage credentials not configured. Please set VITE_VSTORAGE_ACCESS_KEY and VITE_VSTORAGE_SECRET_KEY environment variables.');
}

// --- S3 Client ---
// export const s3 = new S3Client({
//   region: vstorageConfig.region,
//   endpoint: vstorageConfig.endpoint,
//   credentials: {
//     accessKeyId: vstorageConfig.accessKeyId,
//     secretAccessKey: vstorageConfig.secretAccessKey,
//   },
//   forcePathStyle: true, // Required for VNG Cloud S3 compatibility
// });

// --- Helper: Upload File ---
// export async function uploadFile(key: string, file: Blob | Buffer | Uint8Array, contentType = 'application/octet-stream') {
//   if (!vstorageConfig.accessKeyId || !vstorageConfig.secretAccessKey) {
//     throw new Error('VStorage credentials not configured');
//   }
  
//   // const command = new PutObjectCommand({
//   //   Bucket: vstorageConfig.bucket,
//   //   Key: key,
//   //   Body: file,
//   //   ContentType: contentType,
//   // });
//   // return s3.send(command);
//   console.warn('VStorage upload functionality is currently disabled.');
//   return Promise.resolve({}); // Return a dummy object to avoid breaking the flow
// }

// --- Helper: Get File (returns a presigned URL or stream) ---
// export async function getFile(key: string) {
//   if (!vstorageConfig.accessKeyId || !vstorageConfig.secretAccessKey) {
//     throw new Error('VStorage credentials not configured');
//   }
  
//   // const command = new GetObjectCommand({
//   //   Bucket: vstorageConfig.bucket,
//   //   Key: key,
//   // });
//   // return s3.send(command);
//   console.warn('VStorage get functionality is currently disabled.');
//   return Promise.resolve({}); // Return a dummy object to avoid breaking the flow
// }

// --- Helper: List Files ---
// export async function listFiles(prefix = '') {
//   if (!vstorageConfig.accessKeyId || !vstorageConfig.secretAccessKey) {
//     throw new Error('VStorage credentials not configured');
//   }
  
//   // const command = new ListObjectsV2Command({
//   //   Bucket: vstorageConfig.bucket,
//   //   Prefix: prefix,
//   // });
//   // return s3.send(command);
//   console.warn('VStorage list functionality is currently disabled.');
//   return Promise.resolve({}); // Return a dummy object to avoid breaking the flow
// }
