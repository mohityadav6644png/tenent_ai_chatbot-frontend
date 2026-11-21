import { httpRequest } from '../httpClient.js';

export async function listCompanyFiles(options = {}) {
  return httpRequest('/v1/company/files', options);
}

export async function previewCompanyFile(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return httpRequest('/v1/company/files/preview', {
    method: 'POST',
    body: formData,
    ...options,
  });
}

export async function createCompanyFile({ file, meta }, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('meta', typeof meta === 'string' ? meta : JSON.stringify(meta));
  return httpRequest('/v1/company/files', {
    method: 'POST',
    body: formData,
    ...options,
  });
}

export async function getCompanyFile(id, options = {}) {
  return httpRequest(`/v1/company/files/${id}`, options);
}

export async function patchCompanyFile(id, updates, options = {}) {
  return httpRequest(`/v1/company/files/${id}`, {
    method: 'PATCH',
    body: updates,
    ...options,
  });
}

export async function uploadCompanyFile(id, file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return httpRequest(`/v1/company/files/${id}/upload`, {
    method: 'POST',
    body: formData,
    ...options,
  });
}

export async function deleteCompanyFile(id, options = {}) {
  return httpRequest(`/v1/company/files/${id}`, {
    method: 'DELETE',
    ...options,
  });
}
