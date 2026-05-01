import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { authLogger, securityLogger } from '../utils/logger.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/ApiError.js';

const SALT_ROUNDS = 12;

// ─── Token helpers ─────────────────────────────────────────────────────────────

const tokenPayload = (user) => ({
    _id  : user._id,
    email: user.email,
    role : user.role,
});

export const signAccessToken = (user) =>
    jwt.sign(tokenPayload(user), env.ACCESS_TOKEN_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    });

export const signRefreshToken = (user) =>
    jwt.sign(tokenPayload(user), env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });

/**
 * Sets both tokens as httpOnly cookies on the response.
 */
export const attachTokenCookies = (res, user) => {
    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const secure   = env.isProd;
    const sameSite = env.isProd ? 'strict' : 'lax';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 15 * 60 * 1000,                // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure,
        sameSite,
        path    : '/api/auth/refresh',          // Scoped — only sent to refresh endpoint
        maxAge  : 7 * 24 * 60 * 60 * 1000,     // 7 days
    });

    return { accessToken, refreshToken };
};

// ─── Service methods ────────────────────────────────────────────────────────────

export const registerUser = async ({ name, email, password }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role    : 'user', // Role is NEVER accepted from the client
    });

    authLogger.info('User registered', { userId: user._id, email: user.email });

    return user;
};

export const loginUser = async ({ email, password }, req) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        securityLogger.warn('Login failed: user not found', { email, ip: req.ip });
        throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        securityLogger.warn('Login failed: wrong password', { userId: user._id, ip: req.ip });
        throw new UnauthorizedError('Invalid credentials');
    }

    authLogger.info('User logged in', { userId: user._id, email: user.email });

    return user;
};

export const refreshTokens = async (token) => {
    let decoded;
    try {
        decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded._id);
    if (!user) throw new UnauthorizedError('User no longer exists');

    authLogger.info('Tokens refreshed', { userId: user._id });

    return user;
};

export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new NotFoundError('User');
    return user;
};
