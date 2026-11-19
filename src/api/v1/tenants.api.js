import { httpRequest } from '../httpClient.js';
import {
  createTenantRequestSchema,
  createTenantResponseSchema,
  tenantActionResponseSchema,
  tenantDetailIdSchema,
  tenantDetailResponseSchema,
  tenantsResponseSchema,
} from './schemas/tenants.schema.js';

export async function listTenants({ signal } = {}) {
  return tenantsResponseSchema.parse(
    await httpRequest('/v1/internal/tenants', { signal }),
  );
}

export async function getTenant(id, { signal } = {}) {
  const tenantId = tenantDetailIdSchema.parse(id);
  return tenantDetailResponseSchema.parse(
    await httpRequest(`/v1/internal/tenants/${encodeURIComponent(tenantId)}`, { signal }),
  );
}

async function updateTenantStatus(id, action) {
  const result = await httpRequest(
    `/v1/internal/tenants/${encodeURIComponent(id)}/${action}`,
    { method: 'POST' },
  );
  return tenantActionResponseSchema.parse(result);
}

export const suspendTenant = (id) => updateTenantStatus(id, 'suspend');
export const reactivateTenant = (id) => updateTenantStatus(id, 'reactivate');

export async function createTenant(payload) {
  const request = createTenantRequestSchema.parse(payload);
  const result = await httpRequest('/v1/internal/tenants', {
    method: 'POST',
    body: request,
  });
  return createTenantResponseSchema.parse(result);
}
