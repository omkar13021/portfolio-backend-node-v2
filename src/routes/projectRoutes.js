import express from 'express';
import {
    getProjects,
    getUserProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    restoreProject,
    likeProject,
    unlikeProject,
    toggleFeatured
} from '../controllers/projectController.js';
import requiredAuth from '../middleware/requiredAuth.js';

const router = express.Router();

// Public routes
router.get('/', getProjects);
router.patch('/:id/like', likeProject);
router.patch('/:id/unlike', unlikeProject);

// Protected routes (require authentication)
router.get('/user/my-projects', requiredAuth, getUserProjects);
router.post('/', requiredAuth, createProject);
router.put('/:id', requiredAuth, updateProject);
router.delete('/:id', requiredAuth, deleteProject);
router.patch('/:id/restore', requiredAuth, restoreProject);
router.patch('/:id/toggle-featured', requiredAuth, toggleFeatured);

// Public route - must be last to avoid catching protected routes
router.get('/:id', getProjectById);

export default router;
