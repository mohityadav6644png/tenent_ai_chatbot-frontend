import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTenant, listTenants } from '../../src/api/v1/tenants.api.js';
import { OnboardCompanyPage } from '../../src/features/platform-admin/pages/OnboardCompanyPage.jsx';
import { TenantsPage } from '../../src/features/platform-admin/pages/TenantsPage.jsx';

vi.mock('../../src/api/v1/tenants.api.js', () => ({
  createTenant: vi.fn(),
  listTenants: vi.fn(),
  suspendTenant: vi.fn(),
  reactivateTenant: vi.fn(),
}));

function renderOnboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/platform/tenants/new']}>
        <Routes>
          <Route path="/platform/tenants/new" element={<OnboardCompanyPage />} />
          <Route path="/platform/tenants" element={<TenantsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillForm() {
  fireEvent.change(screen.getByLabelText('Company name'), {
    target: { value: '  Shree Textiles  ' },
  });
  fireEvent.change(screen.getByLabelText('Company admin name'), {
    target: { value: '  Asha Rao  ' },
  });
  fireEvent.change(screen.getByLabelText('Company admin email'), {
    target: { value: '  ADMIN@COMPANY.COM  ' },
  });
  fireEvent.change(screen.getByLabelText('Query limit per month'), {
    target: { value: '10000' },
  });
}

describe('OnboardCompanyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listTenants.mockResolvedValue({
      summary: {
        active_tenants: 12,
        api_uptime_pct: 99.9,
        avg_response_ms: 1900,
        ai_tokens_month: 4200000,
      },
      tenants: [],
    });
  });

  it('renders the heading, all fields, default limit, and submit button', () => {
    renderOnboard();

    expect(screen.getByRole('heading', { name: 'Onboard company' })).toBeInTheDocument();
    expect(screen.getByText('Create a tenant and email its first admin an invite.'))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Company name')).toBeInTheDocument();
    expect(screen.getByLabelText('Company admin name')).toBeInTheDocument();
    expect(screen.getByLabelText('Company admin email')).toBeInTheDocument();
    expect(screen.getByLabelText('Query limit per month')).toHaveValue('5000');
    expect(screen.getByRole('button', { name: 'Create and send invite' })).toBeInTheDocument();
  });

  it('shows validation errors and focuses the first invalid field', async () => {
    renderOnboard();
    fireEvent.click(screen.getByRole('button', { name: 'Create and send invite' }));

    expect(await screen.findAllByText('Enter at least 2 characters.')).toHaveLength(2);
    expect(screen.getByLabelText('Company name')).toHaveFocus();
    expect(screen.getByLabelText('Company name')).toHaveAttribute('aria-invalid', 'true');
    expect(createTenant).not.toHaveBeenCalled();
  });

  it('sends trimmed values, lowercase email and numeric limit, then shows the invite toast', async () => {
    createTenant.mockResolvedValue({
      id: 'new-tenant',
      status: 'onboarding',
      invite_email_sent: true,
    });
    renderOnboard();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create and send invite' }));

    await screen.findByText('No tenants yet.');
    expect(createTenant.mock.calls[0][0]).toEqual({
      company_name: 'Shree Textiles',
      admin_name: 'Asha Rao',
      admin_email: 'admin@company.com',
      monthly_query_limit: 10000,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Invite sent to admin@company.com',
    );
  });

  it('warns when the tenant is created but SMTP does not send the invite', async () => {
    createTenant.mockResolvedValue({
      id: 'new-tenant',
      status: 'onboarding',
      invite_email_sent: false,
    });
    renderOnboard();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create and send invite' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Company created, but the invite email could not be sent to admin@company.com.',
    );
    expect(listTenants).toHaveBeenCalled();
  });

  it('shows the duplicate company error and preserves the values', async () => {
    createTenant.mockRejectedValue({ code: 'TENANT_EXISTS', status: 409 });
    renderOnboard();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create and send invite' }));

    expect(await screen.findByText('A company with this name already exists.'))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Company name')).toHaveValue('  Shree Textiles  ');
    expect(screen.getByLabelText('Company admin email')).toHaveValue('ADMIN@COMPANY.COM');
    expect(listTenants).not.toHaveBeenCalled();
  });

  it('shows a friendly form-level message for other failures', async () => {
    createTenant.mockRejectedValue({ code: 'RATE_LIMITED', status: 429 });
    renderOnboard();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create and send invite' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Try again in a few minutes.',
    );
  });

  it('explains that the user should sign in again when CSRF validation fails', async () => {
    createTenant.mockRejectedValue({ code: 'CSRF_FAILED', status: 403 });
    renderOnboard();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create and send invite' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your session security token is missing or expired. Sign in again and retry.',
    );
  });
});
