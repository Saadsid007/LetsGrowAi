import { z } from 'zod';

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9][\d\s-]{7,14}$/, 'Invalid phone number format')
    .optional(),
  currentStatus: z
    .enum(['student', 'fresher', 'working', 'switcher'], {
      errorMap: () => ({ message: 'Invalid current status' }),
    })
    .optional(),
  targetRole: z.string().max(100).trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  experienceLevel: z
    .enum(['0-1yr', '1-3yr', '3-5yr', '5yr+'], {
      errorMap: () => ({ message: 'Invalid experience level' }),
    })
    .optional(),
  preferredLocation: z.string().max(100).trim().optional(),
});
