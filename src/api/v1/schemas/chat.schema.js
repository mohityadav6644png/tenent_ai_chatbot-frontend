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
  headline: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
  columns: z.array(z.object({ name: z.string(), type: z.string().optional() })).default([]),
  rows: z.array(z.array(z.unknown())).default([]),
  highlight_rows: z.array(z.number().int().nonnegative()).nullable().optional(),
  row_count: z.number().int().nonnegative().default(0),
  truncated: z.boolean().default(false),
  chart_hint: z.unknown().nullable().optional(),
  clarification_question: z.string().nullable().optional(),
  options: z.array(z.string()).default([]),
});

export const profilePromptSchema = z.object({
  field: z.enum(['name', 'company_name', 'interest']),
  text: z.string(),
  skippable: z.boolean().default(true),
});

export const multiDocAnswerMetaSchema = z.object({
  used_multi_doc: z.boolean().default(false),
  document_ids: z.array(z.string()).default([]),
  source_names: z.array(z.string()).default([]),
  join_keys_used: z.array(z.string()).default([]),
  partial_coverage_note: z.string().nullable().optional(),
});

export const chatResponseSchema = z.object({
  status: z.enum(['success', 'clarification_needed', 'refused', 'error']),
  answer: chatAnswerSchema,
  follow_ups: z.array(z.string()).default([]),
  meta: z.object({
    latency_ms: z.number().nonnegative(),
    conversation_id: z.string().nullable().optional(),
    cache: z.string().optional(),
    interpreted_question: z.string().nullable().optional(),
  }),
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
    retryable: z.boolean(),
    retry_after_seconds: z.number().nonnegative().optional(),
  }).nullable().optional(),
  conversation_id: z.string().nullable().optional(),
  request_id: z.string().optional(),
  profile_prompt: profilePromptSchema.nullable().optional(),
  multidoc_meta: multiDocAnswerMetaSchema.nullable().optional(),
});
