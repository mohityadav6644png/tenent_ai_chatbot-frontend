import { httpRequest } from '../httpClient.js';

export async function listConnections(options = {}) {
  return httpRequest('/v1/company/connections', options);
}

export async function previewConnection(payload, options = {}) {
  return httpRequest('/v1/company/connections/preview', {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function createConnection(payload, options = {}) {
  return httpRequest('/v1/company/connections', {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function acceptSuggestion(id, options = {}) {
  return httpRequest(`/v1/company/connections/${id}/accept`, {
    method: 'POST',
    ...options,
  });
}

export async function dismissSuggestion(id, options = {}) {
  return httpRequest(`/v1/company/connections/${id}/dismiss`, {
    method: 'POST',
    ...options,
  });
}

export async function refreshConnection(id, options = {}) {
  return httpRequest(`/v1/company/connections/${id}/refresh`, {
    method: 'POST',
    ...options,
  });
}

export async function deleteConnection(id, options = {}) {
  return httpRequest(`/v1/company/connections/${id}`, {
    method: 'DELETE',
    ...options,
  });
}

export async function triggerScan(options = {}) {
  return httpRequest('/v1/company/connections/scan', {
    method: 'POST',
    ...options,
  });
}

export async function getScanState(options = {}) {
  return httpRequest('/v1/company/connections/scan', options);
}

export async function markReviewed(id, options = {}) {
  return httpRequest(`/v1/company/connections/${id}/reviewed`, {
    method: 'POST',
    ...options,
  });
}
