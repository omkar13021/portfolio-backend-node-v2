import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { authLogger } from '../utils/logger.js';

export const signUp = async (req, res) => {
    const user = await authService.registerUser(req.body);
    authService.attachTokenCookies(res, user);

    sendSuccess(res, {
        statusCode: 201,
        message   : 'Account created successfully',
        data      : { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
};

export const login = async (req, res) => {
    const user = await authService.loginUser(req.body, req);
    authService.attachTokenCookies(res, user);

    sendSuccess(res, {
        message: 'Login successful',
        data   : { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
};

export const refresh = async (req, res) => {
    const token = req.cookies?.refreshToken;
    const user  = await authService.refreshTokens(token);
    authService.attachTokenCookies(res, user);

    sendSuccess(res, { message: 'Tokens refreshed' });
};

export const logout = async (req, res) => {
    authLogger.info('User logged out', { userId: req.user?._id });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    sendSuccess(res, { message: 'Logged out successfully' });
};

export const currentUser = async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id);

    sendSuccess(res, {
        data: {
            _id      : user._id,
            name     : user.name,
            email    : user.email,
            role     : user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
};
