import { z } from 'zod';

export const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  question: z.string().min(1).max(500),
  history: z.array(chatHistoryItemSchema).max(6),
  conversation_id: z.string().optional(),
});

export const chatAnswerSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  detail: z.string().optional(),
  columns: z.array(z.object({ name: z.string(), type: z.string().optional() })),
  rows: z.array(z.array(z.unknown())),
  highlight_rows: z.array(z.number().int().nonnegative()).optional(),
  row_count: z.number().int().nonnegative(),
  truncated: z.boolean(),
  chart_hint: z.unknown().optional(),
  clarification_question: z.string().optional(),
});

export const chatResponseSchema = z.object({
  status: z.enum(['success', 'clarification_needed', 'refused', 'error']),
  answer: chatAnswerSchema,
  follow_ups: z.array(z.string()).default([]),
  meta: z.object({
    latency_ms: z.number().nonnegative(),
    conversation_id: z.string().optional(),
  }),
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
    retryable: z.boolean(),
    retry_after_seconds: z.number().nonnegative().optional(),
  }).optional(),
});
