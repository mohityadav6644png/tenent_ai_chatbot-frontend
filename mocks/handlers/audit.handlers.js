import { http, HttpResponse } from 'msw';

export const auditHandlers = [
  http.get('*/v1/internal/audit', ({ request }) => {
    const limit = Number(new URL(request.url).searchParams.get('limit')) || 5;
    const events = [
      { id: 'audit-1', occurred_at: '2026-11-04T10:42:00.000Z', actor: 'Platform owner', action: 'Tenant suspended', target: 'Northwind Retail', result: 'success' },
      { id: 'audit-2', occurred_at: '2026-11-04T10:20:00.000Z', actor: 'Platform owner', action: 'Invite sent', target: 'Contoso Logistics', result: 'logged' },
      { id: 'audit-3', occurred_at: '2026-11-04T09:55:00.000Z', actor: 'System', action: 'Health check', target: 'Azure OpenAI', result: 'retry' },
      { id: 'audit-4', occurred_at: '2026-11-04T09:30:00.000Z', actor: 'Platform owner', action: 'Tenant reactivation', target: 'Fabrikam Foods', result: 'failed' },
      { id: 'audit-5', occurred_at: '2026-11-04T09:05:00.000Z', actor: 'System', action: 'Session cleanup', target: 'Platform', result: 'success' },
    ];
    return HttpResponse.json({ events: events.slice(0, limit) });
  }),
];
