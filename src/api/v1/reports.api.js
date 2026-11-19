import { httpRequest } from '../httpClient.js';
import {
  reportActionResponseSchema,
  reportsResponseSchema,
} from './schemas/reports.schema.js';

export async function listReports({ signal } = {}) {
  return reportsResponseSchema.parse(await httpRequest('/v1/reports', { signal }));
}

async function updateReportStatus(id, action) {
  return reportActionResponseSchema.parse(await httpRequest(
    `/v1/reports/${encodeURIComponent(id)}/${action}`,
    { method: 'POST' },
  ));
}

export const pauseReport = (id) => updateReportStatus(id, 'pause');
export const resumeReport = (id) => updateReportStatus(id, 'resume');
