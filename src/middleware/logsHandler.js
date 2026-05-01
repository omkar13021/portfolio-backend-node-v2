import { requestLogger } from '../utils/logger.js';

function logsHandler() {
    return (req, res, next) => {
        const startTime = Date.now();

        // Log request
        requestLogger.info({
            type: 'REQUEST',
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?._id || null,
            userEmail: req.user?.email || null,
            timestamp: new Date().toISOString()
        });

        // Capture response
        const originalSend = res.send;
        res.send = function (data) {
            const duration = Date.now() - startTime;
            
            requestLogger.info({
                type: 'RESPONSE',
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                userId: req.user?._id || null,
                timestamp: new Date().toISOString()
            });

            originalSend.call(this, data);
        };

        next();
    };
}

export default logsHandler;