/**
 * Centralized environment configuration.
 *
 * Validates required variables at startup and exports them as a typed config
 * object. The app will crash with a clear message if any required variable is
 * missing, rather than silently failing at runtime.
 */
import 'dotenv/config';

const required = (key) => {
    const value = process.env[key];
    if (!value) {
        console.error(`[env] Missing required environment variable: ${key}`);
        process.exit(1);
    }
    return value;
};

const optional = (key, defaultValue) => process.env[key] ?? defaultValue;

const env = {
    // Server
    NODE_ENV : optional('NODE_ENV', 'development'),
    PORT     : parseInt(optional('PORT', '5000'), 10),
    isDev    : optional('NODE_ENV', 'development') === 'development',
    isProd   : optional('NODE_ENV', 'development') === 'production',

    // Database
    MONGODB_URL: required('MONGODB_URL'),

    // JWT
    ACCESS_TOKEN_SECRET     : required('ACCESS_TOKEN_SECRET'),
    ACCESS_TOKEN_EXPIRES_IN : optional('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    REFRESH_TOKEN_SECRET    : required('REFRESH_TOKEN_SECRET'),
    REFRESH_TOKEN_EXPIRES_IN: optional('REFRESH_TOKEN_EXPIRES_IN', '7d'),

    // CORS — comma-separated list of allowed origins
    CORS_ORIGINS: optional('CORS_ORIGIN', 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
};

export default env;
