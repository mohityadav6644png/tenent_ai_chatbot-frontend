import { http, HttpResponse } from 'msw';
import { createTenantRequestSchema } from '../../src/api/v1/schemas/tenants.schema.js';

const demoTenants = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Northwind Retail', status: 'active', user_count: 84, queries_month: 18420 },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Contoso Logistics', status: 'onboarding', user_count: 12, queries_month: 390 },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Fabrikam Foods', status: 'suspended', user_count: 0, queries_month: 0 },
];

const demoTenantDetails = {
  '10000000-0000-4000-8000-000000000001': {
    stats: { user_count: 84, queries_month: 2340, ai_tokens_month: 410000, avg_response_ms: 1800 },
    admins: [
      { id: 'admin-1', name: 'Avery Johnson', email: 'avery@northwind.example', last_login_at: '2026-11-04T10:42:00.000Z' },
      { id: 'admin-2', name: 'Morgan Lee', email: 'morgan@northwind.example', last_login_at: null },
    ],
  },
  '10000000-0000-4000-8000-000000000002': {
    stats: { user_count: 12, queries_month: 390, ai_tokens_month: 82000, avg_response_ms: 2100 },
    admins: [],
  },
  '10000000-0000-4000-8000-000000000003': {
    stats: { user_count: 0, queries_month: 0, ai_tokens_month: 0, avg_response_ms: 0 },
    admins: [],
  },
};

export const tenantsHandlers = [
  http.get('*/v1/internal/tenants', () => HttpResponse.json({
    summary: {
      active_tenants: 12,
      api_uptime_pct: 99.9,
      avg_response_ms: 1900,
      ai_tokens_month: 4200000,
    },
    tenants: demoTenants,
  })),
  http.get('*/v1/internal/tenants/:id', ({ params }) => {
    const tenant = demoTenants.find((item) => item.id === params.id);
    const details = demoTenantDetails[params.id];
    if (!tenant || !details) {
      return HttpResponse.json({ code: 'TENANT_NOT_FOUND' }, { status: 404 });
    }
    return HttpResponse.json({
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      ...details,
    });
  }),
  http.post('*/v1/internal/tenants', async ({ request }) => {
    const body = await request.json().catch(() => null);
    const result = createTenantRequestSchema.safeParse(body);
    if (!result.success) {
      return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 422 });
    }
    if (result.data.company_name === 'Acme Traders') {
      return HttpResponse.json({ code: 'TENANT_EXISTS' }, { status: 409 });
    }
    const tenant = {
      id: crypto.randomUUID(),
      name: result.data.company_name,
      status: 'onboarding',
      user_count: 0,
      queries_month: 0,
    };
    demoTenants.unshift(tenant);
    demoTenantDetails[tenant.id] = {
      stats: { user_count: 0, queries_month: 0, ai_tokens_month: 0, avg_response_ms: 0 },
      admins: [],
    };
    return HttpResponse.json({ id: tenant.id, status: tenant.status }, { status: 201 });
  }),
  http.post('*/v1/internal/tenants/:id/suspend', ({ params }) => {
    const tenant = demoTenants.find((item) => item.id === params.id);
    if (!tenant) return HttpResponse.json({ code: 'TENANT_NOT_FOUND' }, { status: 404 });
    tenant.status = 'suspended';
    return HttpResponse.json({ id: tenant.id, status: tenant.status });
  }),
  http.post('*/v1/internal/tenants/:id/reactivate', ({ params }) => {
    const tenant = demoTenants.find((item) => item.id === params.id);
    if (!tenant) return HttpResponse.json({ code: 'TENANT_NOT_FOUND' }, { status: 404 });
    tenant.status = 'active';
    return HttpResponse.json({ id: tenant.id, status: tenant.status });
  }),
];
