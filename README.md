# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Backend Service for vStorage Uploads

A Node.js Express backend is required for secure teacher file uploads to VNG vStorage. Teachers upload files via the app, which are sent to this backend. The backend authenticates the teacher, uploads the file to vStorage using S3 keys, and returns a file URL for use in the app.

### Environment Variables
- VSTORAGE_ACCESS_KEY: Your vStorage S3 Access Key
- VSTORAGE_SECRET_KEY: Your vStorage S3 Secret Key
- VSTORAGE_ENDPOINT: S3-compatible endpoint (e.g., https://hcm04-vstorage.vngcloud.vn)
- VSTORAGE_REGION: Region (e.g., HCM04)
- VSTORAGE_BUCKET: Your vStorage bucket name

See `backend/index.js` for implementation details.
