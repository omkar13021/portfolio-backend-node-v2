import { ValidationError } from '../utils/ApiError.js';

/**
 * Zod schema validation middleware factory.
 *
 * Validates req.body against the provided Zod schema and passes a
 * ValidationError (422) to the next error handler if it fails.
 *
 * Usage: router.post('/', validate(createBlogSchema), handler)
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        const errors = result.error.errors.map((e) => ({
            field  : e.path.join('.'),
            message: e.message,
        }));
        return next(new ValidationError(errors));
    }

    // Replace req[source] with the parsed (and coerced) data
    req[source] = result.data;
    next();
};

export default validate;
