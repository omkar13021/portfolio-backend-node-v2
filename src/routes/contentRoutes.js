import express from 'express';
import {
    getContent, getUserContent, getContentById,
    createContent, updateContent, deleteContent,
    restoreContent, likeContent, unlikeContent, toggleFeatured,
} from '../controllers/contentController.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { createContentSchema, updateContentSchema } from '../validators/contentValidator.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',              getContent);
router.patch('/:id/like',   likeContent);
router.patch('/:id/unlike', unlikeContent);

// ── Private — specific paths MUST come before /:id ───────────────────────────
router.get('/user/my-content', authenticate, getUserContent);

router.post('/', authenticate, validate(createContentSchema), createContent);

router.put('/:id',                authenticate, validate(updateContentSchema), updateContent);
router.delete('/:id',             authenticate, deleteContent);
router.patch('/:id/restore',      authenticate, restoreContent);
router.patch('/:id/toggle-featured', authenticate, toggleFeatured);

// ── Public — catch-all param route last ──────────────────────────────────────
router.get('/:id', getContentById);

export default router;
