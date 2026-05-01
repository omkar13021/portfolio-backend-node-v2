import asyncHandler from 'express-async-handler';
import Blog from '../models/Blog.js';
import { blogLogger } from '../utils/logger.js';

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private
export const createBlog = asyncHandler(async (req, res) => {
    const { title, slug, content, excerpt, featuredImage, tags, category, status, scheduledAt, metaTitle, metaDescription } = req.body;

    if (!title || !content || !content.length) {
        res.status(400);
        throw new Error('Title and content are required');
    }

    const blog = await Blog.create({
        title,
        slug,
        content,
        excerpt,
        author: req.user._id,
        featuredImage,
        tags,
        category,
        status,
        scheduledAt,
        metaTitle,
        metaDescription
    });

    blogLogger.info({
        type: 'BLOG_CREATED',
        requestId: req.id,
        blogId: blog._id,
        authorId: req.user._id,
        title: blog.title,
        status: blog.status,
        timestamp: new Date().toISOString()
    });

    res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        blog
    });
});

// @desc    Get all blogs (with pagination, filtering, and search)
// @route   GET /api/blogs
// @access  Public
export const getAllBlogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, category, tags, search, author } = req.query;

    let query = Blog.find().notDeleted();

    // Filter by status
    if (status) {
        query = query.where('status').equals(status);
    } else {
        // By default, only show published blogs for public access
        query = query.published();
    }

    // Filter by category
    if (category) {
        query = query.where('category').equals(category);
    }

    // Filter by tags
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query = query.where('tags').in(tagArray);
    }

    // Filter by author
    if (author) {
        query = query.where('author').equals(author);
    }

    // Full-text search
    if (search) {
        query = query.find({
            $text: { $search: search }
        });
    }

    const blogs = await query
        .populate('author', 'name email')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Blog.countDocuments(query.getFilter());

    res.status(200).json({
        success: true,
        count: blogs.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        blogs
    });
});

// @desc    Get single blog by slug or ID
// @route   GET /api/blogs/:id
// @access  Public
export const getBlogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isValidObjectId) {
        // If valid ObjectId, search by both _id and slug
        query = {
            $or: [{ _id: id }, { slug: id }],
            isDeleted: false
        };
    } else {
        // If not valid ObjectId, search only by slug
        query = {
            slug: id,
            isDeleted: false
        };
    }

    const blog = await Blog.findOne(query).populate('author', 'name email');

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Increment views atomically
    await Blog.incrementViews(blog._id);
    blog.views += 1;

    res.status(200).json({
        success: true,
        blog
    });
});

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private (author only)
export const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, slug, content, excerpt, featuredImage, tags, category, status, scheduledAt, metaTitle, metaDescription } = req.body;

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

    const blog = await Blog.findOne(query);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this blog');
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blog._id,
        {
            title,
            slug,
            content,
            excerpt,
            featuredImage,
            tags,
            category,
            status,
            scheduledAt,
            metaTitle,
            metaDescription
        },
        { new: true, runValidators: true }
    );

    blogLogger.info({
        type: 'BLOG_UPDATED',
        requestId: req.id,
        blogId: blog._id,
        authorId: req.user._id,
        title: blog.title,
        timestamp: new Date().toISOString()
    });

    res.status(200).json({
        success: true,
        message: 'Blog updated successfully',
        blog: updatedBlog
    });
});

// @desc    Delete a blog (soft delete)
// @route   DELETE /api/blogs/:id
// @access  Private (author only)
export const deleteBlog = asyncHandler(async (req, res) => {
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

    const blog = await Blog.findOne(query);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this blog');
    }

    await Blog.softDelete(blog._id);

    blogLogger.info({
        type: 'BLOG_DELETED',
        requestId: req.id,
        blogId: blog._id,
        authorId: req.user._id,
        title: blog.title,
        timestamp: new Date().toISOString()
    });

    res.status(200).json({
        success: true,
        message: 'Blog deleted successfully'
    });
});

// @desc    Restore a soft-deleted blog
// @route   POST /api/blogs/:id/restore
// @access  Private (author only)
export const restoreBlog = asyncHandler(async (req, res) => {
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

    const blog = await Blog.findOne(query);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found or not deleted');
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to restore this blog');
    }

    await Blog.restore(blog._id);

    blogLogger.info({
        type: 'BLOG_RESTORED',
        requestId: req.id,
        blogId: blog._id,
        authorId: req.user._id,
        title: blog.title,
        timestamp: new Date().toISOString()
    });

    res.status(200).json({
        success: true,
        message: 'Blog restored successfully'
    });
});

// @desc    Like a blog
// @route   POST /api/blogs/:id/like
// @access  Private
export const likeBlog = asyncHandler(async (req, res) => {
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

    const blog = await Blog.findOne(query);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    const updatedBlog = await Blog.incrementLikes(blog._id);

    res.status(200).json({
        success: true,
        message: 'Blog liked successfully',
        likes: updatedBlog.likes
    });
});

// @desc    Unlike a blog
// @route   DELETE /api/blogs/:id/like
// @access  Private
export const unlikeBlog = asyncHandler(async (req, res) => {
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

    const blog = await Blog.findOne(query);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    const updatedBlog = await Blog.decrementLikes(blog._id);

    res.status(200).json({
        success: true,
        message: 'Blog unliked successfully',
        likes: updatedBlog.likes
    });
});

// @desc    Get user's blogs
// @route   GET /api/blogs/user/my-blogs
// @access  Private
export const getUserBlogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;

    let query = Blog.find({ author: req.user._id, isDeleted: false });

    if (status) {
        query = query.where('status').equals(status);
    }

    const blogs = await query
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Blog.countDocuments({ author: req.user._id, isDeleted: false });

    res.status(200).json({
        success: true,
        count: blogs.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        blogs
    });
});

// @desc    Publish scheduled blogs (for cron job)
// @route   POST /api/blogs/publish-scheduled
// @access  Private (admin only)
export const publishScheduledBlogs = asyncHandler(async (req, res) => {
    const scheduledBlogs = await Blog.scheduledReady();

    const updatePromises = scheduledBlogs.map(blog => 
        Blog.findByIdAndUpdate(
            blog._id,
            { status: 'published', publishedAt: new Date() },
            { new: true }
        )
    );

    const updatedBlogs = await Promise.all(updatePromises);

    blogLogger.info({
        type: 'SCHEDULED_BLOGS_PUBLISHED',
        requestId: req.id,
        count: updatedBlogs.length,
        timestamp: new Date().toISOString()
    });

    res.status(200).json({
        success: true,
        message: `${updatedBlogs.length} scheduled blogs published`,
        count: updatedBlogs.length,
        blogs: updatedBlogs
    });
});
