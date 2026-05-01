import Blog from '../models/Blog.js';
import { blogLogger } from '../utils/logger.js';
import { NotFoundError, ForbiddenError } from '../utils/ApiError.js';
import { resolveIdQuery, parseCommaList, parsePagination } from '../utils/helpers.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const findAndVerifyOwner = async (id, userId, deletedFilter = false) => {
    const blog = await Blog.findOne(resolveIdQuery(id, deletedFilter));
    if (!blog) throw new NotFoundError('Blog');
    if (blog.author.toString() !== userId.toString()) throw new ForbiddenError();
    return blog;
};

// ─── Service methods ────────────────────────────────────────────────────────────

export const listBlogs = async (reqQuery, isAuthenticated) => {
    const { page, limit, skip } = parsePagination(reqQuery);
    const { status, category, tags, search, author } = reqQuery;

    let query = Blog.find().notDeleted();

    if (status) {
        query = query.where('status').equals(status);
    } else if (!isAuthenticated) {
        query = query.published();
    }

    if (category) query = query.where('category').equals(category);
    if (tags)     query = query.where('tags').in(parseCommaList(tags));
    if (author)   query = query.where('author').equals(author);
    if (search)   query = query.find({ $text: { $search: search } });

    const [blogs, total] = await Promise.all([
        query
            .populate('author', 'name email')
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Blog.countDocuments(query.getFilter()),
    ]);

    return { blogs, total, page, limit };
};

export const getUserBlogs = async (userId, reqQuery) => {
    const { page, limit, skip } = parsePagination(reqQuery);
    const { status } = reqQuery;

    let query = Blog.find({ author: userId, isDeleted: false });
    if (status) query = query.where('status').equals(status);

    const [blogs, total] = await Promise.all([
        query.sort({ createdAt: -1 }).skip(skip).limit(limit),
        Blog.countDocuments({ author: userId, isDeleted: false }),
    ]);

    return { blogs, total, page, limit };
};

export const getBlog = async (id) => {
    const blog = await Blog.findOne(resolveIdQuery(id)).populate('author', 'name email');
    if (!blog) throw new NotFoundError('Blog');

    await Blog.incrementViews(blog._id);
    blog.views += 1;

    return blog;
};

export const createBlog = async (data, userId) => {
    const blog = await Blog.create({ ...data, author: userId });

    blogLogger.info('Blog created', {
        blogId  : blog._id,
        authorId: userId,
        title   : blog.title,
        status  : blog.status,
    });

    return blog;
};

export const updateBlog = async (id, data, userId) => {
    const blog = await findAndVerifyOwner(id, userId);

    // Use consistent save() pattern (runs hooks + validators)
    Object.assign(blog, data);
    const updated = await blog.save();

    blogLogger.info('Blog updated', { blogId: blog._id, authorId: userId });

    return updated;
};

export const deleteBlog = async (id, userId) => {
    const blog = await findAndVerifyOwner(id, userId);
    await Blog.softDelete(blog._id);

    blogLogger.info('Blog deleted', { blogId: blog._id, authorId: userId });
};

export const restoreBlog = async (id, userId) => {
    const blog = await findAndVerifyOwner(id, userId, true);
    await Blog.restore(blog._id);

    blogLogger.info('Blog restored', { blogId: blog._id, authorId: userId });
};

export const likeBlog = async (id) => {
    const blog = await Blog.findOne(resolveIdQuery(id));
    if (!blog) throw new NotFoundError('Blog');
    const updated = await Blog.incrementLikes(blog._id);
    return updated.likes;
};

export const unlikeBlog = async (id) => {
    const blog = await Blog.findOne(resolveIdQuery(id));
    if (!blog) throw new NotFoundError('Blog');
    const updated = await Blog.decrementLikes(blog._id);
    return updated.likes;
};

export const publishScheduled = async () => {
    const due = await Blog.find({
        status     : 'scheduled',
        scheduledAt: { $lte: new Date() },
        isDeleted  : false,
    });

    if (!due.length) return [];

    const updated = await Promise.all(
        due.map((b) =>
            Blog.findByIdAndUpdate(
                b._id,
                { status: 'published', publishedAt: new Date() },
                { new: true }
            )
        )
    );

    blogLogger.info('Scheduled blogs published', { count: updated.length });

    return updated;
};
