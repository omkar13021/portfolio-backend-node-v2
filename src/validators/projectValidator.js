import { z } from 'zod';

const imageSchema = z.object({
    url    : z.string().url('Image URL must be a valid URL'),
    alt    : z.string().optional(),
    caption: z.string().optional(),
});

const clientSchema = z.object({
    name       : z.string().optional(),
    company    : z.string().optional(),
    testimonial: z.string().optional(),
});

const resultSchema = z.object({
    metric: z.string(),
    value : z.string(),
});

const PROJECT_CATEGORIES = [
    'Web Development', 'Mobile App', 'UI/UX Design',
    'Data Science', 'Machine Learning', 'DevOps', 'Other',
];

const projectBaseSchema = z.object({
    title: z
        .string({ required_error: 'Title is required' })
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(150, 'Title must be at most 150 characters'),

    description: z
        .string({ required_error: 'Description is required' })
        .trim()
        .min(10, 'Description must be at least 10 characters')
        .max(500),

    fullDescription: z.string().trim().optional(),

    category: z
        .enum(PROJECT_CATEGORIES, { errorMap: () => ({ message: `Category must be one of: ${PROJECT_CATEGORIES.join(', ')}` }) })
        .default('Web Development'),

    technologies: z.array(z.string().trim()).optional().default([]),

    images        : z.array(imageSchema).optional().default([]),
    thumbnailImage: z.string().url('Thumbnail must be a valid URL').optional(),
    demoUrl       : z.string().url('Demo URL must be a valid URL').optional().or(z.literal('')),
    githubUrl     : z.string().url('GitHub URL must be a valid URL').optional().or(z.literal('')),

    status  : z.enum(['draft', 'published', 'archived']).default('draft'),
    featured: z.boolean().default(false),

    startDate: z.coerce.date().optional(),
    endDate  : z.coerce.date().optional(),

    client  : clientSchema.optional(),
    teamSize: z.number().int().positive().optional(),
    role    : z.string().trim().optional(),

    challenges: z.array(z.string()).optional().default([]),
    solutions : z.array(z.string()).optional().default([]),
    results   : z.array(resultSchema).optional().default([]),

    tags: z.array(z.string().trim().toLowerCase()).optional().default([]),

    metaTitle      : z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
});

export const createProjectSchema = projectBaseSchema;

/** All fields optional for updates */
export const updateProjectSchema = projectBaseSchema.partial();
