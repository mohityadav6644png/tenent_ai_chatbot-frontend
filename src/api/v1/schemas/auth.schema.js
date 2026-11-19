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
});

export const authLoginResponseSchema = z.object({
  user: authUserSchema,
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  token_type: z.string().optional(),
});
