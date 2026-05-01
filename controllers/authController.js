import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const createToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role 
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

export const signUp = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(409);
        throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user'
    });

    const token = createToken(user);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const token = createToken(user);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

export const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

export const currentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
});
