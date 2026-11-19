import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpRequest } from '../../src/api/httpClient.js';

describe('httpRequest CSRF handling', () => {
  beforeEach(() => {
    document.cookie = 'csrf_token=';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: { get: () => null },
      }),
    );
  });

  afterEach(() => {
    document.cookie = 'csrf_token=; Max-Age=0; path=/';
    vi.unstubAllGlobals();
  });

  it('sends the CSRF cookie as a header on state-changing requests', async () => {
    document.cookie = 'csrf_token=csrf-token-value';

    await httpRequest('/v1/internal/tenants', {
      method: 'POST',
      body: { company_name: 'Example Company' },
    });

    const [, options] = fetch.mock.calls[0];
    expect(options.headers['X-CSRF-Token']).toBe('csrf-token-value');
    expect(options.credentials).toBe('include');
  });

  it('does not send a CSRF header on safe requests', async () => {
    document.cookie = 'csrf_token=csrf-token-value';

    await httpRequest('/v1/internal/tenants');

    const [, options] = fetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('X-CSRF-Token');
  });

  it('extracts structured errors from the backend error envelope', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        request_id: 'request-1',
        status: 'error',
        error: {
          code: 'CSRF_FAILED',
          message: 'CSRF verification failed.',
          retryable: false,
        },
      }),
      headers: { get: () => null },
    });

    await expect(httpRequest('/v1/internal/tenants', { method: 'POST' }))
      .rejects.toMatchObject({
        status: 403,
        code: 'CSRF_FAILED',
        message: 'CSRF verification failed.',
      });
  });
});
