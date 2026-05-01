import mongoose from 'mongoose';
import env from 'dotenv';
import { dbLogger } from '../utils/logger.js';

env.config();
const connectionString = process.env.MONGODB_URL;

const DBConnect = async () => {
    try {
        const connect = await mongoose.connect(connectionString);
        
        dbLogger.info({
            type: 'DB_CONNECTION_SUCCESS',
            database: connect.connection.name,
            host: connect.connection.host,
            timestamp: new Date().toISOString()
        });
        
        console.log("Successfully connected to Database:", connect.connection.name);
    } catch (error) {
        dbLogger.error({
            type: 'DB_CONNECTION_ERROR',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        console.log(error);
        process.exit(1);
    }
}

// Log database queries in development
if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
        dbLogger.info({
            type: 'DB_QUERY',
            collection: collectionName,
            method: method,
            query: query,
            timestamp: new Date().toISOString()
        });
    });
}

export default DBConnect;