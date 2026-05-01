import asyncHandler from 'express-async-handler';
import Project from '../models/Project.js';
import { logger } from '../utils/logger.js';

// Create project logger
const projectLogger = logger.child({ module: 'project' });

// @desc    Get all projects with pagination and filters
// @route   GET /api/projects
// @access  Public (published only) / Private (all for authenticated users)
export const getProjects = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        category, 
        featured, 
        tags, 
        search,
        author 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = Project.find({ isDeleted: false });

    // Filter by status
    if (status) {
        query = query.where('status').equals(status);
    } else if (!req.user) {
        // Public access: only show published projects
        query = query.published();
    }

    // Filter by category
    if (category) {
        query = query.byCategory(category);
    }

    // Filter by featured
    if (featured === 'true') {
        query = query.featured();
    }

    // Filter by tags
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query = query.where('tags').in(tagArray);
    }

    // Filter by author
    if (author) {
        query = query.byAuthor(author);
    }

    // Full-text search
    if (search) {
        query = query.find({
            $text: { $search: search }
        });
    }

    const projects = await query
        .populate('author', 'name email')
        .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Project.countDocuments(query.getFilter());

    projectLogger.info({
        type: 'PROJECTS_FETCHED',
        requestId: req.id,
        count: projects.length,
        total,
        page,
        filters: { status, category, featured, tags, search }
    });

    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        projects
    });
});

// @desc    Get user's projects
// @route   GET /api/projects/user/my-projects
// @access  Private
export const getUserProjects = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = Project.find({ 
        author: req.user._id,
        isDeleted: false 
    });

    if (status) {
        query = query.where('status').equals(status);
    }

    const projects = await query
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Project.countDocuments(query.getFilter());

    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        projects
    });
});

// @desc    Get single project by slug or ID
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: false
        };
    } else {
        query = {
            slug: id,
            isDeleted: false
        };
    }

    const project = await Project.findOne(query).populate('author', 'name email');

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Increment views atomically
    await Project.incrementViews(project._id);
    project.views += 1;

    projectLogger.info({
        type: 'PROJECT_VIEWED',
        requestId: req.id,
        projectId: project._id,
        title: project.title
    });

    res.status(200).json({
        success: true,
        project
    });
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        fullDescription,
        category,
        technologies,
        images,
        thumbnailImage,
        demoUrl,
        githubUrl,
        status,
        featured,
        startDate,
        endDate,
        client,
        teamSize,
        role,
        challenges,
        solutions,
        results,
        tags,
        metaTitle,
        metaDescription
    } = req.body;

    // Basic validation removed for testing

    const project = await Project.create({
        title,
        description,
        fullDescription,
        category,
        technologies,
        images,
        thumbnailImage,
        demoUrl,
        githubUrl,
        status: status || 'draft',
        featured: featured || false,
        startDate,
        endDate,
        client,
        teamSize,
        role,
        challenges,
        solutions,
        results,
        tags,
        metaTitle,
        metaDescription,
        author: req.user._id
    });

    projectLogger.info({
        type: 'PROJECT_CREATED',
        requestId: req.id,
        projectId: project._id,
        authorId: req.user._id,
        title: project.title,
        status: project.status
    });

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        project
    });
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (author only)
export const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: false
        };
    } else {
        query = {
            slug: id,
            isDeleted: false
        };
    }

    const project = await Project.findOne(query);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this project');
    }

    // Update fields
    const allowedUpdates = [
        'title', 'description', 'fullDescription', 'category', 'technologies',
        'images', 'thumbnailImage', 'demoUrl', 'githubUrl', 'status', 'featured',
        'startDate', 'endDate', 'client', 'teamSize', 'role', 'challenges',
        'solutions', 'results', 'tags', 'metaTitle', 'metaDescription'
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            project[field] = req.body[field];
        }
    });

    const updatedProject = await project.save();

    projectLogger.info({
        type: 'PROJECT_UPDATED',
        requestId: req.id,
        projectId: project._id,
        authorId: req.user._id,
        title: project.title,
        changes: Object.keys(req.body)
    });

    res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        project: updatedProject
    });
});

// @desc    Delete a project (soft delete)
// @route   DELETE /api/projects/:id
// @access  Private (author only)
export const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: false
        };
    } else {
        query = {
            slug: id,
            isDeleted: false
        };
    }

    const project = await Project.findOne(query);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this project');
    }

    await Project.softDelete(project._id);

    projectLogger.info({
        type: 'PROJECT_DELETED',
        requestId: req.id,
        projectId: project._id,
        authorId: req.user._id,
        title: project.title
    });

    res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
    });
});

// @desc    Restore a soft-deleted project
// @route   PATCH /api/projects/:id/restore
// @access  Private (author only)
export const restoreProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: true
        };
    } else {
        query = {
            slug: id,
            isDeleted: true
        };
    }

    const project = await Project.findOne(query);

    if (!project) {
        res.status(404);
        throw new Error('Project not found or not deleted');
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to restore this project');
    }

    await Project.restore(project._id);

    projectLogger.info({
        type: 'PROJECT_RESTORED',
        requestId: req.id,
        projectId: project._id,
        authorId: req.user._id,
        title: project.title
    });

    res.status(200).json({
        success: true,
        message: 'Project restored successfully'
    });
});

// @desc    Like a project
// @route   PATCH /api/projects/:id/like
// @access  Public
export const likeProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: false
        };
    } else {
        query = {
            slug: id,
            isDeleted: false
        };
    }

    const project = await Project.findOne(query);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const updatedProject = await Project.incrementLikes(project._id);

    res.status(200).json({
        success: true,
        likes: updatedProject.likes
    });
});

// @desc    Unlike a project
// @route   PATCH /api/projects/:id/unlike
// @access  Public
export const unlikeProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: false
        };
    } else {
        query = {
            slug: id,
            isDeleted: false
        };
    }

    const project = await Project.findOne(query);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const updatedProject = await Project.decrementLikes(project._id);

    res.status(200).json({
        success: true,
        likes: updatedProject.likes
    });
});

// @desc    Toggle project featured status
// @route   PATCH /api/projects/:id/toggle-featured
// @access  Private (author only)
export const toggleFeatured = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await Project.findOne({
        _id: id,
        isDeleted: false
    });

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this project');
    }

    project.featured = !project.featured;
    await project.save();

    projectLogger.info({
        type: 'PROJECT_FEATURED_TOGGLED',
        requestId: req.id,
        projectId: project._id,
        authorId: req.user._id,
        featured: project.featured
    });

    res.status(200).json({
        success: true,
        message: `Project ${project.featured ? 'featured' : 'unfeatured'} successfully`,
        featured: project.featured
    });
});
