import { z } from 'zod';

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const dailyScheduleSchema = z.object({
  frequency: z.literal('daily'),
  time: timeSchema,
});
const weeklyScheduleSchema = z.object({
  frequency: z.literal('weekly'),
  time: timeSchema,
  weekday: z.number().int().min(1).max(7),
});
const monthlyScheduleSchema = z.object({
  frequency: z.literal('monthly'),
  time: timeSchema,
  day_of_month: z.number().int().min(1).max(28),
});

export const reportScheduleSchema = z.discriminatedUnion('frequency', [
  dailyScheduleSchema,
  weeklyScheduleSchema,
  monthlyScheduleSchema,
]);
export const reportStatusSchema = z.enum(['active', 'paused']);

export const reportSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  schedule: reportScheduleSchema,
  recipients: z.array(z.object({ id: z.string().min(1), name: z.string() })),
  status: reportStatusSchema,
});
export const reportsResponseSchema = z.object({ reports: z.array(reportSchema) });
export const reportActionResponseSchema = z.object({
  id: z.string().min(1),
  status: reportStatusSchema,
});
