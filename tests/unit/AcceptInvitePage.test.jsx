import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/features/auth/AuthContext.jsx';
import { AcceptInvitePage } from '../../src/features/auth/pages/AcceptInvitePage.jsx';
import { LoginPage } from '../../src/features/auth/pages/LoginPage.jsx';
import * as authService from '../../src/features/auth/services/auth.service.js';

vi.mock('../../src/features/auth/services/auth.service.js', () => ({
  acceptInvite: vi.fn(),
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

function renderAcceptInvite(initialUrl = '/accept-invite?token=test-invite-token') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialUrl]}>
          <Routes>
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/admin/users" element={<p>Admin workspace destination</p>} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AcceptInvitePage and Onboarding Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Set Your Password heading, password fields and activate button when token is present', () => {
    renderAcceptInvite('/accept-invite?token=valid-token');
    expect(screen.getByRole('heading', { name: /set your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password & sign in/i })).toBeInTheDocument();
  });

  it('displays warning when token is missing from URL and provides link to Sign In', () => {
    renderAcceptInvite('/accept-invite');
    expect(screen.getByText(/invitation token is missing or invalid/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('validates password length and password match before submission', async () => {
    renderAcceptInvite('/accept-invite?token=valid-token');

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm password/i);
    const submitBtn = screen.getByRole('button', { name: /set password & sign in/i });

    // Too short
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/at least 10 characters long/i)).toBeInTheDocument();
    expect(authService.acceptInvite).not.toHaveBeenCalled();

    // Mismatched
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(authService.acceptInvite).not.toHaveBeenCalled();
  });

  it('submits token and password, calls acceptInvite and navigates to workspace', async () => {
    authService.acceptInvite.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Jane Admin',
      role: 'company_admin',
    });

    renderAcceptInvite('/accept-invite?token=my-secret-token');

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm password/i);
    const submitBtn = screen.getByRole('button', { name: /set password & sign in/i });

    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.acceptInvite).toHaveBeenCalledWith({
        token: 'my-secret-token',
        password: 'ValidPassword123!',
      });
    });

    expect(await screen.findByText('Admin workspace destination')).toBeInTheDocument();
  });

  it('redirects to /accept-invite when a token query parameter is present on /login', async () => {
    renderAcceptInvite('/login?token=forward-token');
    expect(await screen.findByRole('heading', { name: /set your password/i })).toBeInTheDocument();
  });

  it('preserves standard sign in form when visiting /login without token', async () => {
    renderAcceptInvite('/login');
    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('displays user-friendly error banner without leaking raw token when API call fails', async () => {
    authService.acceptInvite.mockRejectedValueOnce(new Error('Invalid, expired, or already used invitation token.'));

    renderAcceptInvite('/accept-invite?token=secret-token-12345');

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm password/i);
    const submitBtn = screen.getByRole('button', { name: /set password & sign in/i });

    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/invalid, expired, or already used invitation token/i)).toBeInTheDocument();
    expect(screen.queryByText(/secret-token-12345/)).not.toBeInTheDocument();
  });
});
