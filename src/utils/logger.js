import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        if (typeof message === 'object') {
            const logObject = {
                timestamp,
                level: level.toUpperCase(),
                ...message
            };
            
            if (stack) {
                logObject.stack = stack;
            }
            
            return JSON.stringify(logObject, null, 2);
        }
        
        const logObject = {
            timestamp,
            level: level.toUpperCase(),
            message
        };
        
        if (stack) {
            logObject.stack = stack;
        }
        
        return JSON.stringify(logObject, null, 2);
    })
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        if (typeof message === 'object') {
            const { type, requestId, method, url, statusCode, userId, email, ip } = message;
            let logLine = `[${timestamp}] ${level} - ${type || 'LOG'}`;
            if (requestId) logLine += ` | ID: ${requestId.substring(0, 8)}...`;
            if (method && url) logLine += ` | ${method} ${url}`;
            if (statusCode) logLine += ` | Status: ${statusCode}`;
            if (userId) logLine += ` | User: ${userId}`;
            if (email) logLine += ` (${email})`;
            if (ip) logLine += ` | IP: ${ip}`;
            
            if (stack) {
                logLine += `\n${stack}`;
            }
            return logLine;
        }
        
        if (stack) {
            return `[${timestamp}] ${level}: ${message}\n${stack}`;
        }
        return `[${timestamp}] ${level}: ${message}`;
    })
);

// Main logger
const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Error logger
const errorLogger = winston.createLogger({
    level: 'error',
    format: logFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Request logger
const requestLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/requests.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Authentication logger
const authLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/auth.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Database logger
const dbLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/database.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Security logger
const securityLogger = winston.createLogger({
    level: 'warn',
    format: logFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/security.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Rate limit logger
const rateLimitLogger = winston.createLogger({
    level: 'warn',
    format: logFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rate-limit.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Blog logger
const blogLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/blogs.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

export {
    logger,
    errorLogger,
    requestLogger,
    authLogger,
    dbLogger,
    securityLogger,
    rateLimitLogger,
    blogLogger
};

export default logger;
