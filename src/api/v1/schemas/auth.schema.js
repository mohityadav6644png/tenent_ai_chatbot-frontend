import { z } from 'zod';

export const authLoginRequestSchema = z.object({
  email: z.string().email('Enter a valid work email.').max(254),
  password: z.string().min(1, 'Enter your password.').max(128),
});

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['employee', 'company_admin', 'super_admin']),
  company_name: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  company_id: z.string().nullable().optional(),
  is_verified: z.boolean().optional(),
});

export const authLoginResponseSchema = z.object({
  user: authUserSchema,
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  token_type: z.string().optional(),
});

export const acceptInviteRequestSchema = z.object({
  token: z.string().min(1, 'Invite token is required.'),
  password: z.string().min(10, 'Password must be at least 10 characters long.').max(128),
});

export const acceptInviteResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default('bearer'),
  refresh_token: z.string().optional(),
  user: authUserSchema.optional(),
  message: z.string().optional(),
  success: z.boolean().optional(),
});
