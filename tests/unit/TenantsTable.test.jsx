import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listTenants, reactivateTenant, suspendTenant } from '../../src/api/v1/tenants.api.js';
import { TenantsPage } from '../../src/features/platform-admin/pages/TenantsPage.jsx';

vi.mock('../../src/api/v1/tenants.api.js', () => ({
  listTenants: vi.fn(),
  suspendTenant: vi.fn(),
  reactivateTenant: vi.fn(),
}));

const summary = {
  active_tenants: 12,
  api_uptime_pct: 99.9,
  avg_response_ms: 1900,
  ai_tokens_month: 4200000,
};
const tenantList = [
  { id: 'one', name: 'Northwind Retail', status: 'active', user_count: 1200, queries_month: 50000 },
  { id: 'two', name: 'Contoso Logistics', status: 'onboarding', user_count: 12, queries_month: 390 },
  { id: 'three', name: 'Fabrikam Foods', status: 'suspended', user_count: 0, queries_month: 0 },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TenantsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listTenants.mockResolvedValue({ summary, tenants: tenantList });
    suspendTenant.mockResolvedValue({ id: 'one', status: 'suspended' });
    reactivateTenant.mockResolvedValue({ id: 'three', status: 'active' });
  });

  it('renders four stat cards with formatted values', async () => {
    renderPage();

    expect(await screen.findByText('Active tenants')).toBeInTheDocument();
    expect(within(screen.getByText('Active tenants').closest('article')).getByText('12'))
      .toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('1.9 s')).toBeInTheDocument();
    expect(screen.getByText('4.2M')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('renders tenant badges and actions for each status', async () => {
    renderPage();

    expect(await screen.findByText('Northwind Retail')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Manage' })[0]).toHaveAttribute('href', '/platform/tenants/one');
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Manage' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('calls suspend only after confirmation', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Suspend Northwind Retail?')).toBeInTheDocument();
    expect(suspendTenant).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspend' }));
    await waitFor(() => expect(suspendTenant.mock.calls[0]?.[0]).toBe('one'));
  });

  it('shows empty and error states', async () => {
    listTenants.mockResolvedValueOnce({ summary, tenants: [] });
    const empty = renderPage();
    expect(await screen.findByText('No tenants yet.')).toBeInTheDocument();
    expect(screen.getByText('Onboard your first company.')).toBeInTheDocument();
    empty.unmount();

    listTenants.mockRejectedValueOnce(new Error('private backend details'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
    expect(screen.queryByText('private backend details')).not.toBeInTheDocument();
  });
});
