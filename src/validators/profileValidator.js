import { z } from 'zod';

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const locationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
}).optional();

const educationSchema = z.object({
  school: z.string().min(1, 'School name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  location: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().optional(),
  description: z.string().max(1000).optional(),
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().max(500).optional(),
  technologies: z.array(z.string()).optional(),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const languageSchema = z.object({
  name: z.string().min(1, 'Language name is required'),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'native']).optional(),
});

// ── Main Profile Schema ───────────────────────────────────────────────────────

export const profileBaseSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phone: z.string().max(20).optional(),
  location: locationSchema,
  linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(educationSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  isPublic: z.boolean().optional(),
});

export const createProfileSchema = z.object({
  body: profileBaseSchema,
});

export const updateProfileSchema = z.object({
  body: profileBaseSchema.partial(),
});
