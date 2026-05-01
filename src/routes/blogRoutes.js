import express from 'express';
import {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    restoreBlog,
    likeBlog,
    unlikeBlog,
    getUserBlogs,
    publishScheduledBlogs
} from '../controllers/blogController.js';
import requiredAuth from '../middleware/requiredAuth.js';

const router = express.Router();

// Public - Get all blogs with pagination and filtering
router.route('/').get(getAllBlogs);

// Public - Get single blog by slug or ID
router.route('/:id').get(getBlogById);

// Private - Create a new blog
router.route('/').post(requiredAuth, createBlog);

// Private - Get current user's blogs
router.route('/user/my-blogs').get(requiredAuth, getUserBlogs);

// Private - Update a blog (author only)
router.route('/:id').put(requiredAuth, updateBlog);

// Private - Delete a blog (soft delete, author only)
router.route('/:id').delete(requiredAuth, deleteBlog);

// Private - Restore a soft-deleted blog (author only)
router.route('/:id/restore').post(requiredAuth, restoreBlog);

// Private - Like a blog
router.route('/:id/like').post(requiredAuth, likeBlog);

// Private - Unlike a blog
router.route('/:id/like').delete(requiredAuth, unlikeBlog);

// Private - Publish scheduled blogs (admin only, for cron job)
router.route('/publish-scheduled').post(requiredAuth, publishScheduledBlogs);

export default router;
