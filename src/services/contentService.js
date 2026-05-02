import Content from '../models/Content.js';
import { contentLogger } from '../utils/logger.js';
import { NotFoundError, ForbiddenError } from '../utils/ApiError.js';
import { resolveIdQuery, parseCommaList, parsePagination } from '../utils/helpers.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Finds a content and verifies ownership.
 * Throws NotFoundError or ForbiddenError as appropriate.
 */
const findAndVerifyOwner = async (id, userId, deletedFilter = false) => {
    const content = await Content.findOne(resolveIdQuery(id, deletedFilter));
    if (!content) throw new NotFoundError('Content');
    if (content.author.toString() !== userId.toString()) throw new ForbiddenError();
    return content;
};

// ─── Service methods ────────────────────────────────────────────────────────────

export const listContent = async (reqQuery, isAuthenticated) => {
    const { page, limit, skip } = parsePagination(reqQuery);
    const { status, category, featured, tags, search, author } = reqQuery;

    let query = Content.find({ isDeleted: false });

    if (status) {
        query = query.where('status').equals(status);
    } else if (!isAuthenticated) {
        query = query.published();
    }

    if (category) query = query.byCategory(category);
    if (featured === 'true') query = query.featured();
    if (tags)   query = query.where('tags').in(parseCommaList(tags));
    if (author) query = query.byAuthor(author);
    if (search) query = query.find({ $text: { $search: search } });

    const [contentItems, total] = await Promise.all([
        query
            .populate('author', 'name email')
            .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Content.countDocuments(query.getFilter()),
    ]);

    return { contentItems, total, page, limit };
};

export const getUserContent = async (userId, reqQuery) => {
    const { page, limit, skip } = parsePagination(reqQuery);
    const { status } = reqQuery;

    let query = Content.find({ author: userId, isDeleted: false });
    if (status) query = query.where('status').equals(status);

    const [contentItems, total] = await Promise.all([
        query.sort({ createdAt: -1 }).skip(skip).limit(limit),
        Content.countDocuments(query.getFilter()),
    ]);

    return { contentItems, total, page, limit };
};

export const getContent = async (id) => {
    const content = await Content.findOne(resolveIdQuery(id)).populate('author', 'name email');
    if (!content) throw new NotFoundError('Content');

    await Content.incrementViews(content._id);
    content.views += 1;

    contentLogger.info('Content viewed', { contentId: content._id });
    return content;
};

export const createContent = async (data, userId) => {
    const content = await Content.create({ ...data, author: userId });

    contentLogger.info('Content created', {
        contentId: content._id,
        authorId : userId,
        title    : content.title,
        status   : content.status,
    });

    return content;
};

export const updateContent = async (id, data, userId) => {
    const content = await findAndVerifyOwner(id, userId);

    const ALLOWED = [
        'title', 'description', 'fullDescription', 'category', 'technologies',
        'images', 'thumbnailImage', 'demoUrl', 'githubUrl', 'status', 'featured',
        'startDate', 'endDate', 'client', 'teamSize', 'role', 'challenges',
        'solutions', 'results', 'tags', 'metaTitle', 'metaDescription',
    ];

    ALLOWED.forEach((field) => {
        if (data[field] !== undefined) content[field] = data[field];
    });

    const updated = await content.save();

    contentLogger.info('Content updated', {
        contentId: content._id,
        authorId : userId,
        changes  : Object.keys(data),
    });

    return updated;
};

export const deleteContent = async (id, userId) => {
    const content = await findAndVerifyOwner(id, userId);
    await Content.softDelete(content._id);

    contentLogger.info('Content deleted', { contentId: content._id, authorId: userId });
};

export const restoreContent = async (id, userId) => {
    const content = await findAndVerifyOwner(id, userId, true);
    await Content.restore(content._id);

    contentLogger.info('Content restored', { contentId: content._id, authorId: userId });
};

export const likeContent = async (id) => {
    const content = await Content.findOne(resolveIdQuery(id));
    if (!content) throw new NotFoundError('Content');
    const updated = await Content.incrementLikes(content._id);
    return updated.likes;
};

export const unlikeContent = async (id) => {
    const content = await Content.findOne(resolveIdQuery(id));
    if (!content) throw new NotFoundError('Content');
    const updated = await Content.decrementLikes(content._id);
    return updated.likes;
};

export const toggleFeatured = async (id, userId) => {
    const content = await findAndVerifyOwner(id, userId);
    content.featured = !content.featured;
    await content.save();

    contentLogger.info('Content featured toggled', {
        contentId: content._id,
        featured : content.featured,
    });

    return content.featured;
};
