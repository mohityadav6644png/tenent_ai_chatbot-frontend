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
    count: z.number().optional(),
    skipped: z.number().optional(),
    import_id: z.string().optional(),
    success: z.boolean().optional(),
  })
  .passthrough();

export const datasetItemSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    record_label: z.string().optional().default('record'),
    records: z.number().optional().default(0),
    last_updated: z.string().nullable().optional(),
    status: z.string().optional().default('ready'),
    required_columns: z.array(z.string()).default([]),
  })
  .passthrough();

export const datasetsResponseSchema = z.union([
  z.array(datasetItemSchema),
  z.object({ datasets: z.array(datasetItemSchema) }).transform((val) => val.datasets),
]);

export const importPreviewResponseSchema = z
  .object({
    total_rows: z.number().default(0),
    valid_rows: z.number().default(0),
    invalid_rows: z.number().default(0),
    required_columns: z.array(z.string()).default([]),
    missing_columns: z.array(z.string()).default([]),
    unknown_columns: z.array(z.string()).default([]),
    sample_rows: z.array(z.record(z.any())).default([]),
    errors: z
      .array(
        z
          .object({
            row: z.number().optional(),
            column: z.string().optional(),
            reason: z.string().optional(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

export const importDatasetResponseSchema = z
  .object({
    import_id: z.string().optional(),
    inserted: z.number().default(0),
    updated: z.number().default(0),
    skipped: z.number().default(0),
    status: z.string().optional().default('completed'),
  })
  .passthrough();
