import { errorLogger } from '../utils/logger.js';

function errorHandler(err, req, res, next) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    
    // Log error
    errorLogger.error({
        type: 'ERROR',
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: statusCode,
        message: err.message,
        stack: err.stack,
        userId: req.user?._id || null,
        userEmail: req.user?.email || null,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });
    
    res.status(statusCode).json({
        success: false,
        message: err.message,
        requestId: req.id,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
}

export default errorHandler;