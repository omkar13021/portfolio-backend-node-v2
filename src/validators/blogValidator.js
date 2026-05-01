import { z } from 'zod';

// ─── Content block schemas ────────────────────────────────────────────────────

const paragraphBlock = z.object({
    type: z.literal('paragraph'),
    data: z.object({ text: z.string().min(1, 'Paragraph text cannot be empty') }),
});

const headingBlock = z.object({
    type: z.literal('heading'),
    data: z.object({
        text : z.string().min(1),
        level: z.number().int().min(1).max(6),
    }),
});

const imageBlock = z.object({
    type: z.literal('image'),
    data: z.object({
        src    : z.string().url('Image src must be a valid URL'),
        alt    : z.string().optional(),
        caption: z.string().optional(),
    }),
});

const quoteBlock = z.object({
    type: z.literal('quote'),
    data: z.object({
        text  : z.string().min(1),
        author: z.string().optional(),
    }),
});

const listBlock = z.object({
    type: z.literal('list'),
    data: z.object({
        items  : z.array(z.string()).min(1, 'List must have at least one item'),
        ordered: z.boolean().optional().default(false),
    }),
});

const codeBlock = z.object({
    type: z.literal('code'),
    data: z.object({
        code    : z.string().min(1),
        language: z.string().optional(),
    }),
});

const contentBlockSchema = z.discriminatedUnion('type', [
    paragraphBlock,
    headingBlock,
    imageBlock,
    quoteBlock,
    listBlock,
    codeBlock,
]);

// ─── Blog schemas ─────────────────────────────────────────────────────────────

const scheduledRefine = (data) =>
    data.status !== 'scheduled' || (data.scheduledAt && data.scheduledAt > new Date());

const scheduledRefineMsg = {
    message: 'scheduledAt must be a future date when status is "scheduled"',
    path   : ['scheduledAt'],
};

// Base object schema (no .refine so .partial() works on it)
const blogBaseSchema = z.object({
    title: z
        .string({ required_error: 'Title is required' })
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be at most 200 characters'),

    slug: z.string().trim().toLowerCase().optional(),

    content: z
        .array(contentBlockSchema, { required_error: 'Content is required' })
        .min(1, 'Content must have at least one block'),

    excerpt: z.string().trim().max(500).optional(),

    featuredImage: z.string().url('Featured image must be a valid URL').optional(),

    tags    : z.array(z.string().trim()).optional().default([]),
    category: z
        .union([
            z.string().trim().min(1),
            z.object({ name: z.string().trim().min(1) }),
        ])
        .optional(),

    status     : z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
    scheduledAt: z.coerce.date().optional(),

    metaTitle      : z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
});

export const createBlogSchema = blogBaseSchema.refine(scheduledRefine, scheduledRefineMsg);

/** All fields optional for updates — .partial() must be called before .refine() */
export const updateBlogSchema = blogBaseSchema.partial().refine(scheduledRefine, scheduledRefineMsg);
