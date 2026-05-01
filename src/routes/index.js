import { Router } from 'express';
import authRoutes    from './authRoutes.js';
import blogRoutes    from './blogRoutes.js';
import projectRoutes from './projectRoutes.js';

const router = Router();

router.use('/auth',     authRoutes);
router.use('/blogs',    blogRoutes);
router.use('/projects', projectRoutes);

export default router;
