import { ForbiddenError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware factory.
 *
 * Usage: router.delete('/:id', authenticate, authorize('admin', 'super-admin'), handler)
 *
 * @param {...string} roles - One or more allowed roles
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return next(new ForbiddenError());
    }
    next();
};

export default authorize;
