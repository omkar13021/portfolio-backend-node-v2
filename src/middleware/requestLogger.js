import morgan from 'morgan';
import { morganStream } from '../utils/logger.js';

/**
 * HTTP access logger using Morgan, piped into the Winston stream.
 *
 * Format includes request ID so logs can be correlated with other events.
 * Uses 'dev' format in development and a compact JSON-friendly format in production.
 */
const format = process.env.NODE_ENV === 'production'
    ? ':req[x-request-id] :remote-addr :method :url :status :res[content-length] :response-time ms'
    : 'dev';

const requestLogger = morgan(format, { stream: morganStream });

export default requestLogger;
