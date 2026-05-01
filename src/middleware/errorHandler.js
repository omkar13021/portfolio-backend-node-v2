import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Central error handler.
 *
 * - ApiError subclasses  → operational, use their statusCode + message
 * - Mongoose CastError   → treat as 400 (invalid ObjectId in param)
 * - Mongoose duplicate   → treat as 409
 * - Everything else      → 500 (programmer/unexpected error)
 */
function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let message    = 'Internal server error';
    let errors     = [];

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message    = err.message;
        errors     = err.errors;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message    = `Invalid value for field: ${err.path}`;
    } else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
        message = `${field} already exists`;
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message    = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message    = 'Token expired';
    }

    // Log with appropriate level
    const logMeta = {
        requestId: req.id,
        method   : req.method,
        url      : req.originalUrl,
        statusCode,
        userId   : req.user?._id ?? null,
        ip       : req.ip,
    };

    if (statusCode >= 500) {
        logger.error(err.message, { ...logMeta, stack: err.stack });
    } else if (statusCode >= 400) {
        logger.warn(err.message, logMeta);
    }

    res.status(statusCode).json({
        success  : false,
        message,
        errors   : errors.length ? errors : undefined,
        requestId: req.id,
        stack    : env.isDev ? err.stack : undefined,
    });
}

export default errorHandler;