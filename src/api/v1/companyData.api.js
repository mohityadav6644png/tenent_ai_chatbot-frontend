import { API_BASE_URL } from '../../config/env.js';
import { httpRequest, getAuthToken, HttpError } from '../httpClient.js';
import {
  companyDataInsertRequestSchema,
  companyDataInsertResponseSchema,
  companyCsvImportResponseSchema,
  datasetsResponseSchema,
  importPreviewResponseSchema,
  importDatasetResponseSchema,
} from './schemas/companyData.schema.js';

export async function insertCompanyRecord({ title, content }, { signal } = {}) {
  const body = companyDataInsertRequestSchema.parse({ title, content });
  const result = await httpRequest('/v1/company/data/insert', {
    method: 'POST',
    body,
    signal,
  });
  return companyDataInsertResponseSchema.parse(result);
}

export async function importCompanyCsv({ file, titleColumn, contentColumn }, { signal } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  if (titleColumn && typeof titleColumn === 'string' && titleColumn.trim()) {
    formData.append('title_column', titleColumn.trim());
  }
  if (contentColumn && typeof contentColumn === 'string' && contentColumn.trim()) {
    formData.append('content_column', contentColumn.trim());
  }

  const mapping = {};
  if (titleColumn && typeof titleColumn === 'string' && titleColumn.trim()) {
    mapping[titleColumn.trim()] = 'title';
  }
  if (contentColumn && typeof contentColumn === 'string' && contentColumn.trim()) {
    mapping[contentColumn.trim()] = 'content';
  }

  if (Object.keys(mapping).length > 0) {
    formData.append('column_mapping', JSON.stringify(mapping));
  }

  const result = await httpRequest('/v1/company/import-csv-data', {
    method: 'POST',
    body: formData,
    signal,
  });
  return companyCsvImportResponseSchema.parse(result);
}

export async function listDatasets({ signal } = {}) {
  const result = await httpRequest('/v1/company/datasets', { signal });
  return datasetsResponseSchema.parse(result);
}
export const fetchDatasets = listDatasets;

export async function previewDatasetImport({ dataset, file }, { signal } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const result = await httpRequest(
    `/v1/company/datasets/${encodeURIComponent(dataset)}/imports/preview`,
    {
      method: 'POST',
      body: formData,
      signal,
    },
  );
  return importPreviewResponseSchema.parse(result);
}
export const fetchImportPreview = previewDatasetImport;

export async function importDataset({ dataset, file, mode = 'upsert' }, { signal } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  const result = await httpRequest(
    `/v1/company/datasets/${encodeURIComponent(dataset)}/imports`,
    {
      method: 'POST',
      body: formData,
      signal,
    },
  );
  return importDatasetResponseSchema.parse(result);
}

export async function downloadDatasetTemplate(datasetKey, { signal } = {}) {
  const authToken = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/v1/company/datasets/${encodeURIComponent(datasetKey)}/template`,
    {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new HttpError(`Failed to download template (${response.status})`, {
      status: response.status,
    });
  }

  const blob = await response.blob();
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetKey}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return blob;
}
