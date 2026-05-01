import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');

// ─── Formats ────────────────────────────────────────────────────────────────

/** Compact, colorized format for the developer console */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, module: mod, requestId, ...meta }) => {
        let line = `[${timestamp}] ${level}`;
        if (mod)       line += ` [${mod}]`;
        if (requestId) line += ` (${String(requestId).substring(0, 8)})`;
        line += `: ${typeof message === 'object' ? JSON.stringify(message) : message}`;
        if (Object.keys(meta).length && meta.stack === undefined) {
            line += ` ${JSON.stringify(meta)}`;
        }
        if (meta.stack) line += `\n${meta.stack}`;
        return line;
    })
);

/** Structured JSON format for log files — machine-parsable */
const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// ─── File transport factory ──────────────────────────────────────────────────

const fileTransport = (filename) =>
    new winston.transports.File({
        filename: path.join(LOG_DIR, filename),
        format: jsonFormat,
        maxsize: 5 * 1024 * 1024, // 5 MB
        maxFiles: 5,
        tailable: true,
    });

// ─── Root logger ─────────────────────────────────────────────────────────────
/**
 * Single root logger. All domain loggers are child instances created with
 * logger.child({ module: 'auth' }) — they inherit transports automatically.
 */
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    defaultMeta: { service: 'portfolio-api' },
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        fileTransport('combined.log'),
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            format: jsonFormat,
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
            tailable: true,
        }),
    ],
});

// ─── Child loggers (domain-scoped, share root transports) ────────────────────

/** Logs auth events: signup, login, logout, token refresh */
export const authLogger = logger.child({ module: 'auth' });

/** Logs DB connection and query events */
export const dbLogger = logger.child({ module: 'db' });

/** Logs security warnings: failed logins, rate-limit hits */
export const securityLogger = logger.child({ module: 'security' });

/** Logs blog CRUD operations */
export const blogLogger = logger.child({ module: 'blog' });

/** Logs project CRUD operations */
export const projectLogger = logger.child({ module: 'project' });

// ─── Morgan → Winston stream ─────────────────────────────────────────────────
/**
 * Morgan writes HTTP access logs into this stream so all logs go through
 * the same Winston pipeline instead of stdout.
 */
export const morganStream = {
    write: (message) => logger.http(message.trimEnd()),
};

export { logger };
export default logger;
