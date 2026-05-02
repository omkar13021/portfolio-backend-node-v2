import { Router } from 'express';
import authRoutes    from './authRoutes.js';
import blogRoutes    from './blogRoutes.js';
import contentRoutes from './contentRoutes.js';
import profileRoutes from './profileRoutes.js';

const router = Router();

router.use('/auth',     authRoutes);
router.use('/blogs',    blogRoutes);
router.use('/content', contentRoutes);
router.use('/profile',  profileRoutes);

export default router;
