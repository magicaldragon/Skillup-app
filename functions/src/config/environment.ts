// functions/src/config/environment.ts - Environment configuration for Firebase Functions
export interface EnvironmentConfig {
  vstorage: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
    endpoint: string;
  };
  nodeEnv: string;
}
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    vstorage: {
      accessKey: process.env.VSTORAGE_ACCESS_KEY || "",
      secretKey: process.env.VSTORAGE_SECRET_KEY || "",
      bucket: process.env.VSTORAGE_BUCKET || "skillup",
      region: process.env.VSTORAGE_REGION || "sgn",
      endpoint: process.env.VSTORAGE_ENDPOINT || "https://s3.vngcloud.vn",
    },
    nodeEnv: process.env.NODE_ENV || "development",
  };
}
export const config = getEnvironmentConfig();
