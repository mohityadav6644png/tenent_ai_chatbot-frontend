import { z } from 'zod';

export const platformHealthResponseSchema = z.object({
  components: z.array(z.object({
    key: z.enum(['api', 'database', 'openai', 'cache']),
    label: z.string().min(1),
    status: z.string().min(1),
    checked_at: z.string().datetime({ offset: true }),
  })),
});
