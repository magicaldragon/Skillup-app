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
      accessKey: process.env.VSTORAGE_ACCESS_KEY || 'cb1d2453d51a5936b5eee3be7685d1dc',
      secretKey: process.env.VSTORAGE_SECRET_KEY || '7LbA3yNlG8yIASrTB29HFHs5fhbiCUgARGsiOu0B',
      bucket: process.env.VSTORAGE_BUCKET || 'skillup',
      region: process.env.VSTORAGE_REGION || 'sgn',
      endpoint: process.env.VSTORAGE_ENDPOINT || 'https://s3.vngcloud.vn',
    },
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

export const config = getEnvironmentConfig();
