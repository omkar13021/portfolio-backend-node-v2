import Project from '../models/Project.js';
import { projectLogger } from '../utils/logger.js';
import { NotFoundError, ForbiddenError } from '../utils/ApiError.js';
import { resolveIdQuery, parseCommaList, parsePagination } from '../utils/helpers.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Finds a project and verifies ownership.
 * Throws NotFoundError or ForbiddenError as appropriate.
 */
const findAndVerifyOwner = async (id, userId, deletedFilter = false) => {
    const project = await Project.findOne(resolveIdQuery(id, deletedFilter));
    if (!project) throw new NotFoundError('Project');
    if (project.author.toString() !== userId.toString()) throw new ForbiddenError();
    return project;
};

// ─── Service methods ────────────────────────────────────────────────────────────

export const listProjects = async (reqQuery, isAuthenticated) => {
    const { page, limit, skip } = parsePagination(reqQuery);
    const { status, category, featured, tags, search, author } = reqQuery;

    let query = Project.find({ isDeleted: false });

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

    const [projects, total] = await Promise.all([
        query
            .populate('author', 'name email')
            .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Project.countDocuments(query.getFilter()),
    ]);

    return { projects, total, page, limit };
};

export const getUserProjects = async (userId, reqQuery) => {
    const { page, limit, skip } = parsePagination(reqQuery);
    const { status } = reqQuery;

    let query = Project.find({ author: userId, isDeleted: false });
    if (status) query = query.where('status').equals(status);

    const [projects, total] = await Promise.all([
        query.sort({ createdAt: -1 }).skip(skip).limit(limit),
        Project.countDocuments(query.getFilter()),
    ]);

    return { projects, total, page, limit };
};

export const getProject = async (id) => {
    const project = await Project.findOne(resolveIdQuery(id)).populate('author', 'name email');
    if (!project) throw new NotFoundError('Project');

    await Project.incrementViews(project._id);
    project.views += 1;

    projectLogger.info('Project viewed', { projectId: project._id });
    return project;
};

export const createProject = async (data, userId) => {
    const project = await Project.create({ ...data, author: userId });

    projectLogger.info('Project created', {
        projectId: project._id,
        authorId : userId,
        title    : project.title,
        status   : project.status,
    });

    return project;
};

export const updateProject = async (id, data, userId) => {
    const project = await findAndVerifyOwner(id, userId);

    const ALLOWED = [
        'title', 'description', 'fullDescription', 'category', 'technologies',
        'images', 'thumbnailImage', 'demoUrl', 'githubUrl', 'status', 'featured',
        'startDate', 'endDate', 'client', 'teamSize', 'role', 'challenges',
        'solutions', 'results', 'tags', 'metaTitle', 'metaDescription',
    ];

    ALLOWED.forEach((field) => {
        if (data[field] !== undefined) project[field] = data[field];
    });

    const updated = await project.save();

    projectLogger.info('Project updated', {
        projectId: project._id,
        authorId : userId,
        changes  : Object.keys(data),
    });

    return updated;
};

export const deleteProject = async (id, userId) => {
    const project = await findAndVerifyOwner(id, userId);
    await Project.softDelete(project._id);

    projectLogger.info('Project deleted', { projectId: project._id, authorId: userId });
};

export const restoreProject = async (id, userId) => {
    const project = await findAndVerifyOwner(id, userId, true);
    await Project.restore(project._id);

    projectLogger.info('Project restored', { projectId: project._id, authorId: userId });
};

export const likeProject = async (id) => {
    const project = await Project.findOne(resolveIdQuery(id));
    if (!project) throw new NotFoundError('Project');
    const updated = await Project.incrementLikes(project._id);
    return updated.likes;
};

export const unlikeProject = async (id) => {
    const project = await Project.findOne(resolveIdQuery(id));
    if (!project) throw new NotFoundError('Project');
    const updated = await Project.decrementLikes(project._id);
    return updated.likes;
};

export const toggleFeatured = async (id, userId) => {
    const project = await findAndVerifyOwner(id, userId);
    project.featured = !project.featured;
    await project.save();

    projectLogger.info('Project featured toggled', {
        projectId: project._id,
        featured : project.featured,
    });

    return project.featured;
};
