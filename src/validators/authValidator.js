import { z } from 'zod';

export const signUpSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters'),

    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Invalid email address'),

    password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must be at most 72 characters'),
    // Role must NOT be accepted from the client — assigned server-side only
});

export const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Invalid email address'),

    password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required'),
});
