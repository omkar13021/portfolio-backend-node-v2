import express from 'express';
import {
    getAllBlogs, getUserBlogs, getBlogById,
    createBlog, updateBlog, deleteBlog,
    restoreBlog, likeBlog, unlikeBlog, publishScheduledBlogs,
} from '../controllers/blogController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createBlogSchema, updateBlogSchema } from '../validators/blogValidator.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getAllBlogs);

// ── Private — specific paths MUST come before /:id ───────────────────────────
router.get('/user/my-blogs',     authenticate, getUserBlogs);
router.post('/publish-scheduled', authenticate, authorize('admin', 'super-admin'), publishScheduledBlogs);

router.post('/', authenticate, validate(createBlogSchema), createBlog);

router.put('/:id',          authenticate, validate(updateBlogSchema), updateBlog);
router.delete('/:id',       authenticate, deleteBlog);
router.post('/:id/restore', authenticate, restoreBlog);
router.post('/:id/like',    authenticate, likeBlog);
router.delete('/:id/like',  authenticate, unlikeBlog);

// ── Public — catch-all param route last ──────────────────────────────────────
router.get('/:id', getBlogById);

export default router;
