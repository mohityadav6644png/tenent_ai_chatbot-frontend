import { z } from 'zod';

export const tenantStatusSchema = z.enum(['active', 'onboarding', 'suspended']);

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: tenantStatusSchema,
  user_count: z.number().int().nonnegative(),
  queries_month: z.number().int().nonnegative(),
});

export const tenantsResponseSchema = z.object({
  summary: z.object({
    active_tenants: z.number().int().nonnegative(),
    api_uptime_pct: z.number().min(0).max(100),
    avg_response_ms: z.number().nonnegative(),
    ai_tokens_month: z.number().nonnegative(),
  }),
  tenants: z.array(tenantSchema),
});

export const tenantActionResponseSchema = z.object({
  id: z.string(),
  status: tenantStatusSchema,
});

export const tenantDetailIdSchema = z.string().uuid();

export const tenantDetailResponseSchema = z.object({
  id: tenantDetailIdSchema,
  name: z.string(),
  status: tenantStatusSchema,
  stats: z.object({
    user_count: z.number().int().nonnegative(),
    queries_month: z.number().int().nonnegative(),
    ai_tokens_month: z.number().nonnegative(),
    avg_response_ms: z.number().nonnegative(),
  }),
  admins: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    last_login_at: z.string().datetime({ offset: true }).nullable(),
  })),
});

export const createTenantRequestSchema = z.object({
  company_name: z.string().trim()
    .min(2, 'Enter at least 2 characters.')
    .max(80, 'Use 80 characters or fewer.'),
  admin_name: z.string().trim()
    .min(2, 'Enter at least 2 characters.')
    .max(80, 'Use 80 characters or fewer.'),
  admin_email: z.string().trim()
    .email('Enter a valid email address.')
    .max(254, 'Use 254 characters or fewer.')
    .transform((email) => email.toLowerCase()),
  monthly_query_limit: z.union([z.literal(5000), z.literal(10000), z.literal(25000)]),
});

export const createTenantResponseSchema = z.object({
  id: z.string(),
  status: z.literal('onboarding'),
  invite_email_sent: z.boolean(),
});
