import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique request ID to every incoming request.
 * Sets the X-Request-ID response header so clients can correlate logs.
 */
const requestId = (req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
};

export default requestId;
