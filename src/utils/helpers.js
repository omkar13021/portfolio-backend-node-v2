import mongoose from 'mongoose';

/**
 * Builds a MongoDB query object that finds a document by either its ObjectId
 * or its slug, while also filtering out soft-deleted records.
 *
 * Eliminates the 15+ copy-paste blocks that existed across controllers.
 *
 * @param {string}  id        - The route param (could be ObjectId hex or a slug)
 * @param {boolean} [deleted] - If true, searches only soft-deleted docs (for restore)
 * @returns {object} Mongoose query filter
 */
export const resolveIdQuery = (id, deleted = false) => {
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
    const deletedFilter = { isDeleted: deleted };

    if (isObjectId) {
        return { $or: [{ _id: id }, { slug: id }], ...deletedFilter };
    }
    return { slug: id, ...deletedFilter };
};

/**
 * Converts a comma-separated string into a trimmed array of strings.
 * Used to parse query params like ?tags=react,node,typescript
 *
 * @param {string} str
 * @returns {string[]}
 */
export const parseCommaList = (str) =>
    str.split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Sanitizes pagination query params — clamps page >= 1, limit between 1–100.
 *
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const parsePagination = (query) => {
    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
