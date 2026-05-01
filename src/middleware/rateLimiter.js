import rateLimit from 'express-rate-limit';
import { securityLogger } from '../utils/logger.js';

const makeHandler = (label) => (req, res) => {
    securityLogger.warn(`Rate limit exceeded: ${label}`, {
        ip       : req.ip,
        url      : req.originalUrl,
        method   : req.method,
        userAgent: req.get('User-Agent'),
        requestId: req.id,
    });

    res.status(429).json({
        success   : false,
        message   : 'Too many requests from this IP, please try again later.',
        requestId : req.id,
    });
};

/** 100 requests / minute — applied globally */
const globalLimiter = rateLimit({
    windowMs       : 60 * 1000,
    max            : 100,
    standardHeaders: true,
    legacyHeaders  : false,
    handler        : makeHandler('global'),
});

/** 5 requests / 15 minutes — applied only to auth routes */
const authLimiter = rateLimit({
    windowMs       : 15 * 60 * 1000,
    max            : 5,
    standardHeaders: true,
    legacyHeaders  : false,
    handler        : makeHandler('auth'),
});

const rateLimiter = { global: globalLimiter, auth: authLimiter };

export default rateLimiter;
