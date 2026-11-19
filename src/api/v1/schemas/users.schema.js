import { z } from 'zod';

export const companyUserRoleSchema = z.enum(['admin', 'employee']);
export const companyUserStatusSchema = z.enum(['active', 'invite_pending']);

export const companyUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string()  .email('Enter a valid email address.'),
  role: companyUserRoleSchema,
  status: companyUserStatusSchema,
  is_self: z.boolean(),
});

export const usersResponseSchema = z.object({
  summary: z.object({
    total_users: z.number().int().nonnegative(),
    admins: z.number().int().nonnegative(),
    pending_invites: z.number().int().nonnegative(),
  }),
  users: z.array(companyUserSchema),
});

export const userActionResponseSchema = z.object({
  id: z.string().min(1),
  status: z.string().optional(),
});

export const inviteActionResponseSchema = z.object({
  id: z.string().min(1),
});

export const createInviteRequestSchema = z.object({
  name: z.string().trim()
    .min(2, 'Enter at least 2 characters.')
    .max(80, 'Use 80 characters or fewer.'),
  email: z.string().trim()
    .email('Enter a valid email address.')
    .max(254, 'Use 254 characters or fewer.')
    .transform((email) => email.toLowerCase()),
  role: companyUserRoleSchema,
});

export const createInviteResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal('invite_pending'),
});
