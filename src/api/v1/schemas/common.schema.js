import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['employee', 'company_admin', 'super_admin']),
});
