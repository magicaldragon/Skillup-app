// services/vngConfig.ts

// --- IMPORTANT CONFIGURATION ---
// Please replace this with your actual VNG vStorage bucket name.
const VNG_STORAGE_BUCKET_NAME: string = "skillup-prod-data"; // <-- REPLACE THIS with your bucket name
// ---

const VNG_BUCKET_URL = `https://${VNG_STORAGE_BUCKET_NAME}.vstorage.vngcloud.vn`;

/**
 * Constructs a public URL for a file stored in VNG vStorage.
 *
 * --- ⚠️ SECURITY WARNING FOR PRODUCTION ⚠️ ---
 * This function creates a direct, public link to your files. This is suitable for development,
 * but for a production environment, you should NOT make your storage bucket public.
 *
 * **Production Best Practice:**
 * 1. Keep your VNG vStorage bucket PRIVATE.
 * 2. Create a secure backend endpoint (e.g., using a serverless function).
 * 3. In the frontend, when you need a file, call your backend endpoint, authenticating with the user's Firebase token.
 * 4. The backend should verify the token and the user's permissions.
 * 5. If authorized, the backend uses the VNG Cloud SDK to generate a temporary, secure "pre-signed URL".
 * 6. The frontend receives this temporary URL and uses it to access the file.
 *
 * This ensures only authenticated and authorized users can access your files.
 *
 * @param fileName The name of the file in your VNG vStorage bucket (e.g., 'reading-passage-1.pdf').
 * @returns The full public URL to the file.
 */
export const getVngFileUrl = (fileName: string): string => {
  if (!VNG_STORAGE_BUCKET_NAME || VNG_STORAGE_BUCKET_NAME === "your-bucket-name-here") {
    // Return a placeholder or show an error to remind the user to configure the bucket name.
    console.error(
      "VNG vStorage bucket name is not configured in services/vngConfig.ts. Please update the VNG_STORAGE_BUCKET_NAME constant.",
    );
    return ``;
  }
  return `${VNG_BUCKET_URL}/${fileName}`;
};
