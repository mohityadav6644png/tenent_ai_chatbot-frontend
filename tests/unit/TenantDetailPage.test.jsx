import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTenant, reactivateTenant, suspendTenant } from '../../src/api/v1/tenants.api.js';
import { TenantDetailPage } from '../../src/features/platform-admin/pages/TenantDetailPage.jsx';

vi.mock('../../src/api/v1/tenants.api.js', () => ({
  getTenant: vi.fn(),
  listTenants: vi.fn(),
  reactivateTenant: vi.fn(),
  suspendTenant: vi.fn(),
}));

const tenantId = '10000000-0000-4000-8000-000000000001';
const tenant = {
  id: tenantId,
  name: 'Northwind Retail',
  status: 'active',
  stats: {
    user_count: 18,
    queries_month: 2340,
    ai_tokens_month: 410000,
    avg_response_ms: 1800,
  },
  admins: [
    { id: 'a1', name: 'Avery Johnson', email: 'avery@example.com', last_login_at: new Date().toISOString() },
    { id: 'a2', name: 'Morgan Lee', email: 'morgan@example.com', last_login_at: null },
  ],
};

function renderPage(id = tenantId) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/platform/tenants/${id}`]}>
        <Routes>
          <Route path="/platform/tenants/:tenantId" element={<TenantDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TenantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenant.mockResolvedValue(tenant);
    suspendTenant.mockResolvedValue({ id: tenantId, status: 'suspended' });
    reactivateTenant.mockResolvedValue({ id: tenantId, status: 'active' });
  });

  it('shows tenant status, formatted stats and company admins', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Northwind Retail' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('2,340')).toBeInTheDocument();
    expect(screen.getByText('410 K')).toBeInTheDocument();
    expect(screen.getByText('1.8 s')).toBeInTheDocument();
    expect(screen.getByText('Avery Johnson')).toBeInTheDocument();
    expect(screen.getByText('avery@example.com')).toBeInTheDocument();
    expect(screen.getByText('Morgan Lee')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByText(/^Today,/)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('confirms suspension before calling the API', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Suspend tenant' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Suspend Northwind Retail?')).toBeInTheDocument();
    expect(suspendTenant).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspend' }));
    await waitFor(() => expect(suspendTenant).toHaveBeenCalledWith(tenantId, expect.anything()));
    expect(getTenant).toHaveBeenCalledTimes(2);
  });

  it('offers immediate reactivation and hides actions during onboarding', async () => {
    getTenant.mockResolvedValueOnce({ ...tenant, status: 'suspended' });
    const suspended = renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Reactivate tenant' }));
    await waitFor(() => expect(reactivateTenant).toHaveBeenCalled());
    suspended.unmount();

    getTenant.mockResolvedValueOnce({ ...tenant, status: 'onboarding' });
    renderPage();
    await screen.findByRole('heading', { name: 'Northwind Retail' });
    expect(screen.queryByRole('button', { name: 'Suspend tenant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reactivate tenant' })).not.toBeInTheDocument();
  });

  it('shows empty admins and a not-found state for a 404', async () => {
    getTenant.mockResolvedValueOnce({ ...tenant, admins: [] });
    const empty = renderPage();
    expect(await screen.findByText('No admins yet. The invite may still be pending.'))
      .toBeInTheDocument();
    empty.unmount();

    getTenant.mockRejectedValueOnce({ status: 404 });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Tenant not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to tenants' }))
      .toHaveAttribute('href', '/platform/tenants');
  });
});
