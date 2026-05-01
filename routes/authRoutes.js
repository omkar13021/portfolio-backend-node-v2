import express from 'express';
import { currentUser, login, logout, signUp } from '../controllers/authController.js';
import requiredAuth from '../middleware/requiredAuth.js';

const router = express.Router();

// Public - Sign Up
router.route('/sign-up').post(signUp);

// Public - Login
router.route('/login').post(login);

// Public - Logout
router.route('/logout').post(logout);

// Private - Current User
router.route('/current-user').get(requiredAuth, currentUser);


export default router;