import rateLimit from 'express-rate-limit';
import { rateLimitLogger } from '../utils/logger.js';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after a minute.'
    },
    handler: (req, res) => {
        rateLimitLogger.warn({
            type: 'RATE_LIMIT_EXCEEDED',
            ip: req.ip || req.connection.remoteAddress,
            url: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            requestId: req.id,
            timestamp: new Date().toISOString()
        });

        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again after a minute.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    },
    skip: (req) => {
        // Skip rate limiting for certain IPs or routes if needed
        return false;
    }
});

export default limiter;
