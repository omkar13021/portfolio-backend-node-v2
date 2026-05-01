/**
 * Base class for all operational (expected) API errors.
 * Extending Error allows instanceof checks in the error handler.
 */
export class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message    - Human-readable error message
     * @param {Array}  [errors]   - Optional array of field-level validation errors
     */
    constructor(statusCode, message, errors = []) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true; // Distinguish from programmer errors
        Error.captureStackTrace(this, this.constructor);
    }
}

/** 400 — Bad request / validation failure */
export class BadRequestError extends ApiError {
    constructor(message = 'Bad request', errors = []) {
        super(400, message, errors);
    }
}

/** 401 — Missing or invalid credentials */
export class UnauthorizedError extends ApiError {
    constructor(message = 'Authentication required') {
        super(401, message);
    }
}

/** 403 — Authenticated but not permitted */
export class ForbiddenError extends ApiError {
    constructor(message = 'You do not have permission to perform this action') {
        super(403, message);
    }
}

/** 404 — Resource not found */
export class NotFoundError extends ApiError {
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`);
    }
}

/** 409 — Unique constraint / duplicate */
export class ConflictError extends ApiError {
    constructor(message = 'Resource already exists') {
        super(409, message);
    }
}

/** 422 — Zod / schema validation errors */
export class ValidationError extends ApiError {
    constructor(errors = []) {
        super(422, 'Validation failed', errors);
    }
}

/** 429 — Rate limit hit */
export class TooManyRequestsError extends ApiError {
    constructor(message = 'Too many requests, please try again later') {
        super(429, message);
    }
}
