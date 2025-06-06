import dotenv from 'dotenv';
import { join } from 'path';
import { parseBoolean } from 'src/libs/util/parseVars';

// Load environment variables from .env file
dotenv.config({ path: join(process.cwd(), '.env') });

// Common validation function
const validateEnv = (name: string, defaultValue?: string): string => {
    const value = process.env[name] || defaultValue;
    if (value === undefined) {
        throw new Error(
            `Environment variable ${name} is required but not set.`
        );
    }
    return value;
};

// Server configuration
export const SERVER_ENV = {
    APP_ID: validateEnv('APP_ID', 'pontonesia'),
    PORT: parseInt(validateEnv('PORT', '3000'), 10),
    LOG_LEVEL: validateEnv('LOG_LEVEL', 'debug'),
    REQUEST_LIMIT: validateEnv('REQUEST_LIMIT', '100kb'),
    SESSION_SECRET: validateEnv('SESSION_SECRET'),
    NODE_ENV: validateEnv('NODE_ENV', 'development'),
    OPENAPI_SPEC: validateEnv('OPENAPI_SPEC', '/api/v1/spec'),
    OPENAPI_ENABLE_RESPONSE_VALIDATION: parseBoolean(
        validateEnv('OPENAPI_ENABLE_RESPONSE_VALIDATION', 'false')
    ),
    CORS_ORIGIN: validateEnv('CORS_ORIGIN', '*'),
    BASE_URL: validateEnv('CORS_ORIGIN', 'http://localhost:3000'),
};

// Authentication configuration
export const AUTH_ENV = {
    JWT_SECRET: validateEnv('JWT_SECRET', SERVER_ENV.SESSION_SECRET),
    JWT_EXPIRES_IN: validateEnv('JWT_EXPIRES_IN', '24h'),
    SALT_ROUNDS: parseInt(validateEnv('SALT_ROUNDS', '10'), 10),
};

// Google OAuth configuration
export const GOOGLE_AUTH = {
    CLIENT_ID: validateEnv('GOOGLE_CLIENT_ID'),
    CLIENT_SECRET: validateEnv('GOOGLE_CLIENT_SECRET'),
    CALLBACK_URL: validateEnv(
        'GOOGLE_CALLBACK_URL',
        `http://localhost:${SERVER_ENV.PORT}/auth/google/callback`
    ),
};

// Database configuration
export const DATABASE_ENV = {
    URL: validateEnv('DATABASE_URL', 'mongodb://localhost:27017/pontonesia'),
    NAME: validateEnv('DATABASE_NAME', 'pontonesia'),
};

// Rate limiting configuration
export const RATE_LIMIT = {
    WINDOW_MS: parseInt(
        validateEnv('RATE_LIMIT_WINDOW_MS', '15 * 60 * 1000'),
        10
    ), // 15 minutes
    MAX_REQUESTS: parseInt(validateEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10), // 100 requests per window
};

export const AWS_ENV = {
    S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'default-bucket',
    REGION: process.env.AWS_REGION || 'us-east-1',
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

// All environment variables combined
export default {
    SERVER_ENV,
    AUTH_ENV,
    GOOGLE_AUTH,
    DATABASE_ENV,
    RATE_LIMIT,
    isDevelopment: SERVER_ENV.NODE_ENV === 'development',
    isProduction: SERVER_ENV.NODE_ENV === 'production',
    isTest: SERVER_ENV.NODE_ENV === 'test',
};
