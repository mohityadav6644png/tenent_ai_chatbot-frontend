import { httpRequest } from '../httpClient.js';
import {
  companyDataInsertRequestSchema,
  companyDataInsertResponseSchema,
  companyCsvImportResponseSchema,
} from './schemas/company.schema.js';

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
