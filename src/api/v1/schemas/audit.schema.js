import { z } from 'zod';

export const auditEventsResponseSchema = z.object({
  events: z.array(z.object({
    id: z.string().min(1),
    occurred_at: z.string().datetime({ offset: true }),
    actor: z.string(),
    action: z.string(),
    target: z.string(),
    result: z.string().min(1),
  })),
});
