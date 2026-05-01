import express from 'express';
import {
    getProjects, getUserProjects, getProjectById,
    createProject, updateProject, deleteProject,
    restoreProject, likeProject, unlikeProject, toggleFeatured,
} from '../controllers/projectController.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidator.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',              getProjects);
router.patch('/:id/like',   likeProject);
router.patch('/:id/unlike', unlikeProject);

// ── Private — specific paths MUST come before /:id ───────────────────────────
router.get('/user/my-projects', authenticate, getUserProjects);

router.post('/', authenticate, validate(createProjectSchema), createProject);

router.put('/:id',                authenticate, validate(updateProjectSchema), updateProject);
router.delete('/:id',             authenticate, deleteProject);
router.patch('/:id/restore',      authenticate, restoreProject);
router.patch('/:id/toggle-featured', authenticate, toggleFeatured);

// ── Public — catch-all param route last ──────────────────────────────────────
router.get('/:id', getProjectById);

export default router;
