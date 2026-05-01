import express from 'express';
import { signUp, login, refresh, logout, currentUser } from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';
import rateLimiter from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import { signUpSchema, loginSchema } from '../validators/authValidator.js';

const router = express.Router();

// Apply strict rate limiting to all auth routes
// router.use(rateLimiter.auth);

// Public
router.post('/sign-up', validate(signUpSchema), signUp);
router.post('/login',   validate(loginSchema),  login);
router.post('/refresh', refresh);
router.post('/logout',  logout);

// Private
router.get('/current-user', authenticate, currentUser);

export default router;