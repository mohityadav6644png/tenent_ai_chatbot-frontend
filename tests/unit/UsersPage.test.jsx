import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelInvite,
  deactivateUser,
  listUsers,
  resendInvite,
} from '../../src/api/v1/users.api.js';
import { UsersPage } from '../../src/features/company-admin/pages/UsersPage.jsx';

vi.mock('../../src/api/v1/users.api.js', () => ({
  cancelInvite: vi.fn(),
  deactivateUser: vi.fn(),
  listUsers: vi.fn(),
  resendInvite: vi.fn(),
}));
vi.mock('../../src/features/auth/hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'user-self', name: 'Ravi Singh', role: 'company_admin', company_name: 'Acme Traders' },
  }),
}));

const userRows = [
  { id: 'user-self', name: 'Ravi Singh', email: 'ravi@acme.example', role: 'admin', status: 'active', is_self: true },
  { id: 'user-2', name: 'Priya Shah', email: 'priya@acme.example', role: 'admin', status: 'active', is_self: false },
  { id: 'user-3', name: 'Arjun Mehta', email: 'arjun@acme.example', role: 'employee', status: 'active', is_self: false },
  { id: 'invite-1', name: 'Neha Patel', email: 'neha@acme.example', role: 'employee', status: 'invite_pending', is_self: false },
];
const summary = { total_users: 3, admins: 2, pending_invites: 1 };

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><UsersPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsers.mockResolvedValue({ summary, users: userRows });
    deactivateUser.mockResolvedValue({ id: 'user-2', status: 'deactivated' });
    resendInvite.mockResolvedValue({ id: 'invite-1' });
    cancelInvite.mockResolvedValue(undefined);
  });

  it('renders three stats and a row with role and status badges', async () => {
    renderPage();

    expect(await screen.findByText('Total users')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText('Admin')).toHaveLength(2);
    expect(screen.getAllByText('Employee')).toHaveLength(2);
    expect(screen.getByText('Invite pending')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('shows You without actions and expected actions for other rows', async () => {
    renderPage();

    expect(await screen.findByText('Ravi Singh')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate Ravi Singh' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit Priya Shah' })).toHaveAttribute(
      'href',
      '/admin/users/user-2/edit',
    );
    expect(screen.getByRole('button', { name: 'Deactivate Priya Shah' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend invite to neha@acme.example' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel invite for neha@acme.example' })).toBeInTheDocument();
  });

  it('asks before deactivating, then calls the API only after confirmation', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate Priya Shah' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Deactivate Priya Shah?')).toBeInTheDocument();
    expect(deactivateUser).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(deactivateUser.mock.calls[0]?.[0]).toBe('user-2'));
  });

  it('confirms invite cancellation and resends immediately with a toast', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', {
      name: 'Cancel invite for neha@acme.example',
    }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Cancel the invite for neha@acme.example?')).toBeInTheDocument();
    expect(cancelInvite).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel invite' }));
    await waitFor(() => expect(cancelInvite.mock.calls[0]?.[0]).toBe('invite-1'));

    fireEvent.click(await screen.findByRole('button', {
      name: 'Resend invite to neha@acme.example',
    }));
    await waitFor(() => expect(resendInvite.mock.calls[0]?.[0]).toBe('invite-1'));
    expect(await screen.findByRole('status')).toHaveTextContent('Invite sent to neha@acme.example');
  });

  it('shows empty and mapped error states', async () => {
    listUsers.mockResolvedValueOnce({ summary: { total_users: 0, admins: 0, pending_invites: 0 }, users: [] });
    const empty = renderPage();
    expect(await screen.findByText('No users yet.')).toBeInTheDocument();
    expect(screen.getByText('Invite your first teammate.')).toBeInTheDocument();
    empty.unmount();

    listUsers.mockRejectedValueOnce({ code: 'FORBIDDEN' });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission to perform this action.',
    );
  });
});
