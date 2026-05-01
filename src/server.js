// env.js must be the very first import — it calls dotenv/config and validates env vars
import env from './config/env.js';
import connectDB from './config/db.js';
import createApp from './config/app.js';
import logger from './utils/logger.js';

const start = async () => {
    await connectDB();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
        logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown — finish in-flight requests before exiting
    const shutdown = (signal) => {
        logger.info(`${signal} received — shutting down gracefully`);
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Catch unhandled promise rejections so they don't silently swallow errors
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled rejection', { reason });
        shutdown('unhandledRejection');
    });
};

start();
