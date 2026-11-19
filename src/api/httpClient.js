import { API_BASE_URL } from '../config/env.js';

export class HttpError extends Error {
  constructor(message, { status, code, requestId, retryAfterSeconds, retryable, details } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
    this.retryAfter = retryAfterSeconds;
    this.retryable = retryable;
    this.details = details;
  }
}

const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getCsrfToken() {
  if (typeof document === 'undefined') return undefined;

  const csrfCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('csrf_token='));

  return csrfCookie?.slice('csrf_token='.length);
}

export async function httpRequest(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const requestId = crypto.randomUUID();
  const csrfProtectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const csrfToken = csrfProtectedMethods.includes(method.toUpperCase())
    ? getCsrfToken()
    : undefined;
  const authToken = headers.Authorization ? undefined : getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Request-ID': requestId,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(body === undefined || isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  });

  let payload = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      if (response.ok) {
        throw new HttpError('The server returned an invalid JSON response.', {
          status: response.status,
          requestId,
        });
      }
    }
  }
  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const errorDetails = payload?.error && typeof payload.error === 'object'
      ? payload.error
      : payload;
    throw new HttpError(errorDetails?.message || payload?.message || `Request failed (${response.status})`, {
      status: response.status,
      code: errorDetails?.code || payload?.code,
      requestId,
      retryAfterSeconds: errorDetails?.retry_after_seconds
        ?? errorDetails?.retry_after
        ?? payload?.retry_after_seconds
        ?? (retryAfterHeader ? Number(retryAfterHeader) : undefined),
      retryable: errorDetails?.retryable ?? payload?.retryable,
      details: errorDetails?.details ?? payload?.details,
    });
  }

  return payload;
}
