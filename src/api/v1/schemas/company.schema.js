import { z } from 'zod';

export const companyDataInsertRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.'),
  content: z
    .string()
    .trim()
    .min(1, 'Content is required.')
    .max(20000, 'Content must be 20,000 characters or fewer.'),
});

export const companyDataInsertResponseSchema = z
  .object({
    id: z.string().optional(),
    record_id: z.string().optional(),
    message: z.string().optional(),
    company_id: z.string().nullable().optional(),
    success: z.boolean().optional(),
  })
  .passthrough();

export const companyCsvImportResponseSchema = z
  .object({
    message: z.string().optional(),
    total_records_imported: z.number().optional(),
    imported_count: z.number().optional(),
    records_count: z.number().optional(),
    success: z.boolean().optional(),
  })
  .passthrough();
