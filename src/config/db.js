import mongoose from 'mongoose';
import env from './env.js';
import { dbLogger } from '../utils/logger.js';

/**
 * Establishes a connection to MongoDB.
 * Exits the process on failure — the app cannot run without a DB.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URL);

        dbLogger.info('MongoDB connected', {
            database: conn.connection.name,
            host    : conn.connection.host,
        });

        // Log queries in development only
        if (env.isDev) {
            mongoose.set('debug', (collection, method, query) => {
                dbLogger.debug('DB query', { collection, method, query });
            });
        }
    } catch (error) {
        dbLogger.error('MongoDB connection failed', { error: error.message });
        process.exit(1);
    }
};

export default connectDB;
