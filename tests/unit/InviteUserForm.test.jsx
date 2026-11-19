import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInvite, listUsers } from '../../src/api/v1/users.api.js';
import { InviteUserPage } from '../../src/features/company-admin/pages/InviteUserPage.jsx';
import { UsersPage } from '../../src/features/company-admin/pages/UsersPage.jsx';

vi.mock('../../src/api/v1/users.api.js', () => ({
  cancelInvite: vi.fn(),
  createInvite: vi.fn(),
  deactivateUser: vi.fn(),
  listUsers: vi.fn(),
  resendInvite: vi.fn(),
}));
vi.mock('../../src/features/auth/hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'demo-company-admin', name: 'Ravi Singh', role: 'company_admin', company_name: 'Acme Traders' },
  }),
}));

function renderInvite() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/users/invite']}>
        <Routes>
          <Route path="/admin/users/invite" element={<InviteUserPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillInviteForm() {
  fireEvent.change(screen.getByLabelText('Full name'), {
    target: { value: '  Meera Nair  ' },
  });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: '  MEERA@ACME.IN  ' },
  });
}

describe('InviteUserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsers.mockResolvedValue({
      summary: { total_users: 0, admins: 0, pending_invites: 1 },
      users: [],
    });
  });

  it('renders the heading, fields, default role and submit button', () => {
    renderInvite();

    expect(screen.getByRole('heading', { name: 'Invite user' })).toBeInTheDocument();
    expect(screen.getByText('They will get an email link to set a password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toHaveValue('employee');
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeInTheDocument();
  });

  it('shows validation errors and focuses the first invalid input', async () => {
    renderInvite();
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    expect(await screen.findByText('Enter at least 2 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    expect(createInvite).not.toHaveBeenCalled();
  });

  it('sends trimmed name and normalized email and navigates with a toast', async () => {
    createInvite.mockResolvedValue({ id: 'invite-new', status: 'invite_pending' });
    renderInvite();
    fillInviteForm();
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'admin' } });
    expect(screen.getByText('Admins can invite and deactivate users in your company.'))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(createInvite.mock.calls[0][0]).toEqual({
      name: 'Meera Nair',
      email: 'meera@acme.in',
      role: 'admin',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Invite sent to meera@acme.in');
  });

  it('shows a field error when the email belongs to an existing user', async () => {
    createInvite.mockRejectedValue({ code: 'USER_EXISTS', status: 409 });
    renderInvite();
    fillInviteForm();
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    expect(await screen.findByText('This person already has an account.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(listUsers).not.toHaveBeenCalled();
  });
});
