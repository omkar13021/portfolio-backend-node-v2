/**
 * Express application factory.
 *
 * Separating app creation from server.js makes the app testable
 * (import app without binding to a port).
 */
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import corsHandler from '../middleware/corsHandler.js';
import requestId from '../middleware/requestId.js';
import rateLimiter from '../middleware/rateLimiter.js';
import requestLogger from '../middleware/requestLogger.js';
import errorHandler from '../middleware/errorHandler.js';
import router from '../routes/index.js';

const createApp = () => {
    const app = express();

    // ── Security headers ─────────────────────────────────────────────────────
    app.use(helmet());

    // ── CORS ─────────────────────────────────────────────────────────────────
    app.use(corsHandler);

    // ── Request ID (must come before loggers so ID is available) ─────────────
    app.use(requestId);

    // ── HTTP access logging (Morgan → Winston) ────────────────────────────────
    app.use(requestLogger);

    // ── Global rate limiter ───────────────────────────────────────────────────
    app.use(rateLimiter.global);

    // ── Body parsers ──────────────────────────────────────────────────────────
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // ── Input sanitization ────────────────────────────────────────────────────
    app.use(mongoSanitize());   // Strips $ and . from req.body/query/params

    // ── Routes ────────────────────────────────────────────────────────────────
    app.use('/api', router);

    // ── 404 handler ───────────────────────────────────────────────────────────
    app.use((req, res) => {
        res.status(404).json({
            success  : false,
            message  : `Route ${req.method} ${req.originalUrl} not found`,
            requestId: req.id,
        });
    });

    // ── Global error handler (must be last) ───────────────────────────────────
    app.use(errorHandler);

    return app;
};

export default createApp;
