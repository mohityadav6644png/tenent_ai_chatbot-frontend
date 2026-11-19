import { httpRequest } from '../httpClient.js';
import { auditEventsResponseSchema } from './schemas/audit.schema.js';

export async function listAuditEvents({ limit = 5, signal } = {}) {
  return auditEventsResponseSchema.parse(
    await httpRequest(`/v1/internal/audit?limit=${encodeURIComponent(limit)}`, { signal }),
  );
}
