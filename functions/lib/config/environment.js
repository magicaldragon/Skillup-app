"use strict";
// functions/src/config/environment.ts - Environment configuration for Firebase Functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.getEnvironmentConfig = getEnvironmentConfig;
function getEnvironmentConfig() {
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
exports.config = getEnvironmentConfig();
//# sourceMappingURL=environment.js.map