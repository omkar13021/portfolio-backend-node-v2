import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { UnauthorizedError } from '../utils/ApiError.js';

/**
 * Verifies the access token from the `accessToken` httpOnly cookie.
 * On success, attaches the decoded payload to `req.user`.
 * On failure, forwards an UnauthorizedError to the error handler.
 */
const authenticate = (req, res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        return next(new UnauthorizedError('No access token provided'));
    }

    try {
        const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Pass JWT-specific errors so the errorHandler can map them properly
        next(err);
    }
};

export default authenticate;
