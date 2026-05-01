/**
 * Standardized API response helpers.
 *
 * Success shape:
 * {
 *   success: true,
 *   message: string,
 *   data: object | null,
 *   meta: object | null   ← pagination, counts, etc.
 * }
 *
 * Error shape (handled by errorHandler middleware):
 * {
 *   success: false,
 *   message: string,
 *   errors: array,
 *   requestId: string,
 *   stack: string | null  ← only in development
 * }
 */

/**
 * Send a successful response.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number}  options.statusCode - HTTP status (default 200)
 * @param {string}  options.message    - Human-readable success message
 * @param {*}       [options.data]     - Payload to return
 * @param {object}  [options.meta]     - Pagination / extra metadata
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
};

/**
 * Build the standard pagination meta object for list endpoints.
 *
 * @param {object} options
 * @param {number} options.total  - Total matching documents
 * @param {number} options.page   - Current page (1-indexed)
 * @param {number} options.limit  - Items per page
 * @param {number} options.count  - Items returned in this page
 */
export const paginationMeta = ({ total, page, limit, count }) => ({
    total,
    count,
    page,
    pages: Math.ceil(total / limit),
    limit,
});
